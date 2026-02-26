import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { RawMint } from '@solana/spl-token';
import { G as GlobalConfig, F as FeeConfig, S as SellBaseInputResult, h as SellQuoteInputResult } from '../sdk-DrGrVjGc.mjs';

declare function sellBaseInput({ base, slippage, baseReserve, quoteReserve, globalConfig, baseMintAccount, baseMint, coinCreator, creator, feeConfig, }: {
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
}): SellBaseInputResult;
declare function sellQuoteInput({ quote, slippage, baseReserve, quoteReserve, globalConfig, baseMintAccount, baseMint, coinCreator, creator, feeConfig, }: {
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
}): SellQuoteInputResult;

export { sellBaseInput, sellQuoteInput };
