import BN from 'bn.js';
import { PublicKey, AccountInfo } from '@solana/web3.js';
import { RawMint, RawAccount } from '@solana/spl-token';

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

export type { BuyBaseInputResult as B, CommonSolanaState as C, DepositBaseResult as D, FeeConfig as F, GlobalConfig as G, LiquidityAccounts as L, Pool as P, SellBaseInputResult as S, UserVolumeAccumulator as U, WithdrawResult as W, DepositQuoteAndLpTokenFromBaseResult as a, DepositQuoteResult as b, DepositBaseAndLpTokenFromQuoteResult as c, DepositResult as d, DepositLpTokenResult as e, WithdrawAutocompleteResult as f, BuyQuoteInputResult as g, SellQuoteInputResult as h, GlobalVolumeAccumulator as i, SwapAccounts as j, CreatePoolSolanaState as k, SwapSolanaState as l, LiquiditySolanaState as m, CollectCoinCreatorFeeSolanaState as n, FeeTier as o, Fees as p };
