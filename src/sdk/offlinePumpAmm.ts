import { Program } from "@coral-xyz/anchor";
// Offline AMM SDK for building swap instructions
import { PumpAmm } from "../types/pump_amm";
import {
  AccountInfo,
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  bondingCurvePda,
  boostVaultAta,
  boostVaultAuthorityPda,
  coinCreatorVaultAtaPda,
  coinCreatorVaultAuthorityPda,
  GLOBAL_CONFIG_PDA,
  metadataPda,
  poolV2Pda,
  PUMP_AMM_EVENT_AUTHORITY_PDA,
  PUMP_AMM_FEE_CONFIG_PDA,
  PUMP_AMM_PROGRAM_ID,
  PUMP_EVENT_AUTHORITY_PDA,
  PUMP_FEE_CONFIG_PDA,
  PUMP_GLOBAL_PDA,
  PUMP_PROGRAM_ID,
  userVolumeAccumulatorPda,
} from "./pda";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createCloseAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { depositLpToken, depositToken0 } from "./deposit";
import { withdraw } from "./withdraw";
import { buyBaseInput, buyQuoteInput } from "./buy";
import { sellBaseInput, sellQuoteInput } from "./sell";
import { getBuybackFeeRecipient, getFeeRecipient } from "./fees";
import {
  CollectCoinCreatorFeeSolanaState,
  CommonSolanaState,
  CreatePoolSolanaState,
  DepositBaseAndLpTokenFromQuoteResult,
  DepositBaseResult,
  DepositQuoteAndLpTokenFromBaseResult,
  DepositQuoteResult,
  FeeConfig,
  GlobalConfig,
  GlobalVolumeAccumulator,
  LiquidityAccounts,
  LiquiditySolanaState,
  Pool,
  SwapAccounts,
  SwapSolanaState,
  UserVolumeAccumulator,
  WithdrawAutocompleteResult,
  WithdrawResult,
} from "../types/sdk";
import { getPumpAmmProgram, supportsTradeV2 } from "./util";
import {
  isSolCurve,
  MultiHopVenue,
  resolveMultiHopRoute,
  venueMints,
  venueQuoteTokenProgram,
} from "./multiHop";
import BN from "bn.js";

export const POOL_ACCOUNT_NEW_SIZE = 300;

/**
 * Serialized sizes of the current `Pool` and `GlobalConfig` layouts, discriminator included
 * (`Pool::SIZE`, `GlobalConfig::SIZE`). Older accounts are shorter (a pool is 211 / 243 / 244 /
 * 245 / 261 / 270 / 271 bytes, a GlobalConfig 907 / 940) and lack the trailing fields, which the
 * program's versioned readers return as 0 / false; `decodePool` and `decodeGlobalConfig` zero-pad
 * to these sizes so such accounts decode the same way. A pool grown by `extend_account` is
 * `POOL_ACCOUNT_NEW_SIZE`+ bytes and decodes unchanged.
 */
export const POOL_SIZE = 287;
export const GLOBAL_CONFIG_SIZE = 949;

/**
 * pump-fees `FeeConfig` account lengths, one per layout version. Every version is a prefix of
 * the next and the account length selects the version: a shorter account simply lacks the
 * trailing fields, which read as empty / zero (mirrors `FeeConfig::deserialize_versioned`).
 */
export const FEE_CONFIG_SIZE_PRE_STABLE = 2512;
export const FEE_CONFIG_SIZE_POST_STABLE = 4073;
export const FEE_CONFIG_SIZE_POST_EXOTIC = 4097;

// Fixed-layout prefix of `FeeConfig`: discriminator (8) + bump (1) + admin (32) + flat_fees.
const FEE_CONFIG_FEE_TIERS_OFFSET = 8 + 1 + 32 + 24;
// `Fees` is three u64; a `FeeTier` is a u128 market-cap threshold followed by `Fees`.
const FEES_SIZE = 24;
const FEE_TIER_SIZE = 16 + FEES_SIZE;

function padTrailing(data: Buffer, size: number): Buffer {
  return data.length >= size
    ? data
    : Buffer.concat([data, Buffer.alloc(size - data.length)]);
}

// End offset of a `Vec<FeeTier>` whose u32 length prefix sits at `offset`.
function feeTierVecEnd(data: Buffer, offset: number): number {
  if (offset + 4 > data.length) {
    throw new Error(
      `FeeConfig fee tier vector length at offset ${offset} runs past the account data (${data.length} bytes)`,
    );
  }
  const end = offset + 4 + data.readUInt32LE(offset) * FEE_TIER_SIZE;
  if (end > data.length) {
    throw new Error(
      `FeeConfig fee tier vector at offset ${offset} runs past the account data (${data.length} bytes)`,
    );
  }
  return end;
}

/**
 * Applies the program's length gate before handing the bytes to the full-layout Anchor decoder.
 * The program never reads past the last field of the version the account length selects, so any
 * stale bytes there (e.g. tiers left behind by a shrunken vector) must not be decoded as the
 * newer fields. Zeroing them makes the Anchor decoder yield `stableFeeTiers = []` and
 * `exoticFlatFees = 0` exactly where the program's older-version branches do.
 */
function versionedFeeConfigData(data: Buffer): Buffer {
  if (data.length < FEE_CONFIG_SIZE_PRE_STABLE) {
    throw new Error(
      `FeeConfig account is ${data.length} bytes; expected at least ${FEE_CONFIG_SIZE_PRE_STABLE}`,
    );
  }
  let end = feeTierVecEnd(data, FEE_CONFIG_FEE_TIERS_OFFSET);
  if (data.length >= FEE_CONFIG_SIZE_POST_STABLE) {
    end = feeTierVecEnd(data, end);
  }
  if (data.length >= FEE_CONFIG_SIZE_POST_EXOTIC) {
    end += FEES_SIZE;
    if (end > data.length) {
      throw new Error(
        `FeeConfig exotic flat fees run past the account data (${data.length} bytes)`,
      );
    }
  }
  return padTrailing(data.subarray(0, end), FEE_CONFIG_SIZE_POST_EXOTIC);
}

/** One user-side token account around a swap. */
interface SwapUserAccount {
  mint: PublicKey;
  account: PublicKey;
  tokenProgram: PublicKey;
  accountInfo: AccountInfo<Buffer> | null;
}

export interface TradeOptions {
  /**
   * Build `buy_v2` / `sell_v2` instead of `buy` / `sell` when the pool `supportsTradeV2`; other
   * pools keep the v1 instruction. Same pricing and limits either way. Defaults to false.
   */
  v2?: boolean;
}

export const OFFLINE_PUMP_AMM_PROGRAM = getPumpAmmProgram(
  null as any as Connection,
);

export class PumpAmmSdk {
  private readonly offlineProgram: Program<PumpAmm>;

  constructor() {
    this.offlineProgram = OFFLINE_PUMP_AMM_PROGRAM;
  }

  decodeGlobalConfig(
    globalConfigAccountInfo: AccountInfo<Buffer>,
  ): GlobalConfig {
    return this.offlineProgram.coder.accounts.decode<GlobalConfig>(
      "globalConfig",
      padTrailing(
        globalConfigAccountInfo.data,
        this.offlineProgram.account.globalConfig.size,
      ),
    );
  }

  decodeFeeConfig(feeConfigAccountInfo: AccountInfo<Buffer>): FeeConfig {
    return this.offlineProgram.coder.accounts.decode<FeeConfig>(
      "feeConfig",
      versionedFeeConfigData(feeConfigAccountInfo.data),
    );
  }

  decodePool(poolAccountInfo: AccountInfo<Buffer>) {
    return this.offlineProgram.coder.accounts.decode<Pool>(
      "pool",
      padTrailing(poolAccountInfo.data, this.offlineProgram.account.pool.size),
    );
  }

