import BN from 'bn.js';
import { W as WithdrawResult } from '../sdk-DrGrVjGc.js';
import '@solana/web3.js';
import '@solana/spl-token';

declare function withdraw(lpAmount: BN, slippage: number, baseReserve: BN, quoteReserve: BN, totalLpTokens: BN): WithdrawResult;

export { withdraw };
