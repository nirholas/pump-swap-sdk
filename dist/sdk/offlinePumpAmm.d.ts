import { Program } from '@coral-xyz/anchor';
import { P as PumpAmm } from '../pump_amm-D1Mp6mIm.js';
import { AccountInfo, TransactionInstruction, PublicKey } from '@solana/web3.js';
import { G as GlobalConfig, F as FeeConfig, P as Pool, k as GlobalVolumeAccumulator, U as UserVolumeAccumulator, c as CreatePoolSolanaState, l as LiquiditySolanaState, d as DepositBaseResult, g as DepositQuoteResult, p as WithdrawResult, o as SwapSolanaState, C as CollectCoinCreatorFeeSolanaState, f as DepositQuoteAndLpTokenFromBaseResult, D as DepositBaseAndLpTokenFromQuoteResult, W as WithdrawAutocompleteResult } from '../sdk-CtXcjwA6.js';
import { MultiHopVenue } from './multiHop.js';
import BN from 'bn.js';
import '@solana/spl-token';

declare const POOL_ACCOUNT_NEW_SIZE = 300;
/**
 * Serialized sizes of the current `Pool` and `GlobalConfig` layouts, discriminator included
 * (`Pool::SIZE`, `GlobalConfig::SIZE`). Older accounts are shorter (a pool is 211 / 243 / 244 /
 * 245 / 261 / 270 / 271 bytes, a GlobalConfig 907 / 940) and lack the trailing fields, which the
 * program's versioned readers return as 0 / false; `decodePool` and `decodeGlobalConfig` zero-pad
 * to these sizes so such accounts decode the same way. A pool grown by `extend_account` is
 * `POOL_ACCOUNT_NEW_SIZE`+ bytes and decodes unchanged.
 */
declare const POOL_SIZE = 287;
declare const GLOBAL_CONFIG_SIZE = 949;
/**
 * pump-fees `FeeConfig` account lengths, one per layout version. Every version is a prefix of
 * the next and the account length selects the version: a shorter account simply lacks the
 * trailing fields, which read as empty / zero (mirrors `FeeConfig::deserialize_versioned`).
 */
