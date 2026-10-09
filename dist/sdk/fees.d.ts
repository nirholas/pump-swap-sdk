import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { i as FeeTier, j as Fees, G as GlobalConfig, F as FeeConfig } from '../sdk-CtXcjwA6.js';
import '@solana/spl-token';

declare const USDC_MINT: PublicKey;
/**
 * Quote mints that select `stableFeeTiers` on a canonical pump pool. Mirrors the constant
 * pump-fees hardcodes (`STABLE_QUOTE_MINTS`), so widening it is a program upgrade. Devnet USDC
 * (`4zMMC9…`) is deliberately absent: after the quote-control upgrade a devnet USDC-quoted canonical
 * pool pays exotic/flat fees. Until that upgrade is deployed to devnet, the devnet program still
 * charges such pools stable tiers, so this SDK and devnet disagree on them in that window.
 */
declare const STABLE_QUOTE_MINTS: readonly PublicKey[];
/**
 * Quote mints that select `feeTiers`: the zero key legacy bonding curves store for SOL, legacy
 * WSOL and the Token-2022 native mint (pump-fees `is_sol_like_quote_mint`).
 */
declare const SOL_LIKE_QUOTE_MINTS: readonly PublicKey[];
declare function isSolLikeQuoteMint(quoteMint: PublicKey): boolean;
declare function isStableQuoteMint(quoteMint: PublicKey): boolean;
/** All-zero `Fees` is how pump-fees marks `exoticFlatFees` as unset. */
declare function isZeroFees(fees: Fees): boolean;
declare function computeFeesBps({ globalConfig, feeConfig, creator, baseMintSupply, baseMint, baseReserve, quoteReserve, quoteMint, isMayhemMode, creatorFeeBps, }: {
    globalConfig: GlobalConfig;
    feeConfig: FeeConfig | null;
    creator: PublicKey;
    baseMintSupply: BN;
    baseMint: PublicKey;
    baseReserve: BN;
    quoteReserve: BN;
    /**
     * Not used: pump-fees tiers by market cap only (the on-chain `get_fees` argument of the same
     * name is ignored too). Kept so existing call sites keep compiling.
     */
    tradeSize?: BN;
    /**
     * `Pool.quoteMint`; selects the fee schedule (see `feesForQuoteMint`). Defaults to WSOL, so
     * callers that omit it get the SOL schedule they always got.
     */
    quoteMint?: PublicKey;
    /** `Pool.isMayhemMode`; mayhem pools use a fixed total supply as the market-cap basis. */
    isMayhemMode?: boolean;
    /**
     * `Pool.creatorFeeBps`, the per-pool creator fee rate. While `globalConfig.creatorFeeConfigurable`
     * is on and it is nonzero it replaces the schedule's creator rate; 0 or omitted means "not
     * configured", so callers that omit it price exactly as before. Applied only with a `feeConfig`,
     * as on-chain (the GlobalConfig fallback below is unreachable there: pump-fees is mandatory).
     */
    creatorFeeBps?: BN;
}): Fees;
/**
 * The schedule a trade pays, selected by who created the pool and what it is quoted in: non-pump
 * pools pay `flatFees`; canonical pump pools pay `feeTiers` for SOL-like quotes, `stableFeeTiers`
 * for listed stables and `exoticFlatFees` for everything else, falling back to `flatFees` while
 * the exotic schedule is unset (all-zero).
 *
 * rust reference: pump-fees FeeConfig::fees_for_quote_mint()
 */
declare function feesForQuoteMint({ feeConfig, isPumpPool, marketCap, quoteMint, }: {
    feeConfig: FeeConfig;
    isPumpPool: boolean;
    marketCap: BN;
    quoteMint: PublicKey;
}): Fees;
declare function calculateFeeTier({ feeTiers, marketCap, }: {
    feeTiers: FeeTier[];
    marketCap: BN;
}): Fees;
declare function getFeeRecipient(globalConfig: GlobalConfig, isMayhemMode: boolean): PublicKey;
declare function getBuybackFeeRecipient(globalConfig: GlobalConfig): PublicKey;

export { SOL_LIKE_QUOTE_MINTS, STABLE_QUOTE_MINTS, USDC_MINT, calculateFeeTier, computeFeesBps, feesForQuoteMint, getBuybackFeeRecipient, getFeeRecipient, isSolLikeQuoteMint, isStableQuoteMint, isZeroFees };