  decodePoolNullable(poolAccountInfo: AccountInfo<Buffer>) {
    try {
      return this.decodePool(poolAccountInfo);
    } catch (e) {
      console.warn("Failed to decode pool account", e);
      return null;
    }
  }

  decodeGlobalVolumeAccumulator(
    globalVolumeAccumulatorAccountInfo: AccountInfo<Buffer>,
  ): GlobalVolumeAccumulator {
    return this.offlineProgram.coder.accounts.decode<GlobalVolumeAccumulator>(
      "globalVolumeAccumulator",
      globalVolumeAccumulatorAccountInfo.data,
    );
  }

  decodeUserVolumeAccumulator(
    userVolumeAccumulatorAccountInfo: AccountInfo<Buffer>,
  ): UserVolumeAccumulator {
    return this.offlineProgram.coder.accounts.decode<UserVolumeAccumulator>(
      "userVolumeAccumulator",
      userVolumeAccumulatorAccountInfo.data,
    );
  }

  decodeUserVolumeAccumulatorNullable(
    userVolumeAccumulatorAccountInfo: AccountInfo<Buffer>,
  ): UserVolumeAccumulator | null {
    try {
      return this.decodeUserVolumeAccumulator(userVolumeAccumulatorAccountInfo);
    } catch (e) {
      console.warn("Failed to decode user volume accumulator", e);
      return null;
    }
  }

  /**
   * Builds `create_pool` (plus the pool ATA creates and wSOL wrapping it needs) for a
   * permissionless pool: `coin_creator` is the default key and `creator` is a wallet signer (a
   * canonical pump pool's creator is pump's pool-authority PDA, which signs only through pump's
   * `migrate` / `migrate_v2` CPI). `creatorFeeBps`, `canEditCreatorFee` and `isHolderReward` are
   * the instruction's three trailing arguments, always encoded (0 / false when unset), so
   * `create_pool` data is 10 bytes longer than before they existed; the program ignores trailing
   * bytes it does not read. The program stores the values for canonical pools only: a nonzero /
   * true `creatorFeeBps` / `canEditCreatorFee` on a permissionless pool fails with
   * `OnlyCanonicalPumpPoolsCanHaveCoinCreator`, and `isHolderReward` is stored as false on one.
   * The options exist to keep the encoding aligned with the IDL; canonical pools receive the
   * bonding curve's values from `migrate` / `migrate_v2`.
   */
  async createPoolInstructions(
    createPoolSolanaState: CreatePoolSolanaState,
    baseIn: BN,
    quoteIn: BN,
    {
      creatorFeeBps = new BN(0),
      canEditCreatorFee = false,
      isHolderReward = false,
    }: {
      creatorFeeBps?: BN;
      canEditCreatorFee?: boolean;
      isHolderReward?: boolean;
    } = {},
  ): Promise<TransactionInstruction[]> {
    const {
      index,
      creator,
      baseMint,
      quoteMint,
      poolKey,
      baseTokenProgram,
      quoteTokenProgram,
      userBaseTokenAccount,
      userQuoteTokenAccount,
      poolBaseTokenAccount,
      poolQuoteTokenAccount,
      userBaseAccountInfo,
      userQuoteAccountInfo,
      poolBaseAccountInfo,
      poolQuoteAccountInfo,
    } = createPoolSolanaState;

    return await this.withWsolAccounts(
      creator,
      baseMint,
      userBaseTokenAccount,
      this.accountExists(userBaseAccountInfo, baseTokenProgram),
      baseIn,
      quoteMint,
      userQuoteTokenAccount,
      this.accountExists(userQuoteAccountInfo, quoteTokenProgram),
      quoteIn,
      async () => {
        const instructions: TransactionInstruction[] = [];

        if (!this.accountExists(poolBaseAccountInfo, baseTokenProgram)) {
          instructions.push(
            createAssociatedTokenAccountIdempotentInstruction(
              creator,
              poolBaseTokenAccount,
              poolKey,
              baseMint,
              baseTokenProgram,
            ),
          );
        }

        if (!this.accountExists(poolQuoteAccountInfo, quoteTokenProgram)) {
          instructions.push(
            createAssociatedTokenAccountIdempotentInstruction(
              creator,
              poolQuoteTokenAccount,
              poolKey,
              quoteMint,
              quoteTokenProgram,
            ),
          );
        }

        instructions.push(
          await this.offlineProgram.methods
            .createPool(
              index,
              baseIn,
              quoteIn,
              SystemProgram.programId,
              false,
              { 0: false },
              { 0: creatorFeeBps },
              { 0: canEditCreatorFee },
              { 0: isHolderReward },
            )
            .accountsPartial({
              globalConfig: GLOBAL_CONFIG_PDA,
              baseMint,
              quoteMint,
              creator,
              userBaseTokenAccount,
              userQuoteTokenAccount,
              baseTokenProgram,
              quoteTokenProgram,
            })
            .instruction(),
        );

        return instructions;
      },
    );
  }

  async depositInstructionsInternal(
    liquiditySolanaState: LiquiditySolanaState,
    lpToken: BN,
    maxBase: BN,
    maxQuote: BN,
  ): Promise<TransactionInstruction[]> {
    const {
      pool,
      user,
      userPoolAccountInfo,
      userBaseTokenAccount,
      userQuoteTokenAccount,
      userPoolTokenAccount,
      userBaseAccountInfo,
      userQuoteAccountInfo,
      baseTokenProgram,
      quoteTokenProgram,
    } = liquiditySolanaState;

    const { baseMint, quoteMint, lpMint } = pool;

    const liquidityAccounts = this.liquidityAccounts(liquiditySolanaState);

    return await this.withFixPoolInstructions(
      liquiditySolanaState,
      async () => {
        return await this.withWsolAccounts(
          user,
          baseMint,
          userBaseTokenAccount,
          this.accountExists(userBaseAccountInfo, baseTokenProgram),
          maxBase,
          quoteMint,
          userQuoteTokenAccount,
          this.accountExists(userQuoteAccountInfo, quoteTokenProgram),
          maxQuote,
          async () => {
            const instructions: TransactionInstruction[] = [];

            if (
              !this.accountExists(userPoolAccountInfo, TOKEN_2022_PROGRAM_ID)
            ) {
              instructions.push(
                createAssociatedTokenAccountIdempotentInstruction(
                  user,
                  userPoolTokenAccount,
                  user,
                  lpMint,
                  TOKEN_2022_PROGRAM_ID,
                ),
              );
            }

            instructions.push(
              await this.offlineProgram.methods
                .deposit(lpToken, maxBase, maxQuote)
                .accounts(liquidityAccounts)
                .instruction(),
            );

            return instructions;
          },
        );
      },
    );
  }

  private async withWsolAccounts(
    user: PublicKey,
    baseMint: PublicKey,
    userBaseAta: PublicKey,
    userBaseAtaExists: boolean,
    baseAmount: BN,
    quoteMint: PublicKey,
    userQuoteAta: PublicKey,
    userQuoteAtaExists: boolean,
    quoteAmount: BN,
    block: () => Promise<TransactionInstruction[]>,
  ) {
    return await this.withWsolAccount(
      user,
      user,
      baseMint,
      userBaseAta,
      userBaseAtaExists,
      baseAmount,
      async () =>
        this.withWsolAccount(
          user,
          user,
          quoteMint,
          userQuoteAta,
          userQuoteAtaExists,
          quoteAmount,
          block,
        ),
    );
  }

  /**
   * Creates `ata` (the associated token account of `owner` for `mint` under `tokenProgram`) when
   * it does not exist yet; any mint and either token program.
   */
  private ensureAtaInstructions(
    payer: PublicKey,
    owner: PublicKey,
    mint: PublicKey,
    ata: PublicKey,
    ataExists: boolean,
    tokenProgram: PublicKey,
  ): TransactionInstruction[] {
    return ataExists
      ? []
      : [
          createAssociatedTokenAccountIdempotentInstruction(
            payer,
            ata,
            owner,
            mint,
            tokenProgram,
          ),
        ];
  }

