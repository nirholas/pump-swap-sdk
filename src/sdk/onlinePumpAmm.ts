import { Program } from "@coral-xyz/anchor";
import { PumpAmm } from "../types/pump_amm";
import {
  AccountInfo,
  Connection,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  canonicalPoolQuoteMint,
  coinCreatorVaultAtaPda,
  coinCreatorVaultAuthorityPda,
  feeSharingConfigPda,
  GLOBAL_CONFIG_PDA,
  GLOBAL_VOLUME_ACCUMULATOR_PDA,
  poolPda,
  PUMP_AMM_FEE_CONFIG_PDA,
  userVolumeAccumulatorPda,
} from "./pda";
import {
  AccountLayout,
  getAssociatedTokenAddressSync,
  MintLayout,
  NATIVE_MINT,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  unpackAccount,
  unpackMint,
} from "@solana/spl-token";
import {
  CollectCoinCreatorFeeSolanaState,
  CreatePoolSolanaState,
  FeeConfig,
  GlobalConfig,
  GlobalVolumeAccumulator,
  LiquiditySolanaState,
  Pool,
  SwapSolanaState,
  UserVolumeAccumulator,
} from "../types/sdk";
import { getPumpAmmProgram, isPumpPool } from "./util";
import BN from "bn.js";
import { MultiHopPoolQuoteHop } from "./multiHop";
import { currentDayTokens, totalUnclaimedTokens } from "./tokenIncentives";
import {
  OFFLINE_PUMP_AMM_PROGRAM,
  POOL_ACCOUNT_NEW_SIZE,
  PUMP_AMM_SDK,
} from "./offlinePumpAmm";

export class OnlinePumpAmmSdk {
  public readonly connection: Connection;
  private readonly program: Program<PumpAmm>;

  constructor(connection: Connection) {
    this.connection = connection;
    this.program = getPumpAmmProgram(connection);
  }

  async fetchGlobalConfigAccount(): Promise<GlobalConfig> {
    const accountInfo = await this.connection.getAccountInfo(GLOBAL_CONFIG_PDA);
    if (accountInfo === null) {
      throw new Error("Global config account not found");
    }
    return PUMP_AMM_SDK.decodeGlobalConfig(accountInfo);
  }

  async fetchFeeConfigAccount(): Promise<FeeConfig> {
    const accountInfo = await this.connection.getAccountInfo(
      PUMP_AMM_FEE_CONFIG_PDA,
    );
    if (accountInfo === null) {
      throw new Error("Fee config account not found");
    }
    return PUMP_AMM_SDK.decodeFeeConfig(accountInfo);
  }

  async fetchPool(pool: PublicKey): Promise<Pool> {
    const accountInfo = await this.connection.getAccountInfo(pool);
    if (accountInfo === null) {
      throw new Error("Pool account not found");
    }
    return PUMP_AMM_SDK.decodePool(accountInfo);
  }

  fetchGlobalVolumeAccumulator(): Promise<GlobalVolumeAccumulator> {
    return this.program.account.globalVolumeAccumulator.fetch(
      GLOBAL_VOLUME_ACCUMULATOR_PDA,
    );
  }

  fetchUserVolumeAccumulator(
    user: PublicKey,
  ): Promise<UserVolumeAccumulator | null> {
    return this.program.account.userVolumeAccumulator.fetchNullable(
      userVolumeAccumulatorPda(user),
    );
  }

