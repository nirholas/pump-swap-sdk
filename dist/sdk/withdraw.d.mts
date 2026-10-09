import BN from 'bn.js';
import { p as WithdrawResult } from '../sdk-CtXcjwA6.mjs';
import '@solana/web3.js';
import '@solana/spl-token';

declare function withdraw(lpAmount: BN, slippage: number, baseReserve: BN, quoteReserve: BN, totalLpTokens: BN): WithdrawResult;

export { withdraw };