  /**
   * Runs `block` with the wSOL handling a legacy-WSOL leg needs: the user's wSOL ATA is created
   * when missing, funded with `amount` lamports and closed again afterwards to unwrap. For any
   * other mint `block` runs alone; that ATA holds the user's own tokens and is left as is.
   */
  private async withWsolAccount(
    payer: PublicKey,
    user: PublicKey,
    mint: PublicKey,
    ata: PublicKey,
    ataExists: boolean,
    amount: BN,
    block: () => Promise<TransactionInstruction[]>,
  ): Promise<TransactionInstruction[]> {
    const instructions: TransactionInstruction[] = [];

    if (mint.equals(NATIVE_MINT)) {
      instructions.push(
        ...this.ensureAtaInstructions(
          payer,
          user,
          NATIVE_MINT,
          ata,
          ataExists,
          TOKEN_PROGRAM_ID,
        ),
      );

      if (amount.gtn(0)) {
        instructions.push(
          SystemProgram.transfer({
            fromPubkey: user,
            toPubkey: ata,
            lamports: BigInt(amount.toString()),
          }),
          createSyncNativeInstruction(ata),
        );
      }
    }

    const blockInstructions = await block();
    instructions.push(...blockInstructions);

    if (mint.equals(NATIVE_MINT)) {
      instructions.push(
        createCloseAccountInstruction(
          ata,
          user,
          user,
          undefined,
          TOKEN_PROGRAM_ID,
        ),
      );
    }

    return instructions;
  }

  private accountExists(
    accountInfo: AccountInfo<Buffer> | null,
    owner: PublicKey,
  ): boolean {
    return accountInfo !== null && accountInfo.owner.equals(owner);
  }

  depositBaseInput(
    liquiditySolanaState: LiquiditySolanaState,
    base: BN,
    slippage: number,
  ): DepositBaseResult {
    const { pool, poolBaseTokenAccount } = liquiditySolanaState;

    const { token1, lpToken, maxToken0, maxToken1 } = depositToken0(
      base,
      slippage,
      new BN(poolBaseTokenAccount.amount.toString()),
      this.realQuoteReserves(liquiditySolanaState),
      pool.lpSupply,
    );

    return {
      quote: token1,
      lpToken,
      maxBase: maxToken0,
      maxQuote: maxToken1,
    };
  }

  depositQuoteInput(
    liquiditySolanaState: LiquiditySolanaState,
    quote: BN,
    slippage: number,
  ): DepositQuoteResult {
    const { pool, poolBaseTokenAccount } = liquiditySolanaState;

    const { token1, lpToken, maxToken0, maxToken1 } = depositToken0(
      quote,
      slippage,
      this.realQuoteReserves(liquiditySolanaState),
      new BN(poolBaseTokenAccount.amount.toString()),
      pool.lpSupply,
    );

    return {
      base: token1,
      lpToken,
      maxBase: maxToken1,
      maxQuote: maxToken0,
    };
  }

  async withdrawInstructionsInternal(
    liquiditySolanaState: LiquiditySolanaState,
    lpTokenAmountIn: BN,
    minBaseAmountOut: BN,
    minQuoteAmountOut: BN,
  ): Promise<TransactionInstruction[]> {
    const {
      pool,
      baseTokenProgram,
      quoteTokenProgram,
      user,
      userBaseAccountInfo,
      userQuoteAccountInfo,
      userBaseTokenAccount,
      userQuoteTokenAccount,
    } = liquiditySolanaState;

    const { baseMint, quoteMint } = pool;

    const liquidityAccounts = this.liquidityAccounts(liquiditySolanaState);

    return await this.withFixPoolInstructions(
      liquiditySolanaState,
      async () => {
        const instructions: TransactionInstruction[] = [];

        let baseWsolAtaCreated = false;

        if (!this.accountExists(userBaseAccountInfo, baseTokenProgram)) {
          instructions.push(
            createAssociatedTokenAccountIdempotentInstruction(
              user,
              userBaseTokenAccount,
              user,
              baseMint,
              baseTokenProgram,
            ),
          );

          if (baseMint.equals(NATIVE_MINT)) {
            baseWsolAtaCreated = true;
          }
        }

        let quoteWsolAtaCreated = false;

        if (!this.accountExists(userQuoteAccountInfo, quoteTokenProgram)) {
          instructions.push(
            createAssociatedTokenAccountIdempotentInstruction(
              user,
              userQuoteTokenAccount,
              user,
              quoteMint,
              quoteTokenProgram,
            ),
          );

          if (quoteMint.equals(NATIVE_MINT)) {
            quoteWsolAtaCreated = true;
          }
        }

        instructions.push(
          await this.offlineProgram.methods
            .withdraw(lpTokenAmountIn, minBaseAmountOut, minQuoteAmountOut)
            .accounts(liquidityAccounts)
            .instruction(),
        );

        if (baseWsolAtaCreated) {
          instructions.push(
            createCloseAccountInstruction(
              userBaseTokenAccount,
              user,
              user,
              undefined,
              TOKEN_PROGRAM_ID,
            ),
          );
        }

        if (quoteWsolAtaCreated) {
          instructions.push(
            createCloseAccountInstruction(
              userQuoteTokenAccount,
              user,
              user,
              undefined,
              TOKEN_PROGRAM_ID,
            ),
          );
        }

        return instructions;
      },
    );
  }

  withdrawInputs(
    liquiditySolanaState: LiquiditySolanaState,
    lpAmount: BN,
    slippage: number,
  ): WithdrawResult {
    const { pool, poolBaseTokenAccount } = liquiditySolanaState;

    return withdraw(
      lpAmount,
      slippage,
      new BN(poolBaseTokenAccount.amount.toString()),
      this.realQuoteReserves(liquiditySolanaState),
      pool.lpSupply,
    );
  }

  /**
   * The pool's quote liquidity: the vault balance less the fee buckets v2 trades left in it,
   * which deposits and withdrawals never touch (pump-amm `real_quote_reserves`).
   */
  private realQuoteReserves({
    pool,
    poolQuoteTokenAccount,
  }: LiquiditySolanaState): BN {
    return new BN(poolQuoteTokenAccount.amount.toString())
      .sub(pool.protocolFees)
      .sub(pool.creatorFees);
  }

  private liquidityAccounts(
    liquiditySolanaState: LiquiditySolanaState,
  ): LiquidityAccounts {
    const {
      poolKey,
      pool,
      user,
      userBaseTokenAccount,
      userQuoteTokenAccount,
      userPoolTokenAccount,
    } = liquiditySolanaState;

    const {
      baseMint,
      quoteMint,
      lpMint,
      poolBaseTokenAccount,
      poolQuoteTokenAccount,
    } = pool;

    return {
      pool: poolKey,
      globalConfig: GLOBAL_CONFIG_PDA,
      user,
      baseMint,
      quoteMint,
      lpMint,
      userBaseTokenAccount,
      userQuoteTokenAccount,
      userPoolTokenAccount,
      poolBaseTokenAccount,
      poolQuoteTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      token2022Program: TOKEN_2022_PROGRAM_ID,
      eventAuthority: PUMP_AMM_EVENT_AUTHORITY_PDA,
      program: PUMP_AMM_PROGRAM_ID,
    };
  }

  async buyInstructions(
    swapSolanaState: SwapSolanaState,
    baseOut: BN,
    maxQuoteIn: BN,
  ): Promise<TransactionInstruction[]> {
    return await this.withFixPoolInstructions(swapSolanaState, async () => {
      return await this.buyInstructionsNoPool(
        swapSolanaState,
        baseOut,
        maxQuoteIn,
      );
    });
  }

