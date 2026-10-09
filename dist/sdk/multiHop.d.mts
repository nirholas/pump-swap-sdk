import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { P as Pool, G as GlobalConfig, F as FeeConfig } from '../sdk-CtXcjwA6.mjs';
import '@solana/spl-token';

/** A canonical, non-mayhem pump pool hop of a `multi_hop_swap` route. */
interface MultiHopPoolVenue {
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
interface MultiHopCurveVenue {
    kind: "curve";
    baseMint: PublicKey;
    quoteMint: PublicKey;
    baseTokenProgram: PublicKey;
    quoteTokenProgram: PublicKey;
}
type MultiHopVenue = MultiHopPoolVenue | MultiHopCurveVenue;
/**
 * The fee components one hop charges, from its place in the route (pump-amm `HopFees`). `lp` is
 * never set on a curve hop: a bonding curve has no LP fee.
 */
interface MultiHopLegFees {
    protocol: boolean;
    creator: boolean;
    lp: boolean;
}
interface MultiHopRoute {
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
declare const MULTI_HOP_MAX_HOPS = 6;
/** A bonding curve quoted in SOL: pump stores the zero key, which routes as the native mint. */
declare function isSolCurve(venue: MultiHopVenue): boolean;
/** A venue's mints as a route names them: a SOL curve's quote is the native mint. */
declare function venueMints(venue: MultiHopVenue): {
    baseMint: PublicKey;
    quoteMint: PublicKey;
};
/** The token program of a venue's quote mint (SPL Token for a SOL curve's native mint). */
declare function venueQuoteTokenProgram(venue: MultiHopVenue): PublicKey;
/**
 * The protocol fee is charged once, at the leg trading the user's currency (first hop of a buy
 * route, last of a sell route); the creator and, on a pool, the LP fee once, at the leg trading
 * the far coin (last hop of a buy route, first of a sell route). A single hop is both.
 *
 * rust reference: pump-amm HopFees::for_hop()
 */
declare function multiHopLegFees(isBuy: boolean, index: number, hops: number, isPool?: boolean): MultiHopLegFees;
/**
 * Walks `venues` from `inMint` and refuses what `multi_hop_swap` refuses before anything moves:
 * an empty route, a hop not trading the running mint (`MultiHopDiscontinuousPath`), a route
 * mixing buys and sells (`MultiHopMixedDirection`), a pool hop that is not a canonical,
 * non-mayhem pump pool (`OnlyPumpPools` / `MayhemPoolNotSupported`; v2 trades accept those,
 * routes do not), a cashback pool on a hop charging the creator fee
 * (`CashbackCoinNotSupported`), and a route longer than the programs' heap
 * holds (`MULTI_HOP_MAX_HOPS`).
 */
declare function resolveMultiHopRoute(inMint: PublicKey, venues: MultiHopVenue[]): MultiHopRoute;
/** A pool hop with the state `multiHopSwapQuote` prices it from. */
interface MultiHopPoolQuoteHop extends MultiHopPoolVenue {
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
interface MultiHopCurveQuoteHop extends MultiHopCurveVenue {
    quote: (amountIn: BN, hop: {
        isBuy: boolean;
        legs: MultiHopLegFees;
    }) => BN;
}
type MultiHopQuoteHop = MultiHopPoolQuoteHop | MultiHopCurveQuoteHop;
/**
 * The output of a `multi_hop_swap` route spending `amountIn` of `inMint`, hop by hop, and the
 * `minAmountOut` to build it with. Each hop is priced from its state before the route; a pool
 * traded twice in one route is not re-priced in between.
 */
declare function multiHopSwapQuote({ inMint, hops, amountIn, slippage, globalConfig, feeConfig, }: {
    inMint: PublicKey;
    hops: MultiHopQuoteHop[];
    amountIn: BN;
    slippage: number;
    globalConfig: GlobalConfig;
    feeConfig: FeeConfig | null;
}): {
    amountOut: BN;
    minAmountOut: BN;
    hopAmountsOut: BN[];
};

export { MULTI_HOP_MAX_HOPS, type MultiHopCurveQuoteHop, type MultiHopCurveVenue, type MultiHopLegFees, type MultiHopPoolQuoteHop, type MultiHopPoolVenue, type MultiHopQuoteHop, type MultiHopRoute, type MultiHopVenue, isSolCurve, multiHopLegFees, multiHopSwapQuote, resolveMultiHopRoute, venueMints, venueQuoteTokenProgram };