  async createPoolSolanaState(
    index: number,
    creator: PublicKey,
    baseMint: PublicKey,
    quoteMint: PublicKey,
    userBaseTokenAccount: PublicKey | undefined = undefined,
    userQuoteTokenAccount: PublicKey | undefined = undefined,
  ): Promise<CreatePoolSolanaState> {
    const [globalConfigAccountInfo, baseMintAccountInfo, quoteMintAccountInfo] =
      await this.connection.getMultipleAccountsInfo([
        GLOBAL_CONFIG_PDA,
        baseMint,
        quoteMint,
      ]);

    if (globalConfigAccountInfo === null) {
      throw new Error("Global config account not found");
    }

    if (baseMintAccountInfo === null) {
      throw new Error(`baseMint=${baseMint.toString()} not found`);
    }

    if (quoteMintAccountInfo === null) {
      throw new Error(`quoteMint=${quoteMint.toString()} not found`);
    }

    const globalConfig = PUMP_AMM_SDK.decodeGlobalConfig(
      globalConfigAccountInfo,
    );

    const [baseTokenProgram, quoteTokenProgram] = [
      baseMintAccountInfo.owner,
      quoteMintAccountInfo.owner,
    ];

    const poolKey = poolPda(index, creator, baseMint, quoteMint);

    const poolBaseTokenAccount = getAssociatedTokenAddressSync(
      baseMint,
      poolKey,
      true,
      baseTokenProgram,
    );

    const poolQuoteTokenAccount = getAssociatedTokenAddressSync(
      quoteMint,
      poolKey,
      true,
      quoteTokenProgram,
    );

    const [poolBaseAccountInfo, poolQuoteAccountInfo] =
      await this.connection.getMultipleAccountsInfo([
        poolBaseTokenAccount,
        poolQuoteTokenAccount,
      ]);

    if (userBaseTokenAccount === undefined) {
      userBaseTokenAccount = getAssociatedTokenAddressSync(
        baseMint,
        creator,
        true,
        baseTokenProgram,
      );
    }

    if (userQuoteTokenAccount === undefined) {
      userQuoteTokenAccount = getAssociatedTokenAddressSync(
        quoteMint,
        creator,
        true,
        quoteTokenProgram,
      );
    }

    const [userBaseAccountInfo, userQuoteAccountInfo] =
      await this.connection.getMultipleAccountsInfo([
        userBaseTokenAccount,
        userQuoteTokenAccount,
      ]);

    return {
      index,
      creator,
      baseMint,
      quoteMint,
      globalConfig,
      poolKey,
      poolBaseTokenAccount,
      poolQuoteTokenAccount,
      baseTokenProgram,
      quoteTokenProgram,
      userBaseTokenAccount,
      userQuoteTokenAccount,
      userBaseAccountInfo,
      userQuoteAccountInfo,
      poolBaseAccountInfo,
      poolQuoteAccountInfo,
    };
  }

  async swapSolanaState(
    poolKey: PublicKey,
    user: PublicKey,
    userBaseTokenAccount: PublicKey | undefined = undefined,
    userQuoteTokenAccount: PublicKey | undefined = undefined,
  ): Promise<SwapSolanaState> {
    const [globalConfigAccountInfo, feeConfigAccountInfo, poolAccountInfo] =
      await this.connection.getMultipleAccountsInfo([
        GLOBAL_CONFIG_PDA,
        PUMP_AMM_FEE_CONFIG_PDA,
        poolKey,
      ]);

    if (globalConfigAccountInfo === null) {
      throw new Error("Global config account not found");
    }

    if (poolAccountInfo === null) {
      throw new Error("Pool account not found");
    }

    const globalConfig = PUMP_AMM_SDK.decodeGlobalConfig(
      globalConfigAccountInfo,
    );
    const feeConfig = feeConfigAccountInfo
      ? PUMP_AMM_SDK.decodeFeeConfig(feeConfigAccountInfo)
      : null;
    const pool = PUMP_AMM_SDK.decodePool(poolAccountInfo);

    const { baseMint, quoteMint, poolBaseTokenAccount, poolQuoteTokenAccount } =
      pool;

    const [
      baseMintAccountInfo,
      quoteMintAccountInfo,
      poolBaseAccountInfo,
      poolQuoteAccountInfo,
    ] = await this.connection.getMultipleAccountsInfo([
      baseMint,
      quoteMint,
      poolBaseTokenAccount,
      poolQuoteTokenAccount,
    ]);

    if (baseMintAccountInfo === null) {
      throw new Error(`baseMint=${baseMint.toString()} not found`);
    }

    const decodedBaseMintAccount = MintLayout.decode(baseMintAccountInfo.data);

    if (quoteMintAccountInfo === null) {
      throw new Error(`quoteMint=${quoteMint.toString()} not found`);
    }

    if (poolBaseAccountInfo === null) {
      throw new Error(
        `Pool base token account ${poolBaseTokenAccount.toString()} not found`,
      );
    }

    if (poolQuoteAccountInfo === null) {
      throw new Error(
        `Pool quote token account ${poolQuoteTokenAccount.toString()} not found`,
      );
    }

    const [baseTokenProgram, quoteTokenProgram] = [
      baseMintAccountInfo.owner,
      quoteMintAccountInfo.owner,
    ];

    const decodedPoolBaseTokenAccount = AccountLayout.decode(
      poolBaseAccountInfo.data,
    );
    const decodedPoolQuoteTokenAccount = AccountLayout.decode(
      poolQuoteAccountInfo.data,
    );

    if (userBaseTokenAccount === undefined) {
      userBaseTokenAccount = getAssociatedTokenAddressSync(
        baseMint,
        user,
        true,
        baseTokenProgram,
      );
    }

    if (userQuoteTokenAccount === undefined) {
      userQuoteTokenAccount = getAssociatedTokenAddressSync(
        quoteMint,
        user,
        true,
        quoteTokenProgram,
      );
    }

    const [userBaseAccountInfo, userQuoteAccountInfo] =
      await this.connection.getMultipleAccountsInfo([
        userBaseTokenAccount,
        userQuoteTokenAccount,
      ]);

    return {
      globalConfig,
      feeConfig,
      poolKey,
      poolAccountInfo,
      pool,
      poolBaseAmount: new BN(decodedPoolBaseTokenAccount.amount.toString()),
      poolQuoteAmount: new BN(decodedPoolQuoteTokenAccount.amount.toString()),
      baseTokenProgram,
      quoteTokenProgram,
      baseMint,
      baseMintAccount: decodedBaseMintAccount,
      user,
      userBaseTokenAccount,
      userQuoteTokenAccount,
      userBaseAccountInfo,
      userQuoteAccountInfo,
    };
  }

