import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import { NATIVE_MINT, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { FeeConfig, GlobalConfig, Pool } from "../types/sdk";
import { exactQuoteInFees } from "./buy";
import { computeFeesBps } from "./fees";
import { sellAmounts } from "./sell";
import { fee, isPumpPool } from "./util";
import { canonicalPoolQuoteMint } from "./pda";

/** A canonical, non-mayhem pump pool hop of a `multi_hop_swap` route. */
export interface MultiHopPoolVenue {
  kind: "pool";
  poolKey: PublicKey;
  pool: Pool;
  baseTokenProgram: PublicKey;
  quoteTokenProgram: PublicKey;
}

/**
 * A pump bonding-curve hop of a `multi_hop_swap` route, traded by pump through
 * `multi_hop_curve_swap`. Token-quoted and SOL curves alike: a SOL curve (quote mint the zero key
 * pump stores, or WSOL) is routed with the native mint and the curve's WSOL ATA in its group, and
 * can only be a route's user end (the first hop of a buy, the last of a sell), where pump moves
 * the user's SOL as lamports.
 */
export interface MultiHopCurveVenue {
  kind: "curve";
  baseMint: PublicKey;
  quoteMint: PublicKey;
  baseTokenProgram: PublicKey;
  quoteTokenProgram: PublicKey;
}

export type MultiHopVenue = MultiHopPoolVenue | MultiHopCurveVenue;

/**
 * The fee components one hop charges, from its place in the route (pump-amm `HopFees`). `lp` is
 * never set on a curve hop: a bonding curve has no LP fee.
 */
export interface MultiHopLegFees {
  protocol: boolean;
  creator: boolean;
  lp: boolean;
}

export interface MultiHopRoute {
  /** Every hop buys (walks a quote chain up) or every hop sells (walks it down). */
  isBuy: boolean;
  /** The running mint: `mints[0]` is the input, `mints[i + 1]` what hop `i` pays out. */
  mints: PublicKey[];
  legs: MultiHopLegFees[];
}

/**
 * Route lengths the programs' 32 KiB heap holds: up to six hops, but a six-hop route with four or
 * more pool hops runs out of memory.
 */
export const MULTI_HOP_MAX_HOPS = 6;
const MULTI_HOP_MAX_POOLS_AT_MAX_HOPS = 3;

/** A bonding curve quoted in SOL: pump stores the zero key, which routes as the native mint. */
export function isSolCurve(venue: MultiHopVenue): boolean {
  return (
    venue.kind === "curve" &&
    canonicalPoolQuoteMint(venue.quoteMint).equals(NATIVE_MINT)
  );
}

/** A venue's mints as a route names them: a SOL curve's quote is the native mint. */
export function venueMints(venue: MultiHopVenue): {
  baseMint: PublicKey;
  quoteMint: PublicKey;
} {
  if (venue.kind === "pool") {
    return venue.pool;
  }
  return {
    baseMint: venue.baseMint,
    quoteMint: canonicalPoolQuoteMint(venue.quoteMint),
  };
}

/** The token program of a venue's quote mint (SPL Token for a SOL curve's native mint). */
export function venueQuoteTokenProgram(venue: MultiHopVenue): PublicKey {
  return isSolCurve(venue) ? TOKEN_PROGRAM_ID : venue.quoteTokenProgram;
}

/**
 * The protocol fee is charged once, at the leg trading the user's currency (first hop of a buy
 * route, last of a sell route); the creator and, on a pool, the LP fee once, at the leg trading
 * the far coin (last hop of a buy route, first of a sell route). A single hop is both.
 *
 * rust reference: pump-amm HopFees::for_hop()
 */
export function multiHopLegFees(
  isBuy: boolean,
  index: number,
  hops: number,
  isPool = true,
): MultiHopLegFees {
  const first = index === 0;
  const last = index + 1 === hops;
  const [protocol, target] = isBuy ? [first, last] : [last, first];
  return { protocol, creator: target, lp: target && isPool };
}

/**
 * Walks `venues` from `inMint` and refuses what `multi_hop_swap` refuses before anything moves:
 * an empty route, a hop not trading the running mint (`MultiHopDiscontinuousPath`), a route
 * mixing buys and sells (`MultiHopMixedDirection`), a pool hop that is not a canonical,
 * non-mayhem pump pool (`OnlyPumpPools` / `MayhemPoolNotSupported`; v2 trades accept those,
 * routes do not), a cashback pool on a hop charging the creator fee
 * (`CashbackCoinNotSupported`), and a route longer than the programs' heap
 * holds (`MULTI_HOP_MAX_HOPS`).
 */
export function resolveMultiHopRoute(
  inMint: PublicKey,
  venues: MultiHopVenue[],
): MultiHopRoute {
  const hops = venues.length;
  if (hops === 0) {
    throw new Error("A multi-hop route needs at least one hop.");
  }
  const pools = venues.filter((venue) => venue.kind === "pool").length;
  if (
    hops > MULTI_HOP_MAX_HOPS ||
    (hops === MULTI_HOP_MAX_HOPS && pools > MULTI_HOP_MAX_POOLS_AT_MAX_HOPS)
  ) {
    throw new Error(
      `A ${hops}-hop route with ${pools} pool hops exceeds the programs' heap (at most ${MULTI_HOP_MAX_HOPS} hops, ${MULTI_HOP_MAX_POOLS_AT_MAX_HOPS} of them pools at that length).`,
    );
  }

  inMint = canonicalPoolQuoteMint(inMint);
  const { quoteMint: firstQuote } = venueMints(venues[0]);
  const isBuy = inMint.equals(firstQuote);
  const mints = [inMint];
  const legs = venues.map((venue, i) => {
    const { baseMint, quoteMint } = venueMints(venue);
    const running = mints[i];
    const hopIsBuy = running.equals(quoteMint);
    if (!hopIsBuy && !running.equals(baseMint)) {
      throw new Error(
        `Hop ${i} trades ${baseMint.toBase58()}/${quoteMint.toBase58()}, not the running mint ${running.toBase58()}.`,
      );
    }
    if (hopIsBuy !== isBuy) {
      throw new Error(
        "Every hop of a multi-hop route must trade in the same direction.",
      );
    }
    mints.push(hopIsBuy ? baseMint : quoteMint);

    const hopLegs = multiHopLegFees(isBuy, i, hops, venue.kind === "pool");
    if (venue.kind === "curve") {
      return hopLegs;
    }
    const { pool, poolKey } = venue;
    if (!isPumpPool(pool.baseMint, pool.creator)) {
      throw new Error(
        `Hop ${i}: pool ${poolKey.toBase58()} is not a canonical pump pool.`,
      );
    }
    if (pool.isMayhemMode) {
      throw new Error(`Hop ${i}: pool ${poolKey.toBase58()} is a mayhem pool.`);
    }
    if (pool.isCashbackCoin && hopLegs.creator) {
      throw new Error(
        `Hop ${i}: cashback pool ${poolKey.toBase58()} cannot charge the creator fee.`,
      );
    }
    return hopLegs;
  });
  return { isBuy, mints, legs };
}

/** A pool hop with the state `multiHopSwapQuote` prices it from. */
export interface MultiHopPoolQuoteHop extends MultiHopPoolVenue {
  poolBaseAmount: BN;
  poolQuoteAmount: BN;
  baseMintSupply: BN;
}

/**
 * A curve hop priced by the caller. `quote` must return the hop's output as pump's
 * `multi_hop_curve_swap` computes it: only the components `legs` names are charged (never an LP
 * fee), and a buy spends its whole input (a buy past the remaining supply completes the curve and
 * buys on from the pool-to-be). A full-fee v3 quote over-charges every hop that is not both legs,
 * so it under-quotes the route and loosens `minAmountOut`; for an exact figure on a route with
 * curves, simulate the built transaction.
 */
export interface MultiHopCurveQuoteHop extends MultiHopCurveVenue {
  quote: (amountIn: BN, hop: { isBuy: boolean; legs: MultiHopLegFees }) => BN;
}

export type MultiHopQuoteHop = MultiHopPoolQuoteHop | MultiHopCurveQuoteHop;

/**
 * The output of a `multi_hop_swap` route spending `amountIn` of `inMint`, hop by hop, and the
 * `minAmountOut` to build it with. Each hop is priced from its state before the route; a pool
 * traded twice in one route is not re-priced in between.
 */
export function multiHopSwapQuote({
  inMint,
  hops,
  amountIn,
  slippage,
  globalConfig,
  feeConfig,
}: {
  inMint: PublicKey;
  hops: MultiHopQuoteHop[];
  amountIn: BN;
  slippage: number; // 1 => 1%
  globalConfig: GlobalConfig;
  feeConfig: FeeConfig | null;
}): { amountOut: BN; minAmountOut: BN; hopAmountsOut: BN[] } {
  if (amountIn.lten(0)) {
    throw new Error("amountIn must be positive.");
  }
  const { isBuy, legs } = resolveMultiHopRoute(inMint, hops);
  const hopAmountsOut: BN[] = [];
  let amount = amountIn;
  hops.forEach((hop, i) => {
    amount =
      hop.kind === "pool"
        ? poolHopAmountOut(hop, isBuy, amount, legs[i], globalConfig, feeConfig)
        : hop.quote(amount, { isBuy, legs: legs[i] });
    hopAmountsOut.push(amount);
  });

  const slippageFactor = new BN(Math.floor((1 - slippage / 100) * 1e9));
  const minAmountOut = amount.mul(slippageFactor).div(new BN(1e9));
  return {
    amountOut: amount,
    minAmountOut: BN.max(minAmountOut, new BN(1)),
    hopAmountsOut,
  };
}

// One pool hop as multi_hop_swap trades it: a buy spends its whole input (exact quote in), a
// sell pays the user's share; only the components `legs` names are charged.
// rust reference: pump-amm multi_hop_swap pool_hop()
function poolHopAmountOut(
  hop: MultiHopPoolQuoteHop,
  isBuy: boolean,
  amountIn: BN,
  legs: MultiHopLegFees,
  globalConfig: GlobalConfig,
  feeConfig: FeeConfig | null,
): BN {
  const { pool, poolBaseAmount: baseReserve, poolQuoteAmount } = hop;
  const quoteReserve = poolQuoteAmount.add(pool.virtualQuoteReserves);
  const rates = computeFeesBps({
    globalConfig,
    feeConfig,
    creator: pool.creator,
    baseMintSupply: hop.baseMintSupply,
    baseMint: pool.baseMint,
    baseReserve,
    quoteReserve,
    quoteMint: pool.quoteMint,
    isMayhemMode: pool.isMayhemMode,
    creatorFeeBps: pool.creatorFeeBps,
  });
  const zero = new BN(0);
  const masked = {
    lpFeeBps: legs.lp ? rates.lpFeeBps : zero,
    protocolFeeBps: legs.protocol ? rates.protocolFeeBps : zero,
    creatorFeeBps:
      legs.creator && !pool.coinCreator.equals(PublicKey.default)
        ? rates.creatorFeeBps
        : zero,
  };

  if (isBuy) {
    const { lpFee, protocolFee, coinCreatorFee } = exactQuoteInFees(
      amountIn,
      masked,
    );
    // The whole budget is spent: whatever the fees leave enters the reserves.
    const input = amountIn.sub(lpFee).sub(protocolFee).sub(coinCreatorFee);
    const baseOut = baseReserve
      .mul(input.subn(1))
      .div(quoteReserve.add(input.subn(1)));
    if (baseOut.lten(0) || baseOut.gt(baseReserve)) {
      throw new Error("The hop buys no base tokens.");
    }
    return baseOut;
  }

  const quoteOut = quoteReserve.mul(amountIn).div(baseReserve.add(amountIn));
  const { userQuoteAmountOut } = sellAmounts(
    quoteOut,
    {
      lpFee: fee(quoteOut, masked.lpFeeBps),
      protocolFee: fee(quoteOut, masked.protocolFeeBps),
      coinCreatorFee: fee(quoteOut, masked.creatorFeeBps),
    },
    poolQuoteAmount.sub(pool.protocolFees).sub(pool.creatorFees),
  );
  if (userQuoteAmountOut.lten(0)) {
    throw new Error("The hop sells for no quote tokens.");
  }
  return userQuoteAmountOut;
}