  async buyInstructionsNoPool(
    swapSolanaState: SwapSolanaState,
    baseOut: BN,
    maxQuoteIn: BN,
  ): Promise<TransactionInstruction[]> {
    const { pool } = swapSolanaState;

    const swapAccounts = this.swapAccounts(swapSolanaState);

    const {
      user,
      quoteMint,
      quoteTokenProgram,
      buybackFeeRecipient,
      buybackFeeRecipientTokenAccount,
    } = swapAccounts;
    const poolV2PdaKey = poolV2Pda(pool.baseMint);
    const remainingAccounts = [];
    if (pool.isCashbackCoin) {
      remainingAccounts.push({
        pubkey: getAssociatedTokenAddressSync(
          quoteMint,
          userVolumeAccumulatorPda(user),
          true,
          quoteTokenProgram,
        ),
        isWritable: true,
        isSigner: false,
      });
    }
    if (!pool.coinCreator.equals(PublicKey.default)) {
      remainingAccounts.push({
        pubkey: poolV2PdaKey,
        isWritable: false,
        isSigner: false,
      });
    }

    remainingAccounts.push(
      {
        pubkey: buybackFeeRecipient,
        isWritable: false,
        isSigner: false,
      },
      {
        pubkey: buybackFeeRecipientTokenAccount,
        isWritable: true,
        isSigner: false,
      },
    );

    const instruction = await this.offlineProgram.methods
      .buy(baseOut, maxQuoteIn, { 0: true })
      .accounts(swapAccounts)
      .remainingAccounts([...remainingAccounts])
      .instruction();

    return this.withBuyAccounts(swapSolanaState, maxQuoteIn, instruction);
  }

  /** The buy instruction `swap` with its user-side setup: quote in, base out. */
  private withBuyAccounts(
    swapSolanaState: SwapSolanaState,
    quoteIn: BN,
    swap: TransactionInstruction,
  ): Promise<TransactionInstruction[]> {
    const { user, pool } = swapSolanaState;
    return this.withSwapUserAccounts(
      user,
      {
        mint: pool.quoteMint,
        account: swapSolanaState.userQuoteTokenAccount,
        tokenProgram: swapSolanaState.quoteTokenProgram,
        accountInfo: swapSolanaState.userQuoteAccountInfo,
        amount: quoteIn,
      },
      {
        mint: pool.baseMint,
        account: swapSolanaState.userBaseTokenAccount,
        tokenProgram: swapSolanaState.baseTokenProgram,
        accountInfo: swapSolanaState.userBaseAccountInfo,
      },
      swap,
    );
  }

  /**
   * The user-side setup around a swap instruction: a legacy-WSOL input is wrapped (`input.amount`
   * lamports; the account is closed again afterwards), the output account is created when it is
   * the user's ATA and `accountInfo` does not show it, and a legacy-WSOL output is closed to
   * unwrap. A custom (non-ATA) account is never created: it must already exist.
   */
  private async withSwapUserAccounts(
    user: PublicKey,
    input: SwapUserAccount & { amount: BN },
    output: SwapUserAccount,
    swap: TransactionInstruction,
  ): Promise<TransactionInstruction[]> {
    const exists = ({
      mint,
      account,
      tokenProgram,
      accountInfo,
    }: SwapUserAccount) =>
      !account.equals(
        getAssociatedTokenAddressSync(mint, user, true, tokenProgram),
      ) || this.accountExists(accountInfo, tokenProgram);

    return this.withWsolAccount(
      user,
      user,
      input.mint,
      input.account,
      exists(input),
      input.amount,
      async () => [
        ...this.ensureAtaInstructions(
          user,
          user,
          output.mint,
          output.account,
          exists(output),
          output.tokenProgram,
        ),
        swap,
        ...(output.mint.equals(NATIVE_MINT)
          ? [
              createCloseAccountInstruction(
                output.account,
                user,
                user,
                undefined,
                TOKEN_PROGRAM_ID,
              ),
            ]
          : []),
      ],
    );
  }

  async buyBaseInput(
    swapSolanaState: SwapSolanaState,
    base: BN,
    slippage: number,
    options: TradeOptions = {},
  ): Promise<TransactionInstruction[]> {
    const {
      baseMint,
      baseMintAccount,
      feeConfig,
      globalConfig,
      pool,
      poolBaseAmount,
      poolQuoteAmount,
    } = swapSolanaState;
    const { coinCreator, creator } = pool;

    const { maxQuote } = buyBaseInput({
      base,
      slippage,
      baseReserve: poolBaseAmount,
      quoteReserve: poolQuoteAmount,
      virtualQuoteReserves: pool.virtualQuoteReserves,
      baseMintAccount,
      baseMint,
      coinCreator,
      creator,
      feeConfig,
      globalConfig,
      quoteMint: pool.quoteMint,
      isMayhemMode: pool.isMayhemMode,
      creatorFeeBps: pool.creatorFeeBps,
    });

    return this.routedBuyInstructions(swapSolanaState, base, maxQuote, options);
  }

  async buyQuoteInput(
    swapSolanaState: SwapSolanaState,
    quote: BN,
    slippage: number,
    options: TradeOptions = {},
  ): Promise<TransactionInstruction[]> {
    const {
      baseMint,
      baseMintAccount,
      feeConfig,
      globalConfig,
      pool,
      poolBaseAmount,
      poolQuoteAmount,
    } = swapSolanaState;
    const { coinCreator, creator } = pool;

    const { base, maxQuote } = buyQuoteInput({
      quote,
      slippage,
      baseReserve: poolBaseAmount,
      quoteReserve: poolQuoteAmount,
      virtualQuoteReserves: pool.virtualQuoteReserves,
      baseMintAccount,
      baseMint,
      coinCreator,
      creator,
      feeConfig,
      globalConfig,
      quoteMint: pool.quoteMint,
      isMayhemMode: pool.isMayhemMode,
      creatorFeeBps: pool.creatorFeeBps,
    });

    return this.routedBuyInstructions(swapSolanaState, base, maxQuote, options);
  }

  async sellInstructions(
    swapSolanaState: SwapSolanaState,
    baseAmountIn: BN,
    minQuoteAmountOut: BN,
  ): Promise<TransactionInstruction[]> {
    return await this.withFixPoolInstructions(swapSolanaState, async () => {
      return await this.sellInstructionsNoPool(
        swapSolanaState,
        baseAmountIn,
        minQuoteAmountOut,
      );
    });
  }

  private async withFixPoolInstructions(
    commonSolanaState: CommonSolanaState,
    block: () => Promise<TransactionInstruction[]>,
  ): Promise<TransactionInstruction[]> {
    const { poolAccountInfo, poolKey, user } = commonSolanaState;

    const instructions: TransactionInstruction[] = [];

    if (
      poolAccountInfo === null ||
      poolAccountInfo.data.length < POOL_ACCOUNT_NEW_SIZE
    ) {
      instructions.push(
        await this.offlineProgram.methods
          .extendAccount()
          .accountsPartial({
            account: poolKey,
            user,
          })
          .instruction(),
      );
    }

    return [...instructions, ...(await block())];
  }