  async swapSolanaStateNoPool(
    poolKey: PublicKey,
    user: PublicKey,
    userBaseTokenAccount: PublicKey | undefined = undefined,
    userQuoteTokenAccount: PublicKey | undefined = undefined,
  ): Promise<SwapSolanaState> {
    const [globalConfigAccountInfo, feeConfigAccountInfo, poolAccountInfo] =
      await this.connection.getMultipleAccountsInfo([
        GLOBAL_CONFIG_PDA,
        PUMP_AMM_FEE_CONFIG_PDA,
        poolKey,
      ]);

    if (globalConfigAccountInfo === null) {
      throw new Error("Global config account not found");
    }

    if (poolAccountInfo === null) {
      throw new Error("Pool account not found");
    }

    const globalConfig = PUMP_AMM_SDK.decodeGlobalConfig(
      globalConfigAccountInfo,
    );
    const feeConfig = feeConfigAccountInfo
      ? PUMP_AMM_SDK.decodeFeeConfig(feeConfigAccountInfo)
      : null;
    const pool = PUMP_AMM_SDK.decodePool(poolAccountInfo);

    const { baseMint, quoteMint, poolBaseTokenAccount, poolQuoteTokenAccount } =
      pool;

    const [
      baseMintAccountInfo,
      quoteMintAccountInfo,
      poolBaseAccountInfo,
      poolQuoteAccountInfo,
    ] = await this.connection.getMultipleAccountsInfo([
      baseMint,
      quoteMint,
      poolBaseTokenAccount,
      poolQuoteTokenAccount,
    ]);

    if (baseMintAccountInfo === null) {
      throw new Error(`baseMint=${baseMint.toString()} not found`);
    }

    const decodedBaseMintAccount = MintLayout.decode(baseMintAccountInfo.data);

    if (quoteMintAccountInfo === null) {
      throw new Error(`quoteMint=${quoteMint.toString()} not found`);
    }

    if (poolBaseAccountInfo === null) {
      throw new Error(
        `Pool base token account ${poolBaseTokenAccount.toString()} not found`,
      );
    }

    if (poolQuoteAccountInfo === null) {
      throw new Error(
        `Pool quote token account ${poolQuoteTokenAccount.toString()} not found`,
      );
    }

    const [baseTokenProgram, quoteTokenProgram] = [
      baseMintAccountInfo.owner,
      quoteMintAccountInfo.owner,
    ];

    const decodedPoolBaseTokenAccount = AccountLayout.decode(
      poolBaseAccountInfo.data,
    );
    const decodedPoolQuoteTokenAccount = AccountLayout.decode(
      poolQuoteAccountInfo.data,
    );

    if (userBaseTokenAccount === undefined) {
      userBaseTokenAccount = getAssociatedTokenAddressSync(
        baseMint,
        user,
        true,
        baseTokenProgram,
      );
    }

    if (userQuoteTokenAccount === undefined) {
      userQuoteTokenAccount = getAssociatedTokenAddressSync(
        quoteMint,
        user,
        true,
        quoteTokenProgram,
      );
    }

    const [userBaseAccountInfo, userQuoteAccountInfo] =
      await this.connection.getMultipleAccountsInfo([
        userBaseTokenAccount,
        userQuoteTokenAccount,
      ]);

    return {
      globalConfig,
      feeConfig,
      poolKey,
      poolAccountInfo,
      pool,
      poolBaseAmount: new BN(decodedPoolBaseTokenAccount.amount.toString()),
      poolQuoteAmount: new BN(decodedPoolQuoteTokenAccount.amount.toString()),
      baseTokenProgram,
      quoteTokenProgram,
      baseMint,
      baseMintAccount: decodedBaseMintAccount,
      user,
      userBaseTokenAccount,
      userQuoteTokenAccount,
      userBaseAccountInfo,
      userQuoteAccountInfo,
    };
  }

