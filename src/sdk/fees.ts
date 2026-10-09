import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import { NATIVE_MINT, NATIVE_MINT_2022 } from "@solana/spl-token";
import { FeeConfig, Fees, FeeTier, GlobalConfig } from "../types/sdk";
import { isPumpPool, poolMarketCap } from "./util";

export const USDC_MINT = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
);

/**
 * Quote mints that select `stableFeeTiers` on a canonical pump pool. Mirrors the constant
 * pump-fees hardcodes (`STABLE_QUOTE_MINTS`), so widening it is a program upgrade. Devnet USDC
 * (`4zMMC9…`) is deliberately absent: after the quote-control upgrade a devnet USDC-quoted canonical
 * pool pays exotic/flat fees. Until that upgrade is deployed to devnet, the devnet program still
 * charges such pools stable tiers, so this SDK and devnet disagree on them in that window.
 */
export const STABLE_QUOTE_MINTS: readonly PublicKey[] = Object.freeze([
  USDC_MINT,
]);

/**
 * Quote mints that select `feeTiers`: the zero key legacy bonding curves store for SOL, legacy
 * WSOL and the Token-2022 native mint (pump-fees `is_sol_like_quote_mint`).
 */
export const SOL_LIKE_QUOTE_MINTS: readonly PublicKey[] = Object.freeze([
  PublicKey.default,
  NATIVE_MINT,
  NATIVE_MINT_2022,
]);

export function isSolLikeQuoteMint(quoteMint: PublicKey): boolean {
  return SOL_LIKE_QUOTE_MINTS.some((mint) => mint.equals(quoteMint));
}

export function isStableQuoteMint(quoteMint: PublicKey): boolean {
  return STABLE_QUOTE_MINTS.some((mint) => mint.equals(quoteMint));
}

/** All-zero `Fees` is how pump-fees marks `exoticFlatFees` as unset. */
export function isZeroFees(fees: Fees): boolean {
  return (
    fees.lpFeeBps.isZero() &&
    fees.protocolFeeBps.isZero() &&
    fees.creatorFeeBps.isZero()
  );
}

export function computeFeesBps({
  globalConfig,
  feeConfig,
  creator,
  baseMintSupply,
  baseMint,
  baseReserve,
  quoteReserve,
  quoteMint = NATIVE_MINT,
  isMayhemMode = false,
  creatorFeeBps,
}: {
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
}): Fees {
  if (feeConfig != null) {
    const marketCap = poolMarketCap({
      baseMintSupply,
      baseReserve,
      quoteReserve,
      isMayhemMode,
    });

    const fees = feesForQuoteMint({
      feeConfig,
      isPumpPool: isPumpPool(baseMint, creator),
      marketCap,
      quoteMint,
    });

    // A configured per-pool rate replaces the schedule's creator rate while the gate is on; LP
    // and protocol rates are untouched. rust reference: pump-amm compute_fees()
    return globalConfig.creatorFeeConfigurable && creatorFeeBps?.gtn(0)
      ? { ...fees, creatorFeeBps }
      : fees;
  }

  return {
    lpFeeBps: globalConfig.lpFeeBasisPoints,
    protocolFeeBps: globalConfig.protocolFeeBasisPoints,
    creatorFeeBps: globalConfig.coinCreatorFeeBasisPoints,
  };
}

/**
 * The schedule a trade pays, selected by who created the pool and what it is quoted in: non-pump
 * pools pay `flatFees`; canonical pump pools pay `feeTiers` for SOL-like quotes, `stableFeeTiers`
 * for listed stables and `exoticFlatFees` for everything else, falling back to `flatFees` while
 * the exotic schedule is unset (all-zero).
 *
 * rust reference: pump-fees FeeConfig::fees_for_quote_mint()
 */
export function feesForQuoteMint({
  feeConfig,
  isPumpPool,
  marketCap,
  quoteMint,
}: {
  feeConfig: FeeConfig;
  isPumpPool: boolean;
  marketCap: BN;
  quoteMint: PublicKey;
}): Fees {
  if (!isPumpPool) {
    return feeConfig.flatFees;
  }
  if (isSolLikeQuoteMint(quoteMint)) {
    return calculateFeeTier({ feeTiers: feeConfig.feeTiers, marketCap });
  }
  if (isStableQuoteMint(quoteMint)) {
    // An empty schedule is a program invariant violation on-chain; a FeeConfig account written
    // before the field existed decodes with [] and was only ever charged `feeTiers`.
    return calculateFeeTier({
      feeTiers:
        feeConfig.stableFeeTiers.length > 0
          ? feeConfig.stableFeeTiers
          : feeConfig.feeTiers,
      marketCap,
    });
  }
  return isZeroFees(feeConfig.exoticFlatFees)
    ? feeConfig.flatFees
    : feeConfig.exoticFlatFees;
}

/// rust reference: pump-fees-math::calculate_fee_tier()
export function calculateFeeTier({
  feeTiers,
  marketCap,
}: {
  feeTiers: FeeTier[];
  marketCap: BN;
}): Fees {
  if (feeTiers.length === 0) {
    throw new Error("Fee tiers cannot be empty.");
  }

  const firstTier = feeTiers[0];

  if (marketCap.lt(firstTier.marketCapLamportsThreshold)) {
    return firstTier.fees;
  }

  for (const tier of feeTiers.slice().reverse()) {
    if (marketCap.gte(tier.marketCapLamportsThreshold)) {
      return tier.fees;
    }
  }

  return firstTier.fees;
}

export function getFeeRecipient(
  globalConfig: GlobalConfig,
  isMayhemMode: boolean,
): PublicKey {
  if (isMayhemMode) {
    const feeRecipients = [
      globalConfig.reservedFeeRecipient,
      ...globalConfig.reservedFeeRecipients,
    ];
    return feeRecipients[Math.floor(Math.random() * feeRecipients.length)];
  } else {
    return globalConfig.protocolFeeRecipients[
      Math.floor(Math.random() * globalConfig.protocolFeeRecipients.length)
    ];
  }
}

export function getBuybackFeeRecipient(globalConfig: GlobalConfig): PublicKey {
  return globalConfig.buybackFeeRecipients[
    Math.floor(Math.random() * globalConfig.buybackFeeRecipients.length)
  ];
}