  async sellInstructionsNoPool(
    swapSolanaState: SwapSolanaState,
    baseAmountIn: BN,
    minQuoteAmountOut: BN,
  ): Promise<TransactionInstruction[]> {
    const { pool } = swapSolanaState;

    const swapAccounts = this.swapAccounts(swapSolanaState);
    const poolV2PdaKey = poolV2Pda(pool.baseMint);
    const {
      user,
      quoteMint,
      quoteTokenProgram,
      buybackFeeRecipient,
      buybackFeeRecipientTokenAccount,
    } = swapAccounts;

    const remainingAccounts = [];
    if (pool.isCashbackCoin) {
      remainingAccounts.push(
        {
          pubkey: getAssociatedTokenAddressSync(
            quoteMint,
            userVolumeAccumulatorPda(user),
            true,
            quoteTokenProgram,
          ),
          isWritable: true,
          isSigner: false,
        },
        {
          pubkey: userVolumeAccumulatorPda(user),
          isWritable: true,
          isSigner: false,
        },
      );
    }
    if (!pool.coinCreator.equals(PublicKey.default)) {
      remainingAccounts.push({
        pubkey: poolV2PdaKey,
        isWritable: false,
        isSigner: false,
      });
    }

    remainingAccounts.push(
      {
        pubkey: buybackFeeRecipient,
        isWritable: false,
        isSigner: false,
      },
      {
        pubkey: buybackFeeRecipientTokenAccount,
        isWritable: true,
        isSigner: false,
      },
    );

    const instruction = await this.offlineProgram.methods
      .sell(baseAmountIn, minQuoteAmountOut)
      .accounts(swapAccounts)
      .remainingAccounts([...remainingAccounts])
      .instruction();

    return this.withSellAccounts(swapSolanaState, baseAmountIn, instruction);
  }

  /** The sell instruction `swap` with its user-side setup: base in, quote out. */
  private withSellAccounts(
    swapSolanaState: SwapSolanaState,
    baseIn: BN,
    swap: TransactionInstruction,
  ): Promise<TransactionInstruction[]> {
    const { user, pool } = swapSolanaState;
    return this.withSwapUserAccounts(
      user,
      {
        mint: pool.baseMint,
        account: swapSolanaState.userBaseTokenAccount,
        tokenProgram: swapSolanaState.baseTokenProgram,
        accountInfo: swapSolanaState.userBaseAccountInfo,
        amount: baseIn,
      },
      {
        mint: pool.quoteMint,
        account: swapSolanaState.userQuoteTokenAccount,
        tokenProgram: swapSolanaState.quoteTokenProgram,
        accountInfo: swapSolanaState.userQuoteAccountInfo,
      },
      swap,
    );
  }

  async sellBaseInput(
    swapSolanaState: SwapSolanaState,
    base: BN,
    slippage: number,
    options: TradeOptions = {},
  ): Promise<TransactionInstruction[]> {
    const {
      baseMint,
      baseMintAccount,
      feeConfig,
      globalConfig,
      pool,
      poolBaseAmount,
      poolQuoteAmount,
    } = swapSolanaState;
    const { coinCreator, creator } = pool;

    const { minQuote } = sellBaseInput({
      base,
      slippage,
      baseReserve: poolBaseAmount,
      quoteReserve: poolQuoteAmount,
      virtualQuoteReserves: pool.virtualQuoteReserves,
      feeBucketsTotal: pool.protocolFees.add(pool.creatorFees),
      baseMintAccount,
      baseMint,
      coinCreator,
      creator,
      feeConfig,
      globalConfig,
      quoteMint: pool.quoteMint,
      isMayhemMode: pool.isMayhemMode,
      creatorFeeBps: pool.creatorFeeBps,
    });

    return this.routedSellInstructions(
      swapSolanaState,
      base,
      minQuote,
      options,
    );
  }

  async sellQuoteInput(
    swapSolanaState: SwapSolanaState,
    quote: BN,
    slippage: number,
    options: TradeOptions = {},
  ): Promise<TransactionInstruction[]> {
    const {
      baseMint,
      baseMintAccount,
      feeConfig,
      globalConfig,
      pool,
      poolBaseAmount,
      poolQuoteAmount,
    } = swapSolanaState;
    const { coinCreator, creator } = pool;

    const { base, minQuote } = sellQuoteInput({
      quote,
      slippage,
      baseReserve: poolBaseAmount,
      quoteReserve: poolQuoteAmount,
      virtualQuoteReserves: pool.virtualQuoteReserves,
      feeBucketsTotal: pool.protocolFees.add(pool.creatorFees),
      baseMintAccount,
      baseMint,
      coinCreator,
      creator,
      feeConfig,
      globalConfig,
      quoteMint: pool.quoteMint,
      isMayhemMode: pool.isMayhemMode,
      creatorFeeBps: pool.creatorFeeBps,
    });

    return this.routedSellInstructions(
      swapSolanaState,
      base,
      minQuote,
      options,
    );
  }

  private routedBuyInstructions(
    swapSolanaState: SwapSolanaState,
    baseOut: BN,
    maxQuoteIn: BN,
    { v2 = false }: TradeOptions,
  ): Promise<TransactionInstruction[]> {
    return v2 && supportsTradeV2(swapSolanaState.pool)
      ? this.buyV2Instructions(swapSolanaState, baseOut, maxQuoteIn)
      : this.buyInstructions(swapSolanaState, baseOut, maxQuoteIn);
  }

  private routedSellInstructions(
    swapSolanaState: SwapSolanaState,
    baseIn: BN,
    minQuoteOut: BN,
    { v2 = false }: TradeOptions,
  ): Promise<TransactionInstruction[]> {
    return v2 && supportsTradeV2(swapSolanaState.pool)
      ? this.sellV2Instructions(swapSolanaState, baseIn, minQuoteOut)
      : this.sellInstructions(swapSolanaState, baseIn, minQuoteOut);
  }

  async extendAccount(
    account: PublicKey,
    user: PublicKey,
  ): Promise<TransactionInstruction> {
    return this.offlineProgram.methods
      .extendAccount()
      .accountsPartial({
        account,
        user,
      })
      .instruction();
  }

  async boostBuyAndBurnInstruction(
    poolKey: PublicKey,
    pool: Pool,
    authority: PublicKey,
    quoteAmountIn: BN,
    minBaseAmountBurned: BN,
    baseTokenProgram: PublicKey,
    quoteTokenProgram: PublicKey,
  ): Promise<TransactionInstruction> {
    const boostVaultAuthority = boostVaultAuthorityPda(poolKey);

    return this.offlineProgram.methods
      .boostBuyAndBurn(quoteAmountIn, minBaseAmountBurned)
      .accountsPartial({
        pool: poolKey,
        authority,
        globalConfig: GLOBAL_CONFIG_PDA,
        baseMint: pool.baseMint,
        quoteMint: pool.quoteMint,
        poolBaseTokenAccount: pool.poolBaseTokenAccount,
        poolQuoteTokenAccount: pool.poolQuoteTokenAccount,
        boostVaultAuthority,
        boostVault: boostVaultAta(
          boostVaultAuthority,
          pool.quoteMint,
          quoteTokenProgram,
        ),
        baseTokenProgram,
        quoteTokenProgram,
      })
      .instruction();
  }