  async liquiditySolanaState(
    poolKey: PublicKey,
    user: PublicKey,
    userBaseTokenAccount: PublicKey | undefined = undefined,
    userQuoteTokenAccount: PublicKey | undefined = undefined,
    userPoolTokenAccount: PublicKey | undefined = undefined,
  ): Promise<LiquiditySolanaState> {
    const [globalConfigAccountInfo, poolAccountInfo] =
      await this.connection.getMultipleAccountsInfo([
        GLOBAL_CONFIG_PDA,
        poolKey,
      ]);

    if (globalConfigAccountInfo === null) {
      throw new Error("Global config account not found");
    }

    if (poolAccountInfo === null) {
      throw new Error("Pool account not found");
    }

    const globalConfig = PUMP_AMM_SDK.decodeGlobalConfig(
      globalConfigAccountInfo,
    );
    const pool = PUMP_AMM_SDK.decodePool(poolAccountInfo);

    const {
      baseMint,
      quoteMint,
      lpMint,
      poolBaseTokenAccount,
      poolQuoteTokenAccount,
    } = pool;

    const [
      baseMintAccountInfo,
      quoteMintAccountInfo,
      poolBaseAccountInfo,
      poolQuoteAccountInfo,
    ] = await this.connection.getMultipleAccountsInfo([
      baseMint,
      quoteMint,
      poolBaseTokenAccount,
      poolQuoteTokenAccount,
    ]);

    if (baseMintAccountInfo === null) {
      throw new Error(`baseMint=${baseMint.toString()} not found`);
    }

    if (quoteMintAccountInfo === null) {
      throw new Error(`quoteMint=${quoteMint.toString()} not found`);
    }

    if (poolBaseAccountInfo === null) {
      throw new Error(
        `Pool base token account ${poolBaseTokenAccount.toString()} not found`,
      );
    }

    if (poolQuoteAccountInfo === null) {
      throw new Error(
        `Pool quote token account ${poolQuoteTokenAccount.toString()} not found`,
      );
    }

    const [baseTokenProgram, quoteTokenProgram] = [
      baseMintAccountInfo.owner,
      quoteMintAccountInfo.owner,
    ];

    const decodedPoolBaseTokenAccount = AccountLayout.decode(
      poolBaseAccountInfo.data,
    );
    const decodedPoolQuoteTokenAccount = AccountLayout.decode(
      poolQuoteAccountInfo.data,
    );

    if (userBaseTokenAccount === undefined) {
      userBaseTokenAccount = getAssociatedTokenAddressSync(
        baseMint,
        user,
        true,
        baseTokenProgram,
      );
    }

    if (userQuoteTokenAccount === undefined) {
      userQuoteTokenAccount = getAssociatedTokenAddressSync(
        quoteMint,
        user,
        true,
        quoteTokenProgram,
      );
    }

    if (userPoolTokenAccount === undefined) {
      userPoolTokenAccount = getAssociatedTokenAddressSync(
        lpMint,
        user,
        true,
        TOKEN_2022_PROGRAM_ID,
      );
    }

    const [userBaseAccountInfo, userQuoteAccountInfo, userPoolAccountInfo] =
      await this.connection.getMultipleAccountsInfo([
        userBaseTokenAccount,
        userQuoteTokenAccount,
        userPoolTokenAccount,
      ]);

    return {
      globalConfig,
      poolKey,
      poolAccountInfo,
      pool,
      poolBaseTokenAccount: decodedPoolBaseTokenAccount,
      poolQuoteTokenAccount: decodedPoolQuoteTokenAccount,
      baseTokenProgram,
      quoteTokenProgram,
      user,
      userBaseTokenAccount,
      userQuoteTokenAccount,
      userPoolTokenAccount,
      userBaseAccountInfo,
      userQuoteAccountInfo,
      userPoolAccountInfo,
    };
  }

