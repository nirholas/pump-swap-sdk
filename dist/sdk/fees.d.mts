import BN from 'bn.js';
import { G as GlobalConfig, F as FeeConfig, p as Fees, o as FeeTier } from '../sdk-DrGrVjGc.mjs';
import { PublicKey } from '@solana/web3.js';
import '@solana/spl-token';

declare function computeFeesBps({ globalConfig, feeConfig, creator, baseMintSupply, baseMint, baseReserve, quoteReserve, tradeSize, }: {
    globalConfig: GlobalConfig;
    feeConfig: FeeConfig | null;
    creator: PublicKey;
    baseMintSupply: BN;
    baseMint: PublicKey;
    baseReserve: BN;
    quoteReserve: BN;
    tradeSize: BN;
}): Fees;
declare function calculateFeeTier({ feeTiers, marketCap, }: {
    feeTiers: FeeTier[];
    marketCap: BN;
}): Fees;
declare function getFeeRecipient(globalConfig: GlobalConfig, isMayhemMode: boolean): PublicKey;

export { calculateFeeTier, computeFeesBps, getFeeRecipient };
