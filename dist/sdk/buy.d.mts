import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { RawMint } from '@solana/spl-token';
import { G as GlobalConfig, F as FeeConfig, B as BuyBaseInputResult, g as BuyQuoteInputResult } from '../sdk-DrGrVjGc.mjs';

declare function buyBaseInput({ base, slippage, baseReserve, quoteReserve, globalConfig, baseMintAccount, baseMint, coinCreator, creator, feeConfig, }: {
    base: BN;
    slippage: number;
    baseReserve: BN;
    quoteReserve: BN;
    globalConfig: GlobalConfig;
    baseMintAccount: RawMint;
    baseMint: PublicKey;
    coinCreator: PublicKey;
    creator: PublicKey;
    feeConfig: FeeConfig | null;
}): BuyBaseInputResult;
declare function buyQuoteInput({ quote, slippage, baseReserve, quoteReserve, globalConfig, baseMintAccount, baseMint, coinCreator, creator, feeConfig, }: {
    quote: BN;
    slippage: number;
    baseReserve: BN;
    quoteReserve: BN;
    globalConfig: GlobalConfig;
    baseMintAccount: RawMint;
    baseMint: PublicKey;
    coinCreator: PublicKey;
    creator: PublicKey;
    feeConfig: FeeConfig | null;
}): BuyQuoteInputResult;

export { buyBaseInput, buyQuoteInput };