  /**
   * The quote mint a creator vault is keyed by and the token program owning it. A bonding
   * curve's zero key (a SOL coin's `quote_mint`) is normalized to legacy WSOL, as
   * `canonicalPumpPoolPda` does. The program is `quoteTokenProgram` when given, SPL Token for
   * WSOL (no fetch), otherwise the mint account's owner, which must be SPL Token or Token-2022
   * (what the on-chain `quote_token_program` interface accepts), so an existing non-mint account
   * such as a wallet or the System Program can never be mistaken for a token program.
   */
  private async resolveQuote(
    quoteMint: PublicKey,
    quoteTokenProgram: PublicKey | undefined,
  ): Promise<{ quoteMint: PublicKey; quoteTokenProgram: PublicKey }> {
    quoteMint = canonicalPoolQuoteMint(quoteMint);
    if (quoteTokenProgram !== undefined) {
      return { quoteMint, quoteTokenProgram };
    }
    if (quoteMint.equals(NATIVE_MINT)) {
      return { quoteMint, quoteTokenProgram: TOKEN_PROGRAM_ID };
    }
    const quoteMintAccountInfo =
      await this.connection.getAccountInfo(quoteMint);
    if (quoteMintAccountInfo === null) {
      throw new Error(`quoteMint=${quoteMint.toString()} not found`);
    }
    const owner = quoteMintAccountInfo.owner;
    if (
      !owner.equals(TOKEN_PROGRAM_ID) &&
      !owner.equals(TOKEN_2022_PROGRAM_ID)
    ) {
      throw new Error(
        `quoteMint=${quoteMint.toString()} is not an SPL Token or Token-2022 mint (owner ${owner.toString()})`,
      );
    }
    return { quoteMint, quoteTokenProgram: owner };
  }

  /**
   * Everything `PumpAmmSdk.collectCoinCreatorFee` needs to pay out the creator's AMM fees quoted
   * in `quoteMint` (WSOL by default; a bonding curve's zero key is accepted for SOL coins).
   * `quoteTokenProgram` is resolved from the mint when omitted. `coinCreatorTokenAccount`
   * defaults to the creator's ATA for the quote, the only destination the builder creates when
   * it is missing; any other destination must already exist.
   */
  async collectCoinCreatorFeeSolanaState(
    coinCreator: PublicKey,
    coinCreatorTokenAccount: PublicKey | undefined = undefined,
    quoteMint: PublicKey = NATIVE_MINT,
    quoteTokenProgram: PublicKey | undefined = undefined,
  ): Promise<CollectCoinCreatorFeeSolanaState> {
    ({ quoteMint, quoteTokenProgram } = await this.resolveQuote(
      quoteMint,
      quoteTokenProgram,
    ));

    let coinCreatorVaultAuthority = coinCreatorVaultAuthorityPda(coinCreator);

    let coinCreatorVaultAta = coinCreatorVaultAtaPda(
      coinCreatorVaultAuthority,
      quoteMint,
      quoteTokenProgram,
    );

    if (coinCreatorTokenAccount === undefined) {
      coinCreatorTokenAccount = getAssociatedTokenAddressSync(
        quoteMint,
        coinCreator,
        true,
        quoteTokenProgram,
      );
    }

    const [coinCreatorVaultAtaAccountInfo, coinCreatorTokenAccountInfo] =
      await this.connection.getMultipleAccountsInfo([
        coinCreatorVaultAta,
        coinCreatorTokenAccount,
      ]);

    return {
      coinCreator,
      quoteMint,
      quoteTokenProgram,
      coinCreatorVaultAuthority,
      coinCreatorVaultAta,
      coinCreatorTokenAccount,
      coinCreatorVaultAtaAccountInfo,
      coinCreatorTokenAccountInfo,
    };
  }

