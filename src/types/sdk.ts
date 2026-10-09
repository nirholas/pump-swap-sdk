import BN from "bn.js";
import { AccountInfo, PublicKey } from "@solana/web3.js";
import { RawAccount, RawMint } from "@solana/spl-token";

export interface DepositBaseResult {
  quote: BN;
  lpToken: BN;
  maxBase: BN;
  maxQuote: BN;
}

export interface DepositQuoteAndLpTokenFromBaseResult {
  quote: BN;
  lpToken: BN;
}

export interface DepositQuoteResult {
  base: BN;
  lpToken: BN;
  maxBase: BN;
  maxQuote: BN;
}

export interface DepositBaseAndLpTokenFromQuoteResult {
  base: BN;
  lpToken: BN;
}

export interface DepositResult {
  token1: BN;
  lpToken: BN;
  maxToken0: BN;
  maxToken1: BN;
}

export interface DepositLpTokenResult {
  maxBase: BN;
  maxQuote: BN;
}

export interface WithdrawResult {
  base: BN;
  quote: BN;
  minBase: BN;
  minQuote: BN;
}

export interface WithdrawAutocompleteResult {
  base: BN;
  quote: BN;
}

export interface BuyBaseInputResult {
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

export interface BuyQuoteInputResult {
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

export interface SellBaseInputResult {
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

export interface SellQuoteInputResult {
  internalRawQuote: BN;
  base: BN;
  minQuote: BN;
}

export interface Pool {
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

export interface GlobalConfig {
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

export interface GlobalVolumeAccumulator {
  startTime: BN;
  endTime: BN;
  secondsInADay: BN;
  mint: PublicKey;
  totalTokenSupply: BN[];
  solVolumes: BN[];
}

export interface UserVolumeAccumulator {
  user: PublicKey;
  needsClaim: boolean;
  totalUnclaimedTokens: BN;
  totalClaimedTokens: BN;
  currentSolVolume: BN;
  lastUpdateTimestamp: BN;
}

export interface SwapAccounts {
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

export interface LiquidityAccounts {
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

export interface CommonSolanaState {
  poolKey: PublicKey;
  poolAccountInfo: AccountInfo<Buffer> | null;
  user: PublicKey;
}

export interface CreatePoolSolanaState {
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

export interface SwapSolanaState {
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

export interface LiquiditySolanaState {
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

export interface CollectCoinCreatorFeeSolanaState {
  coinCreator: PublicKey;
  quoteMint: PublicKey;
  quoteTokenProgram: PublicKey;
  coinCreatorVaultAuthority: PublicKey;
  coinCreatorVaultAta: PublicKey;
  coinCreatorTokenAccount: PublicKey;
  coinCreatorVaultAtaAccountInfo: AccountInfo<Buffer> | null;
  coinCreatorTokenAccountInfo: AccountInfo<Buffer> | null;
}

export interface FeeConfig {
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

export interface FeeTier {
  marketCapLamportsThreshold: BN;
  fees: Fees;
}

export interface Fees {
  lpFeeBps: BN;
  protocolFeeBps: BN;
  creatorFeeBps: BN;
}
