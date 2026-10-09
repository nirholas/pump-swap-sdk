import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { RawMint } from '@solana/spl-token';
import { G as GlobalConfig, F as FeeConfig, S as SellBaseInputResult, m as SellQuoteInputResult } from '../sdk-CtXcjwA6.js';

declare function sellBaseInput({ base, slippage, baseReserve, quoteReserve, virtualQuoteReserves, feeBucketsTotal, globalConfig, baseMintAccount, baseMint, coinCreator, creator, feeConfig, quoteMint, isMayhemMode, creatorFeeBps, }: {
    base: BN;
    slippage: number;
    baseReserve: BN;
    quoteReserve: BN;
    virtualQuoteReserves?: BN;
    /**
     * `Pool.protocolFees + Pool.creatorFees`: fees v2 trades left in the quote vault. The program
     * pays sells only from `quoteReserve - feeBucketsTotal` (`real_quote_reserves`). Defaults to 0
     * (no fees accrued).
     */
    feeBucketsTotal?: BN;
    globalConfig: GlobalConfig;
    baseMintAccount: RawMint;
    baseMint: PublicKey;
    coinCreator: PublicKey;
    creator: PublicKey;
    feeConfig: FeeConfig | null;
    /**
     * `Pool.quoteMint`; selects the fee schedule (SOL-like -> feeTiers, USDC -> stableFeeTiers,
     * anything else -> exoticFlatFees, or flatFees while the exotic schedule is unset). Defaults to
     * WSOL: omitting it on a non-SOL pool prices with the SOL schedule.
     */
    quoteMint?: PublicKey;
    /** `Pool.isMayhemMode`; defaults to false. */
    isMayhemMode?: boolean;
    /**
     * `Pool.creatorFeeBps`; replaces the schedule's creator rate while
     * `globalConfig.creatorFeeConfigurable` is on and it is nonzero. Omitting it (or 0) prices with
     * the schedule, as before.
     */
    creatorFeeBps?: BN;
}): SellBaseInputResult;
/**
 * A sell's gross quote split: what leaves the reserves once the LP fee stays (which real
 * reserves, the vault net of the fee buckets, must cover) and the seller's share once the
 * protocol and creator fees stay too.
 *
 * rust reference: pump-amm trade_v2 sell_amounts()
 */
declare function sellAmounts(quoteAmountOut: BN, fees: {
    lpFee: BN;
    protocolFee: BN;
    coinCreatorFee: BN;
}, realQuoteReserves: BN): {
    quoteAmountOutWithoutLpFee: BN;
    userQuoteAmountOut: BN;
};
declare function sellQuoteInput({ quote, slippage, baseReserve, quoteReserve, virtualQuoteReserves, feeBucketsTotal, globalConfig, baseMintAccount, baseMint, coinCreator, creator, feeConfig, quoteMint, isMayhemMode, creatorFeeBps, }: {
    quote: BN;
    slippage: number;
    baseReserve: BN;
    quoteReserve: BN;
    virtualQuoteReserves?: BN;
    /**
     * `Pool.protocolFees + Pool.creatorFees`: fees v2 trades left in the quote vault. The program
     * pays sells only from `quoteReserve - feeBucketsTotal` (`real_quote_reserves`). Defaults to 0
     * (no fees accrued).
     */
    feeBucketsTotal?: BN;
    globalConfig: GlobalConfig;
    baseMintAccount: RawMint;
    baseMint: PublicKey;
    coinCreator: PublicKey;
    creator: PublicKey;
    feeConfig: FeeConfig | null;
    /**
     * `Pool.quoteMint`; selects the fee schedule (SOL-like -> feeTiers, USDC -> stableFeeTiers,
     * anything else -> exoticFlatFees, or flatFees while the exotic schedule is unset). Defaults to
     * WSOL: omitting it on a non-SOL pool prices with the SOL schedule.
     */
    quoteMint?: PublicKey;
    /** `Pool.isMayhemMode`; defaults to false. */
    isMayhemMode?: boolean;
    /**
     * `Pool.creatorFeeBps`; replaces the schedule's creator rate while
     * `globalConfig.creatorFeeConfigurable` is on and it is nonzero. Omitting it (or 0) prices with
     * the schedule, as before.
     */
    creatorFeeBps?: BN;
}): SellQuoteInputResult;

export { sellAmounts, sellBaseInput, sellQuoteInput };
