import BN from 'bn.js';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';
import { P as PumpAmm } from '../pump_amm-D1Mp6mIm.mjs';
import { P as Pool } from '../sdk-CtXcjwA6.mjs';
import '@solana/spl-token';

declare function ceilDiv(a: BN, b: BN): BN;
declare function fee(amount: BN, basisPoints: BN): BN;
declare function getPumpAmmProgram(connection: Connection): Program<PumpAmm>;
declare function isPumpPool(baseMint: PublicKey, poolCreator: PublicKey): boolean;
/**
 * Whether `buy_v2` / `buy_exact_quote_in_v2` / `sell_v2` accept `pool`: every pool but a cashback
 * coin's, whose creator fee is the buyer's cashback, which v2 never pays (it keeps trading
 * through v1).
 *
 * rust reference: pump-amm check_pool_supported()
 */
declare function supportsTradeV2(pool: Pool): boolean;
/**
 * pump-amm `TOTAL_TOKEN_SUPPLY`: the circulating supply the program uses as the market-cap basis
 * for mayhem-mode pools instead of the live base mint supply (`Pool::market_cap`).
 */
declare const PUMP_AMM_TOTAL_TOKEN_SUPPLY: BN;
declare function poolMarketCap({ baseMintSupply, baseReserve, quoteReserve, isMayhemMode, }: {
    baseMintSupply: BN;
    baseReserve: BN;
    quoteReserve: BN;
    isMayhemMode?: boolean;
}): BN;

export { PUMP_AMM_TOTAL_TOKEN_SUPPLY, ceilDiv, fee, getPumpAmmProgram, isPumpPool, poolMarketCap, supportsTradeV2 };