  /**
   * The creator's uncollected AMM fees quoted in `quoteMint` (WSOL by default; a bonding curve's
   * zero key is accepted for SOL coins): the balance of the creator vault ATA, or zero when it
   * does not exist. `quoteTokenProgram` is resolved from the mint when omitted.
   */
  async getCoinCreatorVaultBalance(
    coinCreator: PublicKey,
    quoteMint: PublicKey = NATIVE_MINT,
    quoteTokenProgram: PublicKey | undefined = undefined,
  ): Promise<BN> {
    ({ quoteMint, quoteTokenProgram } = await this.resolveQuote(
      quoteMint,
      quoteTokenProgram,
    ));

    const coinCreatorVaultAta = coinCreatorVaultAtaPda(
      coinCreatorVaultAuthorityPda(coinCreator),
      quoteMint,
      quoteTokenProgram,
    );

    return this.vaultAtaBalance(
      coinCreatorVaultAta,
      await this.connection.getAccountInfo(coinCreatorVaultAta),
      quoteTokenProgram,
    );
  }

  /**
   * The creator's uncollected AMM fees for every quote in `quotes`, keyed by the quote mint
   * (base58), in one account fetch per 100 quotes. Callers enumerating every quote mint a vault
   * may hold (the Global whitelist plus the QuoteControl list, plus WSOL) pass each mint with its
   * owner token program; a missing vault ATA reads as zero. Mints are used as given (no zero-key
   * normalization), so every entry lands under its own key.
   */
  async getCoinCreatorVaultBalances(
    coinCreator: PublicKey,
    quotes: { mint: PublicKey; tokenProgram: PublicKey }[],
  ): Promise<Map<string, BN>> {
    const coinCreatorVaultAuthority = coinCreatorVaultAuthorityPda(coinCreator);
    const coinCreatorVaultAtas = quotes.map(({ mint, tokenProgram }) =>
      coinCreatorVaultAtaPda(coinCreatorVaultAuthority, mint, tokenProgram),
    );

    const accountInfos: (AccountInfo<Buffer> | null)[] = [];
    for (let i = 0; i < coinCreatorVaultAtas.length; i += 100) {
      accountInfos.push(
        ...(await this.connection.getMultipleAccountsInfo(
          coinCreatorVaultAtas.slice(i, i + 100),
        )),
      );
    }

    return new Map(
      quotes.map(({ mint, tokenProgram }, i) => [
        mint.toBase58(),
        this.vaultAtaBalance(
          coinCreatorVaultAtas[i],
          accountInfos[i],
          tokenProgram,
        ),
      ]),
    );
  }

  /**
   * Token balance of a fetched vault ATA; zero when the account does not exist. `unpackAccount`
   * accepts the extension-bearing (170-182 byte) accounts Token-2022 quotes produce.
   */
  private vaultAtaBalance(
    vaultAta: PublicKey,
    accountInfo: AccountInfo<Buffer> | null,
    tokenProgram: PublicKey,
  ): BN {
    if (accountInfo === null) {
      return new BN(0);
    }
    try {
      return new BN(
        unpackAccount(vaultAta, accountInfo, tokenProgram).amount.toString(),
      );
    } catch (e) {
      console.warn(`Error decoding token account ${vaultAta}:`, e);
      return new BN(0);
    }
  }

  /**
   * `PumpAmmSdk.transferCreatorFeesToPumpV2Instruction` with the quote token program resolved
   * from the mint account's owner; a bonding curve's zero key is accepted for SOL coins.
   */
  async transferCreatorFeesToPumpV2Instruction(
    payer: PublicKey,
    coinCreator: PublicKey,
    quoteMint: PublicKey,
  ): Promise<TransactionInstruction> {
    const quote = await this.resolveQuote(quoteMint, undefined);
    return PUMP_AMM_SDK.transferCreatorFeesToPumpV2Instruction({
      payer,
      coinCreator,
      quoteMint: quote.quoteMint,
      quoteTokenProgram: quote.quoteTokenProgram,
    });
  }

