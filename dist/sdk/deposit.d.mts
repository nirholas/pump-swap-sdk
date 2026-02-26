import BN from 'bn.js';
import { e as DepositLpTokenResult, d as DepositResult } from '../sdk-DrGrVjGc.mjs';
import '@solana/web3.js';
import '@solana/spl-token';

declare function depositToken0(token0: BN, slippage: number, token0Reserve: BN, token1Reserve: BN, totalLpTokens: BN): DepositResult;
declare function depositLpToken(lpToken: BN, slippage: number, baseReserve: BN, quoteReserve: BN, totalLpTokens: BN): DepositLpTokenResult;

export { depositLpToken, depositToken0 };
