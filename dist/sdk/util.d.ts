import BN from 'bn.js';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';
import { P as PumpAmm } from '../pump_amm-CDKyVwzr.js';

declare function ceilDiv(a: BN, b: BN): BN;
declare function fee(amount: BN, basisPoints: BN): BN;
declare function getPumpAmmProgram(connection: Connection): Program<PumpAmm>;
declare function isPumpPool(baseMint: PublicKey, poolCreator: PublicKey): boolean;
declare function poolMarketCap({ baseMintSupply, baseReserve, quoteReserve, }: {
    baseMintSupply: BN;
    baseReserve: BN;
    quoteReserve: BN;
}): BN;

export { ceilDiv, fee, getPumpAmmProgram, isPumpPool, poolMarketCap };