  /**
   * Moves the creator's accumulated AMM fees, quoted in the state's `quoteMint`, from the creator
   * vault ATA to `coinCreatorTokenAccount`. The program transfers between two existing token
   * accounts and creates neither, so the vault ATA and, when it is the destination, the creator's
   * ATA are created here (rent paid by `payer`) when missing, under the quote mint's token
   * program. The program accepts any token account the creator owns as the destination, but
   * only an ATA can be created idempotently, so a custom `coinCreatorTokenAccount` must already
   * exist (an error is thrown otherwise). A wSOL payout is unwrapped by closing the creator's
   * ATA, but only when the creator pays for the transaction themselves.
   */
  async collectCoinCreatorFee(
    collectCoinCreatorFeeSolanaState: CollectCoinCreatorFeeSolanaState,
    payer: PublicKey | undefined = undefined,
  ): Promise<TransactionInstruction[]> {
    const {
      coinCreator,
      quoteMint,
      quoteTokenProgram,
      coinCreatorVaultAuthority,
      coinCreatorVaultAta,
      coinCreatorTokenAccount,
      coinCreatorVaultAtaAccountInfo,
      coinCreatorTokenAccountInfo,
    } = collectCoinCreatorFeeSolanaState;

    const actualPayer = payer ?? coinCreator;
    const shouldCloseCoinCreatorATA =
      quoteMint.equals(NATIVE_MINT) && coinCreator.equals(actualPayer);

    const coinCreatorTokenAccountExists = this.accountExists(
      coinCreatorTokenAccountInfo,
      quoteTokenProgram,
    );
    const coinCreatorTokenAccountIsAta = coinCreatorTokenAccount.equals(
      getAssociatedTokenAddressSync(
        quoteMint,
        coinCreator,
        true,
        quoteTokenProgram,
      ),
    );
    if (!coinCreatorTokenAccountExists && !coinCreatorTokenAccountIsAta) {
      throw new Error(
        `coinCreatorTokenAccount=${coinCreatorTokenAccount.toString()} does not exist; only the creator's ATA is created automatically`,
      );
    }

    const instructions: TransactionInstruction[] = [
      ...this.ensureAtaInstructions(
        actualPayer,
        coinCreatorVaultAuthority,
        quoteMint,
        coinCreatorVaultAta,
        this.accountExists(coinCreatorVaultAtaAccountInfo, quoteTokenProgram),
        quoteTokenProgram,
      ),
      ...this.ensureAtaInstructions(
        actualPayer,
        coinCreator,
        quoteMint,
        coinCreatorTokenAccount,
        coinCreatorTokenAccountExists,
        quoteTokenProgram,
      ),
      await this.offlineProgram.methods
        .collectCoinCreatorFee()
        .accountsPartial({
          coinCreator,
          coinCreatorTokenAccount,
          quoteMint,
          quoteTokenProgram,
        })
        .instruction(),
    ];

    if (shouldCloseCoinCreatorATA) {
      instructions.push(
        createCloseAccountInstruction(
          coinCreatorTokenAccount,
          coinCreator,
          coinCreator,
          undefined,
          TOKEN_PROGRAM_ID,
        ),
      );
    }

    return instructions;
  }

  /**
   * Moves a coin creator's accumulated AMM fees, quoted in `quoteMint`, into their pump creator
   * vault (the `creator-vault` PDA of the pump program), for coins whose creator fees are paid
   * out through that vault. The program unwraps a wSOL vault into the PDA itself and moves any
   * other quote into the PDA's quote ATA, which it creates (rent paid by `payer`) when missing;
   * `pump_creator_vault_ata` is part of the account list even for wSOL. `quoteTokenProgram`
   * must be the quote mint's owner program, SPL Token or Token-2022; every quote-side ATA is
   * derived under it.
   */
  async transferCreatorFeesToPumpV2Instruction({
    payer,
    coinCreator,
    quoteMint,
    quoteTokenProgram,
  }: {
    payer: PublicKey;
    coinCreator: PublicKey;
    quoteMint: PublicKey;
    quoteTokenProgram: PublicKey;
  }): Promise<TransactionInstruction> {
    return this.offlineProgram.methods
      .transferCreatorFeesToPumpV2()
      .accountsPartial({
        payer,
        quoteMint,
        tokenProgram: quoteTokenProgram,
        coinCreator,
      })
      .instruction();
  }

  /**
   * Builds `set_coin_creator`, the permissionless instruction that fills in a canonical pool's
   * coin creator from the base mint's Metaplex metadata (its first creator) or, when the metadata
   * lists none, from the bonding curve's creator; a no-op once the pool has one. With `baseMint`
   * the `metadata` and `bonding_curve` accounts are derived here (`metadataPda`,
   * `bondingCurvePda`). Without it they are left to Anchor's account resolver, which reads the
   * pool through the provider's connection (the offline program has none) and, with this IDL,
   * cannot decode a pre-upgrade 261-byte pool, so pass `baseMint` or use
   * `OnlinePumpAmmSdk.setCoinCreatorInstructions`. The program writes the whole `Pool` back, so a
   * pre-upgrade pool must be grown by `extend_account` first.
   */
  async setCoinCreator(
    pool: PublicKey,
    baseMint?: PublicKey,
  ): Promise<TransactionInstruction> {
    return this.offlineProgram.methods
      .setCoinCreator()
      .accountsPartial(
        baseMint === undefined
          ? { pool }
          : {
              pool,
              metadata: metadataPda(baseMint),
              bondingCurve: bondingCurvePda(baseMint),
            },
      )
      .instruction();
  }

  /**
   * `buy_v2`: buys exactly `baseOut` for at most `maxQuoteIn` (fees included) on a pool
   * `supportsTradeV2` accepts, with the same user-side accounts as `buyInstructions`. The protocol
   * and coin-creator fees stay in the pool's quote vault (`Pool.protocolFees` /
   * `Pool.creatorFees`, paid out by the sweeps); only the buyback slice of the protocol fee is paid
   * in the trade (none on a mayhem pool), to a listed buyback fee recipient's quote ATA, which
   * must already exist (v2 never creates it, and checks it even when the slice is 0). No
   * `extend_account` is prepended: the program grows a pre-upgrade pool itself.
   */
  async buyV2Instructions(
    swapSolanaState: SwapSolanaState,
    baseOut: BN,
    maxQuoteIn: BN,
  ): Promise<TransactionInstruction[]> {
    return this.withBuyAccounts(
      swapSolanaState,
      maxQuoteIn,
      await this.offlineProgram.methods
        .buyV2(baseOut, maxQuoteIn)
        .accountsStrict(this.tradeV2Accounts(swapSolanaState))
        .instruction(),
    );
  }

  /**
   * `buy_exact_quote_in_v2`: spends at most `spendableQuoteIn` (fees included) for at least
   * `minBaseOut`, which must be nonzero. Accounts and fee handling as `buyV2Instructions`.
   */
  async buyExactQuoteInV2Instructions(
    swapSolanaState: SwapSolanaState,
    spendableQuoteIn: BN,
    minBaseOut: BN,
  ): Promise<TransactionInstruction[]> {
    return this.withBuyAccounts(
      swapSolanaState,
      spendableQuoteIn,
      await this.offlineProgram.methods
        .buyExactQuoteInV2(spendableQuoteIn, minBaseOut)
        .accountsStrict(this.tradeV2Accounts(swapSolanaState))
        .instruction(),
    );
  }

  /**
   * `sell_v2`: sells exactly `baseIn` for at least `minQuoteOut` (fees deducted), with the same
   * user-side accounts as `sellInstructions`. Fee handling as `buyV2Instructions`; the buyback
   * slice leaves the pool vault.
   */
  async sellV2Instructions(
    swapSolanaState: SwapSolanaState,
    baseIn: BN,
    minQuoteOut: BN,
  ): Promise<TransactionInstruction[]> {
    return this.withSellAccounts(
      swapSolanaState,
      baseIn,
      await this.offlineProgram.methods
        .sellV2(baseIn, minQuoteOut)
        .accountsStrict(this.tradeV2Accounts(swapSolanaState))
        .instruction(),
    );
  }