declare const FEE_CONFIG_SIZE_PRE_STABLE = 2512;
declare const FEE_CONFIG_SIZE_POST_STABLE = 4073;
declare const FEE_CONFIG_SIZE_POST_EXOTIC = 4097;
interface TradeOptions {
    /**
     * Build `buy_v2` / `sell_v2` instead of `buy` / `sell` when the pool `supportsTradeV2`; other
     * pools keep the v1 instruction. Same pricing and limits either way. Defaults to false.
     */
    v2?: boolean;
}
declare const OFFLINE_PUMP_AMM_PROGRAM: Program<PumpAmm>;
declare class PumpAmmSdk {
    private readonly offlineProgram;
    constructor();
    decodeGlobalConfig(globalConfigAccountInfo: AccountInfo<Buffer>): GlobalConfig;
    decodeFeeConfig(feeConfigAccountInfo: AccountInfo<Buffer>): FeeConfig;
    decodePool(poolAccountInfo: AccountInfo<Buffer>): Pool;
    decodePoolNullable(poolAccountInfo: AccountInfo<Buffer>): Pool | null;
    decodeGlobalVolumeAccumulator(globalVolumeAccumulatorAccountInfo: AccountInfo<Buffer>): GlobalVolumeAccumulator;
    decodeUserVolumeAccumulator(userVolumeAccumulatorAccountInfo: AccountInfo<Buffer>): UserVolumeAccumulator;
    decodeUserVolumeAccumulatorNullable(userVolumeAccumulatorAccountInfo: AccountInfo<Buffer>): UserVolumeAccumulator | null;
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
    createPoolInstructions(createPoolSolanaState: CreatePoolSolanaState, baseIn: BN, quoteIn: BN, { creatorFeeBps, canEditCreatorFee, isHolderReward, }?: {
        creatorFeeBps?: BN;
        canEditCreatorFee?: boolean;
        isHolderReward?: boolean;
    }): Promise<TransactionInstruction[]>;
    depositInstructionsInternal(liquiditySolanaState: LiquiditySolanaState, lpToken: BN, maxBase: BN, maxQuote: BN): Promise<TransactionInstruction[]>;
    private withWsolAccounts;
    /**
     * Creates `ata` (the associated token account of `owner` for `mint` under `tokenProgram`) when
     * it does not exist yet; any mint and either token program.
     */
    private ensureAtaInstructions;
    /**
     * Runs `block` with the wSOL handling a legacy-WSOL leg needs: the user's wSOL ATA is created
     * when missing, funded with `amount` lamports and closed again afterwards to unwrap. For any
     * other mint `block` runs alone; that ATA holds the user's own tokens and is left as is.
     */
    private withWsolAccount;
    private accountExists;
    depositBaseInput(liquiditySolanaState: LiquiditySolanaState, base: BN, slippage: number): DepositBaseResult;
    depositQuoteInput(liquiditySolanaState: LiquiditySolanaState, quote: BN, slippage: number): DepositQuoteResult;
    withdrawInstructionsInternal(liquiditySolanaState: LiquiditySolanaState, lpTokenAmountIn: BN, minBaseAmountOut: BN, minQuoteAmountOut: BN): Promise<TransactionInstruction[]>;
    withdrawInputs(liquiditySolanaState: LiquiditySolanaState, lpAmount: BN, slippage: number): WithdrawResult;
    /**
     * The pool's quote liquidity: the vault balance less the fee buckets v2 trades left in it,
     * which deposits and withdrawals never touch (pump-amm `real_quote_reserves`).
     */
    private realQuoteReserves;
    private liquidityAccounts;
    buyInstructions(swapSolanaState: SwapSolanaState, baseOut: BN, maxQuoteIn: BN): Promise<TransactionInstruction[]>;
    buyInstructionsNoPool(swapSolanaState: SwapSolanaState, baseOut: BN, maxQuoteIn: BN): Promise<TransactionInstruction[]>;
    /** The buy instruction `swap` with its user-side setup: quote in, base out. */
    private withBuyAccounts;
    /**
     * The user-side setup around a swap instruction: a legacy-WSOL input is wrapped (`input.amount`
     * lamports; the account is closed again afterwards), the output account is created when it is
     * the user's ATA and `accountInfo` does not show it, and a legacy-WSOL output is closed to
     * unwrap. A custom (non-ATA) account is never created: it must already exist.
     */
    private withSwapUserAccounts;
    buyBaseInput(swapSolanaState: SwapSolanaState, base: BN, slippage: number, options?: TradeOptions): Promise<TransactionInstruction[]>;
    buyQuoteInput(swapSolanaState: SwapSolanaState, quote: BN, slippage: number, options?: TradeOptions): Promise<TransactionInstruction[]>;
    sellInstructions(swapSolanaState: SwapSolanaState, baseAmountIn: BN, minQuoteAmountOut: BN): Promise<TransactionInstruction[]>;
    private withFixPoolInstructions;
    sellInstructionsNoPool(swapSolanaState: SwapSolanaState, baseAmountIn: BN, minQuoteAmountOut: BN): Promise<TransactionInstruction[]>;
    /** The sell instruction `swap` with its user-side setup: base in, quote out. */
    private withSellAccounts;
    sellBaseInput(swapSolanaState: SwapSolanaState, base: BN, slippage: number, options?: TradeOptions): Promise<TransactionInstruction[]>;
    sellQuoteInput(swapSolanaState: SwapSolanaState, quote: BN, slippage: number, options?: TradeOptions): Promise<TransactionInstruction[]>;
    private routedBuyInstructions;
    private routedSellInstructions;
    extendAccount(account: PublicKey, user: PublicKey): Promise<TransactionInstruction>;
    boostBuyAndBurnInstruction(poolKey: PublicKey, pool: Pool, authority: PublicKey, quoteAmountIn: BN, minBaseAmountBurned: BN, baseTokenProgram: PublicKey, quoteTokenProgram: PublicKey): Promise<TransactionInstruction>;
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
    collectCoinCreatorFee(collectCoinCreatorFeeSolanaState: CollectCoinCreatorFeeSolanaState, payer?: PublicKey | undefined): Promise<TransactionInstruction[]>;
    /**
     * Moves a coin creator's accumulated AMM fees, quoted in `quoteMint`, into their pump creator
     * vault (the `creator-vault` PDA of the pump program), for coins whose creator fees are paid
     * out through that vault. The program unwraps a wSOL vault into the PDA itself and moves any
     * other quote into the PDA's quote ATA, which it creates (rent paid by `payer`) when missing;
     * `pump_creator_vault_ata` is part of the account list even for wSOL. `quoteTokenProgram`
     * must be the quote mint's owner program, SPL Token or Token-2022; every quote-side ATA is
     * derived under it.
     */
    transferCreatorFeesToPumpV2Instruction({ payer, coinCreator, quoteMint, quoteTokenProgram, }: {
        payer: PublicKey;
        coinCreator: PublicKey;
        quoteMint: PublicKey;
        quoteTokenProgram: PublicKey;
    }): Promise<TransactionInstruction>;
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
    setCoinCreator(pool: PublicKey, baseMint?: PublicKey): Promise<TransactionInstruction>;
    /**
     * `buy_v2`: buys exactly `baseOut` for at most `maxQuoteIn` (fees included) on a pool
     * `supportsTradeV2` accepts, with the same user-side accounts as `buyInstructions`. The protocol
     * and coin-creator fees stay in the pool's quote vault (`Pool.protocolFees` /
     * `Pool.creatorFees`, paid out by the sweeps); only the buyback slice of the protocol fee is paid
     * in the trade (none on a mayhem pool), to a listed buyback fee recipient's quote ATA, which
     * must already exist (v2 never creates it, and checks it even when the slice is 0). No
     * `extend_account` is prepended: the program grows a pre-upgrade pool itself.
     */
    buyV2Instructions(swapSolanaState: SwapSolanaState, baseOut: BN, maxQuoteIn: BN): Promise<TransactionInstruction[]>;
    /**
     * `buy_exact_quote_in_v2`: spends at most `spendableQuoteIn` (fees included) for at least
     * `minBaseOut`, which must be nonzero. Accounts and fee handling as `buyV2Instructions`.
     */
    buyExactQuoteInV2Instructions(swapSolanaState: SwapSolanaState, spendableQuoteIn: BN, minBaseOut: BN): Promise<TransactionInstruction[]>;
    /**
     * `sell_v2`: sells exactly `baseIn` for at least `minQuoteOut` (fees deducted), with the same
     * user-side accounts as `sellInstructions`. Fee handling as `buyV2Instructions`; the buyback
     * slice leaves the pool vault.
     */
    sellV2Instructions(swapSolanaState: SwapSolanaState, baseIn: BN, minQuoteOut: BN): Promise<TransactionInstruction[]>;
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
    multiHopSwapInstructions({ user, inMint, venues, amountIn, minAmountOut, globalConfig, buybackFeeRecipient, userInTokenAccount, userOutTokenAccount, userInAccountInfo, userOutAccountInfo, }: {
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
    }): Promise<TransactionInstruction[]>;
    /**
     * `sweep_protocol_fee`: pays a pool's `protocolFees` out of its quote vault to a protocol fee
     * recipient's quote ATA (a reserved one on a mayhem pool; created when missing).
     * Permissionless: `payer` signs and pays that ATA's rent and a pre-upgrade pool's realloc. A
     * no-op when the bucket is empty. `quoteTokenProgram` is the owner of `pool.quoteMint`.
     */
    sweepProtocolFeeInstruction({ payer, poolKey, pool, quoteTokenProgram, globalConfig, }: {
        payer: PublicKey;
        poolKey: PublicKey;
        pool: Pool;
        quoteTokenProgram: PublicKey;
        globalConfig: GlobalConfig;
    }): Promise<TransactionInstruction>;
    /**
     * `sweep_creator_fee`: pays a pool's `creatorFees` into the coin-creator vault of
     * `pool.coinCreator` (the vault `collectCoinCreatorFee` pays out from), otherwise as
     * `sweepProtocolFeeInstruction`. The programs refuse to change a coin creator or its fee shares
     * while the bucket is nonzero (pump-amm `CreatorFeesNotSwept`, pump-fees
     * `PoolCreatorFeesNotSwept`), so a CTO, a fee-sharing config creation or an `update_fee_shares`
     * on a coin with v2 volume must carry this instruction before it, in the same transaction.
     */
    sweepCreatorFeeInstruction({ payer, poolKey, pool, quoteTokenProgram, }: {
        payer: PublicKey;
        poolKey: PublicKey;
        pool: Pool;
        quoteTokenProgram: PublicKey;
    }): Promise<TransactionInstruction>;
    private sweepFeeAccounts;
    /** The 17 accounts of `buy_v2` / `buy_exact_quote_in_v2` / `sell_v2`, in IDL order. */
    private tradeV2Accounts;
    private swapAccounts;
    syncUserVolumeAccumulator(user: PublicKey): Promise<TransactionInstruction>;
    initUserVolumeAccumulator({ payer, user, }: {
        payer: PublicKey;
        user: PublicKey;
    }): Promise<TransactionInstruction>;
    closeUserVolumeAccumulator(user: PublicKey): Promise<TransactionInstruction>;
    createAutocompleteInitialPoolPrice(initialBase: BN, initialQuote: BN): Promise<BN>;
    depositInstructions(liquiditySolanaState: LiquiditySolanaState, lpToken: BN, slippage: number): Promise<TransactionInstruction[]>;
    depositAutocompleteQuoteAndLpTokenFromBase(liquiditySolanaState: LiquiditySolanaState, base: BN, slippage: number): DepositQuoteAndLpTokenFromBaseResult;
    depositAutocompleteBaseAndLpTokenFromQuote(liquiditySolanaState: LiquiditySolanaState, quote: BN, slippage: number): DepositBaseAndLpTokenFromQuoteResult;
    withdrawInstructions(liquiditySolanaState: LiquiditySolanaState, lpToken: BN, slippage: number): Promise<TransactionInstruction[]>;
    withdrawAutoCompleteBaseAndQuoteFromLpToken(liquiditySolanaState: LiquiditySolanaState, lpAmount: BN, slippage: number): WithdrawAutocompleteResult;
}
declare const PUMP_AMM_SDK: PumpAmmSdk;

export { FEE_CONFIG_SIZE_POST_EXOTIC, FEE_CONFIG_SIZE_POST_STABLE, FEE_CONFIG_SIZE_PRE_STABLE, GLOBAL_CONFIG_SIZE, OFFLINE_PUMP_AMM_PROGRAM, POOL_ACCOUNT_NEW_SIZE, POOL_SIZE, PUMP_AMM_SDK, PumpAmmSdk, type TradeOptions };
