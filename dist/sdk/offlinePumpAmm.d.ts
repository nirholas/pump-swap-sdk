import { Program } from '@coral-xyz/anchor';
import { P as PumpAmm } from '../pump_amm-CDKyVwzr.js';
import { AccountInfo, TransactionInstruction, PublicKey } from '@solana/web3.js';
import { G as GlobalConfig, F as FeeConfig, P as Pool, i as GlobalVolumeAccumulator, U as UserVolumeAccumulator, k as CreatePoolSolanaState, m as LiquiditySolanaState, D as DepositBaseResult, b as DepositQuoteResult, W as WithdrawResult, l as SwapSolanaState, n as CollectCoinCreatorFeeSolanaState, a as DepositQuoteAndLpTokenFromBaseResult, c as DepositBaseAndLpTokenFromQuoteResult, f as WithdrawAutocompleteResult } from '../sdk-DrGrVjGc.js';
import BN from 'bn.js';
import '@solana/spl-token';

declare const POOL_ACCOUNT_NEW_SIZE = 300;
declare const OFFLINE_PUMP_AMM_PROGRAM: Program<PumpAmm>;
declare class PumpAmmSdk {
    private readonly offlineProgram;
    constructor();
    decodeGlobalConfig(globalConfigAccountInfo: AccountInfo<Buffer>): GlobalConfig;
    decodeFeeConfig(feeConfigAccountInfo: AccountInfo<Buffer>): FeeConfig;
    decodePool(poolAccountInfo: AccountInfo<Buffer>): Pool;
    decodePoolNullable(poolAccountInfo: AccountInfo<Buffer>): Pool | null;
    decodeGlobalVolumeAccumulator(globalVolumeAccumulatorAccountInfo: AccountInfo<Buffer>): GlobalVolumeAccumulator;
    decodeUserVolumeAccumulator(userVolumeAccumulatorAccountInfo: AccountInfo<Buffer>): UserVolumeAccumulator;
    decodeUserVolumeAccumulatorNullable(userVolumeAccumulatorAccountInfo: AccountInfo<Buffer>): UserVolumeAccumulator | null;
    createPoolInstructions(createPoolSolanaState: CreatePoolSolanaState, baseIn: BN, quoteIn: BN): Promise<TransactionInstruction[]>;
    depositInstructionsInternal(liquiditySolanaState: LiquiditySolanaState, lpToken: BN, maxBase: BN, maxQuote: BN): Promise<TransactionInstruction[]>;
    private withWsolAccounts;
    private withWsolAccount;
    private accountExists;
    depositBaseInput(liquiditySolanaState: LiquiditySolanaState, base: BN, slippage: number): DepositBaseResult;
    depositQuoteInput(liquiditySolanaState: LiquiditySolanaState, quote: BN, slippage: number): DepositQuoteResult;
    withdrawInstructionsInternal(liquiditySolanaState: LiquiditySolanaState, lpTokenAmountIn: BN, minBaseAmountOut: BN, minQuoteAmountOut: BN): Promise<TransactionInstruction[]>;
    withdrawInputs(liquiditySolanaState: LiquiditySolanaState, lpAmount: BN, slippage: number): WithdrawResult;
    private liquidityAccounts;
    buyInstructions(swapSolanaState: SwapSolanaState, baseOut: BN, maxQuoteIn: BN): Promise<TransactionInstruction[]>;
    buyInstructionsNoPool(swapSolanaState: SwapSolanaState, baseOut: BN, maxQuoteIn: BN): Promise<TransactionInstruction[]>;
    buyBaseInput(swapSolanaState: SwapSolanaState, base: BN, slippage: number): Promise<TransactionInstruction[]>;
    buyQuoteInput(swapSolanaState: SwapSolanaState, quote: BN, slippage: number): Promise<TransactionInstruction[]>;
    sellInstructions(swapSolanaState: SwapSolanaState, baseAmountIn: BN, minQuoteAmountOut: BN): Promise<TransactionInstruction[]>;
    private withFixPoolInstructions;
    sellInstructionsNoPool(swapSolanaState: SwapSolanaState, baseAmountIn: BN, minQuoteAmountOut: BN): Promise<TransactionInstruction[]>;
    sellBaseInput(swapSolanaState: SwapSolanaState, base: BN, slippage: number): Promise<TransactionInstruction[]>;
    sellQuoteInput(swapSolanaState: SwapSolanaState, quote: BN, slippage: number): Promise<TransactionInstruction[]>;
    extendAccount(account: PublicKey, user: PublicKey): Promise<TransactionInstruction>;
    collectCoinCreatorFee(collectCoinCreatorFeeSolanaState: CollectCoinCreatorFeeSolanaState, payer?: PublicKey | undefined): Promise<TransactionInstruction[]>;
    setCoinCreator(pool: PublicKey): Promise<TransactionInstruction>;
    private swapAccounts;
    syncUserVolumeAccumulator(user: PublicKey): Promise<TransactionInstruction>;
    initUserVolumeAccumulator({ payer, user, }: {
        payer: PublicKey;
        user: PublicKey;
    }): Promise<TransactionInstruction>;
    closeUserVolumeAccumulator(user: PublicKey): Promise<TransactionInstruction>;
    createAutocompleteInitialPoolPrice(initialBase: BN, initialQuote: BN): Promise<BN>;
    depositInstructions(liquiditySolanaState: LiquiditySolanaState, lpToken: BN, slippage: number): Promise<TransactionInstruction[]>;
    depositAutocompleteQuoteAndLpTokenFromBase(liquiditySolanaState: LiquiditySolanaState, base: BN, slippage: number): DepositQuoteAndLpTokenFromBaseResult;
    depositAutocompleteBaseAndLpTokenFromQuote(liquiditySolanaState: LiquiditySolanaState, quote: BN, slippage: number): DepositBaseAndLpTokenFromQuoteResult;
    withdrawInstructions(liquiditySolanaState: LiquiditySolanaState, lpToken: BN, slippage: number): Promise<TransactionInstruction[]>;
    withdrawAutoCompleteBaseAndQuoteFromLpToken(liquiditySolanaState: LiquiditySolanaState, lpAmount: BN, slippage: number): WithdrawAutocompleteResult;
}
declare const PUMP_AMM_SDK: PumpAmmSdk;

export { OFFLINE_PUMP_AMM_PROGRAM, POOL_ACCOUNT_NEW_SIZE, PUMP_AMM_SDK, PumpAmmSdk };
