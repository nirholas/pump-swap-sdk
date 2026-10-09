import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { RawMint } from '@solana/spl-token';
import { G as GlobalConfig, F as FeeConfig, B as BuyBaseInputResult, a as BuyQuoteInputResult } from '../sdk-CtXcjwA6.js';

/**
 * The exact-quote-in fee split of a v2 buy: the net that prices the swap, floor-divided out of
 * `spendableQuoteIn` and shaved until net + fees fits the budget, and the fees, ceil-computed on
 * the net *before* the shave (the program keeps them; the caller decides what the shave funds).
 * A zero creator rate charges nothing, as on a pool without a coin creator.
 *
 * rust reference: pump-amm trade_v2 exact_quote_in_fees()
 */
declare function exactQuoteInFees(spendableQuoteIn: BN, { lpFeeBps, protocolFeeBps, creatorFeeBps, }: {
    lpFeeBps: BN;
    protocolFeeBps: BN;
    creatorFeeBps: BN;
}): {
    netQuoteForSwap: BN;
    lpFee: BN;
    protocolFee: BN;
    coinCreatorFee: BN;
};
declare function buyBaseInput({ base, slippage, baseReserve, quoteReserve, virtualQuoteReserves, globalConfig, baseMintAccount, baseMint, coinCreator, creator, feeConfig, quoteMint, isMayhemMode, creatorFeeBps, }: {
    base: BN;
    slippage: number;
    baseReserve: BN;
    quoteReserve: BN;
    virtualQuoteReserves?: BN;
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
}): BuyBaseInputResult;
declare function buyQuoteInput({ quote, slippage, baseReserve, quoteReserve, virtualQuoteReserves, globalConfig, baseMintAccount, baseMint, coinCreator, creator, feeConfig, quoteMint, isMayhemMode, creatorFeeBps, }: {
    quote: BN;
    slippage: number;
    baseReserve: BN;
    quoteReserve: BN;
    virtualQuoteReserves?: BN;
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
}): BuyQuoteInputResult;

export { buyBaseInput, buyQuoteInput, exactQuoteInFees };