  /**
   * `multi_hop_swap`: spends exactly `amountIn` of `inMint` along `venues` (canonical, non-mayhem
   * pump pools and pump bonding curves, every hop buying or every hop selling) and pays at
   * least `minAmountOut` of the final mint into the user's account (`multiHopSwapQuote` prices
   * it). The route is checked as the program checks it before anything is built
   * (`resolveMultiHopRoute`).
   *
   * `buybackFeeRecipient` is the buyback recipient *wallet* the route's protocol leg (first hop of
   * a buy route, last of a sell route) pays the buyback slice to, through its ATA for that hop's
   * quote mint, which must exist. It must be listed by the venue holding the leg: a pool leg
   * defaults to a `globalConfig.buybackFeeRecipients` entry (picked at random, as the v1 and v2
   * trades do, so every listed recipient needs that ATA); a curve leg checks pump's
   * `Global.buybackFeeRecipients`, which this SDK does not read, so it must be passed.
   *
   * The user's token accounts default to their ATAs; a custom account must exist. A legacy-WSOL
   * input is wrapped (and the account closed afterwards), except on a buy starting on a SOL
   * bonding curve: pump takes `amountIn` from the wallet as lamports, so the user's WSOL ATA is
   * only created when missing (it must exist) and the wallet needs `amountIn` plus rent in SOL.
   * A sell ending on a SOL curve pays into the user's WSOL ATA, which is likewise created and then
   * closed to unwrap. On a SOL protocol leg the buyback slice goes to the recipient's WSOL ATA. the output ATA is created when
   * `userOutAccountInfo` does not show it, and a legacy-WSOL output is closed to unwrap. No
   * compute-budget instruction is added: set a limit of about 50k CU per hop (the 200k default
   * does not cover four hops).
   */
  async multiHopSwapInstructions({
    user,
    inMint,
    venues,
    amountIn,
    minAmountOut,
    globalConfig,
    buybackFeeRecipient,
    userInTokenAccount,
    userOutTokenAccount,
    userInAccountInfo = null,
    userOutAccountInfo = null,
  }: {
    user: PublicKey;
    inMint: PublicKey;
    venues: MultiHopVenue[];
    amountIn: BN;
    minAmountOut: BN;
    globalConfig: GlobalConfig;
    buybackFeeRecipient?: PublicKey;
    userInTokenAccount?: PublicKey;
    userOutTokenAccount?: PublicKey;
    userInAccountInfo?: AccountInfo<Buffer> | null;
    userOutAccountInfo?: AccountInfo<Buffer> | null;
  }): Promise<TransactionInstruction[]> {
    if (amountIn.lten(0) || minAmountOut.lten(0)) {
      throw new Error("amountIn and minAmountOut must be positive.");
    }
    const { isBuy, mints } = resolveMultiHopRoute(inMint, venues);
    inMint = mints[0];
    const outMint = mints[mints.length - 1];
    const first = venues[0];
    const last = venues[venues.length - 1];
    // The user's mints sit on the quote side of a buy route's first venue and the base side of
    // its last one; the other way round on a sell route.
    const inTokenProgram = isBuy
      ? venueQuoteTokenProgram(first)
      : first.baseTokenProgram;
    const outTokenProgram = isBuy
      ? last.baseTokenProgram
      : venueQuoteTokenProgram(last);

    const protocolLeg = isBuy ? first : last;
    if (buybackFeeRecipient === undefined) {
      if (protocolLeg.kind === "curve") {
        throw new Error(
          "The route's protocol leg is a bonding curve: pass buybackFeeRecipient (a wallet listed in pump's Global.buybackFeeRecipients).",
        );
      }
      buybackFeeRecipient = getBuybackFeeRecipient(globalConfig);
    }

    const hopAccounts = venues.flatMap((venue) => {
      const { baseMint, quoteMint } = venueMints(venue);
      const venueKey =
        venue.kind === "pool" ? venue.poolKey : bondingCurvePda(baseMint);
      const [baseVault, quoteVault] =
        venue.kind === "pool"
          ? [venue.pool.poolBaseTokenAccount, venue.pool.poolQuoteTokenAccount]
          : [
              getAssociatedTokenAddressSync(
                baseMint,
                venueKey,
                true,
                venue.baseTokenProgram,
              ),
              getAssociatedTokenAddressSync(
                quoteMint,
                venueKey,
                true,
                venueQuoteTokenProgram(venue),
              ),
            ];
      return [
        { pubkey: baseMint, isSigner: false, isWritable: false },
        { pubkey: quoteMint, isSigner: false, isWritable: false },
        { pubkey: venueKey, isSigner: false, isWritable: true },
        { pubkey: baseVault, isSigner: false, isWritable: true },
        { pubkey: quoteVault, isSigner: false, isWritable: true },
      ];
    });

    const userIn =
      userInTokenAccount ??
      getAssociatedTokenAddressSync(inMint, user, true, inTokenProgram);
    const userOut =
      userOutTokenAccount ??
      getAssociatedTokenAddressSync(outMint, user, true, outTokenProgram);
    const swap = await this.offlineProgram.methods
      .multiHopSwap(amountIn, minAmountOut)
      .accountsStrict({
        user,
        userInTokenAccount: userIn,
        userOutTokenAccount: userOut,
        globalConfig: GLOBAL_CONFIG_PDA,
        feeConfig: PUMP_AMM_FEE_CONFIG_PDA,
        userVolumeAccumulator: userVolumeAccumulatorPda(user),
        buybackFeeRecipient: getAssociatedTokenAddressSync(
          venueMints(protocolLeg).quoteMint,
          buybackFeeRecipient,
          true,
          venueQuoteTokenProgram(protocolLeg),
        ),
        tokenProgram: TOKEN_PROGRAM_ID,
        token2022Program: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        eventAuthority: PUMP_AMM_EVENT_AUTHORITY_PDA,
        program: PUMP_AMM_PROGRAM_ID,
        pumpProgram: PUMP_PROGRAM_ID,
        pumpGlobal: PUMP_GLOBAL_PDA,
        pumpFeeConfig: PUMP_FEE_CONFIG_PDA,
        pumpEventAuthority: PUMP_EVENT_AUTHORITY_PDA,
      })
      .remainingAccounts(hopAccounts)
      .instruction();

    return this.withSwapUserAccounts(
      user,
      {
        mint: inMint,
        account: userIn,
        tokenProgram: inTokenProgram,
        accountInfo: userInAccountInfo,
        // A buy starting on a SOL curve pays from the wallet's lamports: the user's WSOL account
        // only has to exist, so it is created when missing but never funded.
        amount: isBuy && isSolCurve(first) ? new BN(0) : amountIn,
      },
      {
        mint: outMint,
        account: userOut,
        tokenProgram: outTokenProgram,
        accountInfo: userOutAccountInfo,
      },
      swap,
    );
  }

  /**
   * `sweep_protocol_fee`: pays a pool's `protocolFees` out of its quote vault to a protocol fee
   * recipient's quote ATA (a reserved one on a mayhem pool; created when missing).
   * Permissionless: `payer` signs and pays that ATA's rent and a pre-upgrade pool's realloc. A
   * no-op when the bucket is empty. `quoteTokenProgram` is the owner of `pool.quoteMint`.
   */
  async sweepProtocolFeeInstruction({
    payer,
    poolKey,
    pool,
    quoteTokenProgram,
    globalConfig,
  }: {
    payer: PublicKey;
    poolKey: PublicKey;
    pool: Pool;
    quoteTokenProgram: PublicKey;
    globalConfig: GlobalConfig;
  }): Promise<TransactionInstruction> {
    return this.offlineProgram.methods
      .sweepProtocolFee()
      .accountsStrict(
        this.sweepFeeAccounts(
          payer,
          poolKey,
          pool,
          quoteTokenProgram,
          getFeeRecipient(globalConfig, pool.isMayhemMode),
        ),
      )
      .instruction();
  }

  /**
   * `sweep_creator_fee`: pays a pool's `creatorFees` into the coin-creator vault of
   * `pool.coinCreator` (the vault `collectCoinCreatorFee` pays out from), otherwise as
   * `sweepProtocolFeeInstruction`. The programs refuse to change a coin creator or its fee shares
   * while the bucket is nonzero (pump-amm `CreatorFeesNotSwept`, pump-fees
   * `PoolCreatorFeesNotSwept`), so a CTO, a fee-sharing config creation or an `update_fee_shares`
   * on a coin with v2 volume must carry this instruction before it, in the same transaction.
   */
  async sweepCreatorFeeInstruction({
    payer,
    poolKey,
    pool,
    quoteTokenProgram,
  }: {
    payer: PublicKey;
    poolKey: PublicKey;
    pool: Pool;
    quoteTokenProgram: PublicKey;
  }): Promise<TransactionInstruction> {
    return this.offlineProgram.methods
      .sweepCreatorFee()
      .accountsStrict(
        this.sweepFeeAccounts(
          payer,
          poolKey,
          pool,
          quoteTokenProgram,
          coinCreatorVaultAuthorityPda(pool.coinCreator),
        ),
      )
      .instruction();
  }