  /**
   * `PumpAmmSdk.setCoinCreator` for `poolKey`, with `metadata` and `bonding_curve` derived from
   * the pool's base mint (read with `decodePool`, so a pre-upgrade 261-byte pool works) and
   * preceded by `extend_account` (rent paid by `payer`) when the pool is shorter than
   * `POOL_ACCOUNT_NEW_SIZE`: the program writes the whole `Pool` back, which fails on an
   * un-grown account.
   */
  async setCoinCreatorInstructions(
    poolKey: PublicKey,
    payer: PublicKey,
  ): Promise<TransactionInstruction[]> {
    const poolAccountInfo = await this.connection.getAccountInfo(poolKey);
    if (poolAccountInfo === null) {
      throw new Error("Pool account not found");
    }
    const pool = PUMP_AMM_SDK.decodePool(poolAccountInfo);

    const instructions: TransactionInstruction[] = [];
    if (poolAccountInfo.data.length < POOL_ACCOUNT_NEW_SIZE) {
      instructions.push(await PUMP_AMM_SDK.extendAccount(poolKey, payer));
    }
    instructions.push(
      await PUMP_AMM_SDK.setCoinCreator(poolKey, pool.baseMint),
    );
    return instructions;
  }

  /**
   * `PumpAmmSdk.sweepCreatorFeeInstruction` for `poolKey`, with the pool and its quote token
   * program read from chain: what a CTO, a fee-sharing config creation or an `update_fee_shares`
   * for the pool's coin must carry before it, in the same transaction.
   */
  async sweepCreatorFeeInstruction(
    poolKey: PublicKey,
    payer: PublicKey,
  ): Promise<TransactionInstruction> {
    const pool = await this.fetchPool(poolKey);
    const { quoteTokenProgram } = await this.resolveQuote(
      pool.quoteMint,
      undefined,
    );
    return PUMP_AMM_SDK.sweepCreatorFeeInstruction({
      payer,
      poolKey,
      pool,
      quoteTokenProgram,
    });
  }

  /**
   * Canonical pools as `multi_hop_swap` hops, in `poolKeys` order, with the state
   * `multiHopSwapQuote` prices them from (the pool, its mints' token programs, its vault balances,
   * the base mint supply) and the GlobalConfig / FeeConfig it needs. Two RPC round trips for any
   * route length; each hop is usable as a `PumpAmmSdk.multiHopSwapInstructions` venue as is.
   */
  async multiHopPoolHops(poolKeys: PublicKey[]): Promise<{
    globalConfig: GlobalConfig;
    feeConfig: FeeConfig | null;
    hops: MultiHopPoolQuoteHop[];
  }> {
    const [globalConfigInfo, feeConfigInfo, ...poolInfos] =
      await this.connection.getMultipleAccountsInfo([
        GLOBAL_CONFIG_PDA,
        PUMP_AMM_FEE_CONFIG_PDA,
        ...poolKeys,
      ]);
    if (globalConfigInfo === null) {
      throw new Error("Global config account not found");
    }
    const pools = poolInfos.map((info, i) => {
      if (info === null) {
        throw new Error(`pool=${poolKeys[i].toString()} not found`);
      }
      return PUMP_AMM_SDK.decodePool(info);
    });

    // Every mint and vault once, however many hops share them.
    const keys = [
      ...new Map(
        pools
          .flatMap((pool) => [
            pool.baseMint,
            pool.quoteMint,
            pool.poolBaseTokenAccount,
            pool.poolQuoteTokenAccount,
          ])
          .map((key) => [key.toBase58(), key]),
      ).values(),
    ];
    const infos = new Map(
      (await this.connection.getMultipleAccountsInfo(keys)).map((info, i) => {
        if (info === null) {
          throw new Error(`account=${keys[i].toString()} not found`);
        }
        return [keys[i].toBase58(), info];
      }),
    );
    const info = (key: PublicKey) => infos.get(key.toBase58())!;
    const amount = (key: PublicKey) =>
      new BN(unpackAccount(key, info(key), info(key).owner).amount.toString());

    return {
      globalConfig: PUMP_AMM_SDK.decodeGlobalConfig(globalConfigInfo),
      feeConfig: feeConfigInfo
        ? PUMP_AMM_SDK.decodeFeeConfig(feeConfigInfo)
        : null,
      hops: pools.map((pool, i) => ({
        kind: "pool",
        poolKey: poolKeys[i],
        pool,
        baseTokenProgram: info(pool.baseMint).owner,
        quoteTokenProgram: info(pool.quoteMint).owner,
        poolBaseAmount: amount(pool.poolBaseTokenAccount),
        poolQuoteAmount: amount(pool.poolQuoteTokenAccount),
        baseMintSupply: new BN(
          unpackMint(
            pool.baseMint,
            info(pool.baseMint),
            info(pool.baseMint).owner,
          ).supply.toString(),
        ),
      })),
    };
  }

