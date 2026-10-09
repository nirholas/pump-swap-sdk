import BN from 'bn.js';
import { PublicKey, AccountInfo } from '@solana/web3.js';
import { RawAccount, RawMint } from '@solana/spl-token';

interface DepositBaseResult {
    quote: BN;
    lpToken: BN;
    maxBase: BN;
    maxQuote: BN;
}
interface DepositQuoteAndLpTokenFromBaseResult {
    quote: BN;
    lpToken: BN;
}
interface DepositQuoteResult {
    base: BN;
    lpToken: BN;
    maxBase: BN;
    maxQuote: BN;
}
interface DepositBaseAndLpTokenFromQuoteResult {
    base: BN;
    lpToken: BN;
}
interface DepositResult {
    token1: BN;
    lpToken: BN;
    maxToken0: BN;
    maxToken1: BN;
}
interface DepositLpTokenResult {
    maxBase: BN;
    maxQuote: BN;
}
interface WithdrawResult {
    base: BN;
    quote: BN;
    minBase: BN;
    minQuote: BN;
}
interface WithdrawAutocompleteResult {
    base: BN;
    quote: BN;
}
interface BuyBaseInputResult {
    internalQuoteAmount: BN;
    /**
     * The total amount of quote tokens required to buy `base` tokens,
     * including LP fee and protocol fee.
     */
    uiQuote: BN;
    /**
     * The maximum quote tokens that you are willing to pay,
     * given the specified slippage tolerance.
     */
    maxQuote: BN;
}
interface BuyQuoteInputResult {
    /**
     * The amount of base tokens received after fees.
     */
    base: BN;
    internalQuoteWithoutFees: BN;
    /**
     * The maximum quote tokens that you are willing to pay,
     * given the specified slippage tolerance.
     */
    maxQuote: BN;
}
interface SellBaseInputResult {
    /**
     * The final amount of quote tokens the user receives (after subtracting LP and protocol fees).
     */
    uiQuote: BN;
    /**
     * The minimum quote tokens the user is willing to receive,
     * given their slippage tolerance.
     */
    minQuote: BN;
    internalQuoteAmountOut: BN;
}
interface SellQuoteInputResult {
    internalRawQuote: BN;
    base: BN;
    minQuote: BN;
}
interface Pool {
    poolBump: number;
    index: number;
    creator: PublicKey;
    baseMint: PublicKey;
    quoteMint: PublicKey;
    lpMint: PublicKey;
    poolBaseTokenAccount: PublicKey;
    poolQuoteTokenAccount: PublicKey;
    lpSupply: BN;
    coinCreator: PublicKey;
    isMayhemMode: boolean;
    isCashbackCoin: boolean;
    virtualQuoteReserves: BN;
    /**
     * Per-pool creator fee rate in basis points; 0 means "not configured" and trades pay the
     * pump-fees schedule's creator rate. Read only while `GlobalConfig.creatorFeeConfigurable` is
     * on. Carried over from the bonding curve at migration and changed afterwards only by a CTO
     * (pump `admin_cto` -> `admin_cto_pool`). Always 0 on accounts shorter than 270 bytes (written
     * before the field existed).
     */
    creatorFeeBps: BN;
    /**
     * Retired: nothing sets or reads it any more (the one-shot creator setter and the admin flip
     * that granted it were removed; a rate changes only through a CTO). Always false on accounts
     * the current program wrote.
     */
    canEditCreatorFee: boolean;
    /**
     * Whether the pool belongs to a holder-reward coin: its `coinCreator` is the coin's pump
     * holder-rewards PDA, so the creator fee of every trade accrues to that PDA's coin-creator
     * vault and is paid out to holders by the pump program. Set from the bonding curve at
     * migration or by a CTO; permanent once set. Always false on accounts shorter than 271 bytes
     * (written before the field existed).
     */
    isHolderReward: boolean;
    /**
     * Fees the v2 trades (`buy_v2`, `buy_exact_quote_in_v2`, `sell_v2`) left in the pool's quote
     * vault, paid out by `sweep_protocol_fee` / `sweep_creator_fee`: the protocol fee net of its
     * buyback slice (paid in the trade), and the coin-creator fee. Each accrual is also subtracted
     * from `virtualQuoteReserves`, so `vault balance + virtualQuoteReserves` still prices the pool,
     * but only `vault balance - protocolFees - creatorFees` is liquidity (what sells, deposits and
     * withdrawals draw on), and the boost sigma is `virtualQuoteReserves + protocolFees +
     * creatorFees`. Always 0 on accounts shorter than `POOL_SIZE` bytes.
     */
    protocolFees: BN;
    creatorFees: BN;
}
interface GlobalConfig {
    admin: PublicKey;
    lpFeeBasisPoints: BN;
    protocolFeeBasisPoints: BN;
    disableFlags: number;
    protocolFeeRecipients: PublicKey[];
    coinCreatorFeeBasisPoints: BN;
    adminSetCoinCreatorAuthority: PublicKey;
    whitelistPda: PublicKey;
    reservedFeeRecipient: PublicKey;
    mayhemModeEnabled: boolean;
    reservedFeeRecipients: PublicKey[];
    isCashbackEnabled: boolean;
    buybackFeeRecipients: PublicKey[];
    buybackBasisPoints: BN;
    boostAuthority: PublicKey;
    boostEnabled: boolean;
    /**
     * Feature gate for per-pool creator fees: while false, `Pool.creatorFeeBps` is neither
     * accepted by a CTO nor read by trades. False on accounts shorter than
     * `GLOBAL_CONFIG_SIZE` bytes.
     */
    creatorFeeConfigurable: boolean;
    /** Inclusive upper bound a CTO (`admin_cto_pool`) accepts; 0 on pre-upgrade accounts. */
    maxConfigurableCreatorFeeBps: BN;
}
interface GlobalVolumeAccumulator {
    startTime: BN;
    endTime: BN;
    secondsInADay: BN;
    mint: PublicKey;
    totalTokenSupply: BN[];
    solVolumes: BN[];
}
interface UserVolumeAccumulator {
    user: PublicKey;
    needsClaim: boolean;
    totalUnclaimedTokens: BN;
    totalClaimedTokens: BN;
    currentSolVolume: BN;
    lastUpdateTimestamp: BN;
}
interface SwapAccounts {
    pool: PublicKey;
    globalConfig: PublicKey;
    user: PublicKey;
    baseMint: PublicKey;
    quoteMint: PublicKey;
    userBaseTokenAccount: PublicKey;
    userQuoteTokenAccount: PublicKey;
    poolBaseTokenAccount: PublicKey;
    poolQuoteTokenAccount: PublicKey;
    protocolFeeRecipient: PublicKey;
    protocolFeeRecipientTokenAccount: PublicKey;
    buybackFeeRecipient: PublicKey;
    buybackFeeRecipientTokenAccount: PublicKey;
    baseTokenProgram: PublicKey;
    quoteTokenProgram: PublicKey;
    systemProgram: PublicKey;
    associatedTokenProgram: PublicKey;
    eventAuthority: PublicKey;
    program: PublicKey;
    coinCreatorVaultAta: PublicKey;
    coinCreatorVaultAuthority: PublicKey;
}
interface LiquidityAccounts {
    pool: PublicKey;
    globalConfig: PublicKey;
    user: PublicKey;
    baseMint: PublicKey;
    quoteMint: PublicKey;
    lpMint: PublicKey;
    userBaseTokenAccount: PublicKey;
    userQuoteTokenAccount: PublicKey;
    userPoolTokenAccount: PublicKey;
    poolBaseTokenAccount: PublicKey;
    poolQuoteTokenAccount: PublicKey;
    tokenProgram: PublicKey;
    token2022Program: PublicKey;
    eventAuthority: PublicKey;
    program: PublicKey;
}
interface CommonSolanaState {
    poolKey: PublicKey;
    poolAccountInfo: AccountInfo<Buffer> | null;
    user: PublicKey;
}
interface CreatePoolSolanaState {
    index: number;
    baseMint: PublicKey;
    quoteMint: PublicKey;
    creator: PublicKey;
    globalConfig: GlobalConfig;
    poolKey: PublicKey;
    poolBaseTokenAccount: PublicKey;
    poolQuoteTokenAccount: PublicKey;
    baseTokenProgram: PublicKey;
    quoteTokenProgram: PublicKey;
    userBaseTokenAccount: PublicKey;
    userQuoteTokenAccount: PublicKey;
    userBaseAccountInfo: AccountInfo<Buffer> | null;
    userQuoteAccountInfo: AccountInfo<Buffer> | null;
    poolBaseAccountInfo: AccountInfo<Buffer> | null;
    poolQuoteAccountInfo: AccountInfo<Buffer> | null;
}
interface SwapSolanaState {
    globalConfig: GlobalConfig;
    feeConfig: FeeConfig | null;
    poolKey: PublicKey;
    poolAccountInfo: AccountInfo<Buffer> | null;
    pool: Pool;
    poolBaseAmount: BN;
    poolQuoteAmount: BN;
    baseTokenProgram: PublicKey;
    quoteTokenProgram: PublicKey;
    baseMint: PublicKey;
    baseMintAccount: RawMint;
    user: PublicKey;
    userBaseTokenAccount: PublicKey;
    userQuoteTokenAccount: PublicKey;
    userBaseAccountInfo: AccountInfo<Buffer> | null;
    userQuoteAccountInfo: AccountInfo<Buffer> | null;
}
interface LiquiditySolanaState {
    globalConfig: GlobalConfig;
    poolKey: PublicKey;
    poolAccountInfo: AccountInfo<Buffer>;
    pool: Pool;
    poolBaseTokenAccount: RawAccount;
    poolQuoteTokenAccount: RawAccount;
    baseTokenProgram: PublicKey;
    quoteTokenProgram: PublicKey;
    user: PublicKey;
    userBaseTokenAccount: PublicKey;
    userQuoteTokenAccount: PublicKey;
    userPoolTokenAccount: PublicKey;
    userBaseAccountInfo: AccountInfo<Buffer> | null;
    userQuoteAccountInfo: AccountInfo<Buffer> | null;
    userPoolAccountInfo: AccountInfo<Buffer> | null;
}
interface CollectCoinCreatorFeeSolanaState {
    coinCreator: PublicKey;
    quoteMint: PublicKey;
    quoteTokenProgram: PublicKey;
    coinCreatorVaultAuthority: PublicKey;
    coinCreatorVaultAta: PublicKey;
    coinCreatorTokenAccount: PublicKey;
    coinCreatorVaultAtaAccountInfo: AccountInfo<Buffer> | null;
    coinCreatorTokenAccountInfo: AccountInfo<Buffer> | null;
}
interface FeeConfig {
    admin: PublicKey;
    flatFees: Fees;
    feeTiers: FeeTier[];
    /**
     * Fee tiers for canonical pump pools quoted in a listed stable (USDC).
     * Empty on accounts written before the field existed (< FEE_CONFIG_SIZE_POST_STABLE bytes).
     */
    stableFeeTiers: FeeTier[];
    /**
     * Flat fees for canonical pump pools whose quote is neither SOL-like nor a listed stable.
     * All-zero means unset (the program then charges `flatFees`); always zero on accounts
     * shorter than FEE_CONFIG_SIZE_POST_EXOTIC bytes.
     */
    exoticFlatFees: Fees;
}
interface FeeTier {
    marketCapLamportsThreshold: BN;
    fees: Fees;
}
interface Fees {
    lpFeeBps: BN;
    protocolFeeBps: BN;
    creatorFeeBps: BN;
}

export type { BuyBaseInputResult as B, CollectCoinCreatorFeeSolanaState as C, DepositBaseAndLpTokenFromQuoteResult as D, FeeConfig as F, GlobalConfig as G, LiquidityAccounts as L, Pool as P, SellBaseInputResult as S, UserVolumeAccumulator as U, WithdrawAutocompleteResult as W, BuyQuoteInputResult as a, CommonSolanaState as b, CreatePoolSolanaState as c, DepositBaseResult as d, DepositLpTokenResult as e, DepositQuoteAndLpTokenFromBaseResult as f, DepositQuoteResult as g, DepositResult as h, FeeTier as i, Fees as j, GlobalVolumeAccumulator as k, LiquiditySolanaState as l, SellQuoteInputResult as m, SwapAccounts as n, SwapSolanaState as o, WithdrawResult as p };