  private sweepFeeAccounts(
    payer: PublicKey,
    poolKey: PublicKey,
    pool: Pool,
    quoteTokenProgram: PublicKey,
    recipient: PublicKey,
  ) {
    return {
      payer,
      globalConfig: GLOBAL_CONFIG_PDA,
      pool: poolKey,
      quoteMint: pool.quoteMint,
      quoteTokenProgram,
      poolQuoteTokenAccount: pool.poolQuoteTokenAccount,
      recipient,
      recipientTokenAccount: getAssociatedTokenAddressSync(
        pool.quoteMint,
        recipient,
        true,
        quoteTokenProgram,
      ),
      systemProgram: SystemProgram.programId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      eventAuthority: PUMP_AMM_EVENT_AUTHORITY_PDA,
      program: PUMP_AMM_PROGRAM_ID,
    };
  }

  /** The 17 accounts of `buy_v2` / `buy_exact_quote_in_v2` / `sell_v2`, in IDL order. */
  private tradeV2Accounts({
    globalConfig,
    poolKey,
    pool,
    baseTokenProgram,
    quoteTokenProgram,
    user,
    userBaseTokenAccount,
    userQuoteTokenAccount,
  }: SwapSolanaState) {
    return {
      pool: poolKey,
      user,
      globalConfig: GLOBAL_CONFIG_PDA,
      baseMint: pool.baseMint,
      quoteMint: pool.quoteMint,
      userBaseTokenAccount,
      userQuoteTokenAccount,
      poolBaseTokenAccount: pool.poolBaseTokenAccount,
      poolQuoteTokenAccount: pool.poolQuoteTokenAccount,
      baseTokenProgram,
      quoteTokenProgram,
      systemProgram: SystemProgram.programId,
      userVolumeAccumulator: userVolumeAccumulatorPda(user),
      feeConfig: PUMP_AMM_FEE_CONFIG_PDA,
      // Only the ATA: the program checks it is a listed recipient's canonical quote ATA.
      buybackFeeRecipient: getAssociatedTokenAddressSync(
        pool.quoteMint,
        getBuybackFeeRecipient(globalConfig),
        true,
        quoteTokenProgram,
      ),
      eventAuthority: PUMP_AMM_EVENT_AUTHORITY_PDA,
      program: PUMP_AMM_PROGRAM_ID,
    };
  }

  private swapAccounts(swapSolanaState: SwapSolanaState): SwapAccounts {
    const {
      globalConfig,
      poolKey,
      pool,
      baseTokenProgram,
      quoteTokenProgram,
      user,
      userBaseTokenAccount,
      userQuoteTokenAccount,
    } = swapSolanaState;

    const protocolFeeRecipient = getFeeRecipient(
      globalConfig,
      pool.isMayhemMode,
    );

    const buybackFeeRecipient = getBuybackFeeRecipient(globalConfig);

    const {
      baseMint,
      quoteMint,
      poolBaseTokenAccount,
      poolQuoteTokenAccount,
      coinCreator,
    } = pool;

    const coinCreatorVaultAuthority = coinCreatorVaultAuthorityPda(coinCreator);

    return {
      pool: poolKey,
      globalConfig: GLOBAL_CONFIG_PDA,
      user,
      baseMint,
      quoteMint,
      userBaseTokenAccount,
      userQuoteTokenAccount,
      poolBaseTokenAccount,
      poolQuoteTokenAccount,
      protocolFeeRecipient,
      protocolFeeRecipientTokenAccount: getAssociatedTokenAddressSync(
        quoteMint,
        protocolFeeRecipient,
        true,
        quoteTokenProgram,
      ),
      buybackFeeRecipient,
      buybackFeeRecipientTokenAccount: getAssociatedTokenAddressSync(
        quoteMint,
        buybackFeeRecipient,
        true,
        quoteTokenProgram,
      ),
      baseTokenProgram,
      quoteTokenProgram,
      systemProgram: SystemProgram.programId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      eventAuthority: PUMP_AMM_EVENT_AUTHORITY_PDA,
      program: PUMP_AMM_PROGRAM_ID,
      coinCreatorVaultAta: coinCreatorVaultAtaPda(
        coinCreatorVaultAuthority,
        quoteMint,
        quoteTokenProgram,
      ),
      coinCreatorVaultAuthority,
    };
  }

  async syncUserVolumeAccumulator(
    user: PublicKey,
  ): Promise<TransactionInstruction> {
    return await this.offlineProgram.methods
      .syncUserVolumeAccumulator()
      .accountsPartial({ user })
      .instruction();
  }

  async initUserVolumeAccumulator({
    payer,
    user,
  }: {
    payer: PublicKey;
    user: PublicKey;
  }): Promise<TransactionInstruction> {
    return await this.offlineProgram.methods
      .initUserVolumeAccumulator()
      .accountsPartial({ payer, user })
      .instruction();
  }

  async closeUserVolumeAccumulator(
    user: PublicKey,
  ): Promise<TransactionInstruction> {
    return await this.offlineProgram.methods
      .closeUserVolumeAccumulator()
      .accountsPartial({ user })
      .instruction();
  }

  // from pumpAmm
  async createAutocompleteInitialPoolPrice(
    initialBase: BN,
    initialQuote: BN,
  ): Promise<BN> {
    return initialQuote.div(initialBase);
  }

  async depositInstructions(
    liquiditySolanaState: LiquiditySolanaState,
    lpToken: BN,
    slippage: number,
  ): Promise<TransactionInstruction[]> {
    const { pool, poolBaseTokenAccount } = liquiditySolanaState;

    const { maxBase, maxQuote } = depositLpToken(
      lpToken,
      slippage,
      new BN(poolBaseTokenAccount.amount.toString()),
      this.realQuoteReserves(liquiditySolanaState),
      pool.lpSupply,
    );

    return this.depositInstructionsInternal(
      liquiditySolanaState,
      lpToken,
      maxBase,
      maxQuote,
    );
  }

  depositAutocompleteQuoteAndLpTokenFromBase(
    liquiditySolanaState: LiquiditySolanaState,
    base: BN,
    slippage: number,
  ): DepositQuoteAndLpTokenFromBaseResult {
    const { quote, lpToken } = this.depositBaseInput(
      liquiditySolanaState,
      base,
      slippage,
    );

    return {
      quote,
      lpToken,
    };
  }

  depositAutocompleteBaseAndLpTokenFromQuote(
    liquiditySolanaState: LiquiditySolanaState,
    quote: BN,
    slippage: number,
  ): DepositBaseAndLpTokenFromQuoteResult {
    const { base, lpToken } = this.depositQuoteInput(
      liquiditySolanaState,
      quote,
      slippage,
    );

    return {
      base,
      lpToken,
    };
  }

  async withdrawInstructions(
    liquiditySolanaState: LiquiditySolanaState,
    lpToken: BN,
    slippage: number,
  ): Promise<TransactionInstruction[]> {
    const { minBase, minQuote } = this.withdrawInputs(
      liquiditySolanaState,
      lpToken,
      slippage,
    );

    return this.withdrawInstructionsInternal(
      liquiditySolanaState,
      lpToken,
      minBase,
      minQuote,
    );
  }

  withdrawAutoCompleteBaseAndQuoteFromLpToken(
    liquiditySolanaState: LiquiditySolanaState,
    lpAmount: BN,
    slippage: number,
  ): WithdrawAutocompleteResult {
    const { base, quote } = this.withdrawInputs(
      liquiditySolanaState,
      lpAmount,
      slippage,
    );

    return {
      base,
      quote,
    };
  }
}

export const PUMP_AMM_SDK = new PumpAmmSdk();