  async boostBuyAndBurnInstruction(
    poolKey: PublicKey,
    authority: PublicKey,
    quoteAmountIn: BN,
    minBaseAmountBurned: BN,
  ): Promise<TransactionInstruction> {
    const poolAccountInfo = await this.connection.getAccountInfo(poolKey);
    if (poolAccountInfo === null) {
      throw new Error("Pool account not found");
    }
    const pool = PUMP_AMM_SDK.decodePool(poolAccountInfo);

    const [baseMintAccountInfo, quoteMintAccountInfo] =
      await this.connection.getMultipleAccountsInfo([
        pool.baseMint,
        pool.quoteMint,
      ]);

    if (baseMintAccountInfo === null) {
      throw new Error(`baseMint=${pool.baseMint.toString()} not found`);
    }
    if (quoteMintAccountInfo === null) {
      throw new Error(`quoteMint=${pool.quoteMint.toString()} not found`);
    }

    return PUMP_AMM_SDK.boostBuyAndBurnInstruction(
      poolKey,
      pool,
      authority,
      quoteAmountIn,
      minBaseAmountBurned,
      baseMintAccountInfo.owner,
      quoteMintAccountInfo.owner,
    );
  }

  async claimTokenIncentives(
    user: PublicKey,
    payer: PublicKey,
  ): Promise<TransactionInstruction[]> {
    const { mint } = await this.fetchGlobalVolumeAccumulator();

    if (mint.equals(PublicKey.default)) {
      return [];
    }

    const [mintAccountInfo, userAccumulatorAccountInfo] =
      await this.connection.getMultipleAccountsInfo([
        mint,
        userVolumeAccumulatorPda(user),
      ]);

    if (!mintAccountInfo) {
      return [];
    }

    if (!userAccumulatorAccountInfo) {
      return [];
    }

    return [
      await OFFLINE_PUMP_AMM_PROGRAM.methods
        .claimTokenIncentives()
        .accountsPartial({
          user,
          payer,
          mint,
          tokenProgram: mintAccountInfo.owner,
        })
        .instruction(),
    ];
  }

  async getTotalUnclaimedTokens(user: PublicKey): Promise<BN> {
    const [
      globalVolumeAccumulatorAccountInfo,
      userVolumeAccumulatorAccountInfo,
    ] = await this.connection.getMultipleAccountsInfo([
      GLOBAL_VOLUME_ACCUMULATOR_PDA,
      userVolumeAccumulatorPda(user),
    ]);

    if (
      !globalVolumeAccumulatorAccountInfo ||
      !userVolumeAccumulatorAccountInfo
    ) {
      return new BN(0);
    }

    const globalVolumeAccumulator = PUMP_AMM_SDK.decodeGlobalVolumeAccumulator(
      globalVolumeAccumulatorAccountInfo,
    );
    const userVolumeAccumulator = PUMP_AMM_SDK.decodeUserVolumeAccumulator(
      userVolumeAccumulatorAccountInfo,
    );

    return totalUnclaimedTokens(globalVolumeAccumulator, userVolumeAccumulator);
  }

  async getCurrentDayTokens(user: PublicKey): Promise<BN> {
    const [
      globalVolumeAccumulatorAccountInfo,
      userVolumeAccumulatorAccountInfo,
    ] = await this.connection.getMultipleAccountsInfo([
      GLOBAL_VOLUME_ACCUMULATOR_PDA,
      userVolumeAccumulatorPda(user),
    ]);

    if (
      !globalVolumeAccumulatorAccountInfo ||
      !userVolumeAccumulatorAccountInfo
    ) {
      return new BN(0);
    }

    const globalVolumeAccumulator = PUMP_AMM_SDK.decodeGlobalVolumeAccumulator(
      globalVolumeAccumulatorAccountInfo,
    );
    const userVolumeAccumulator = PUMP_AMM_SDK.decodeUserVolumeAccumulator(
      userVolumeAccumulatorAccountInfo,
    );

    return currentDayTokens(globalVolumeAccumulator, userVolumeAccumulator);
  }
}
