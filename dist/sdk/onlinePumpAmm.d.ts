import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { G as GlobalConfig, F as FeeConfig, P as Pool, i as GlobalVolumeAccumulator, U as UserVolumeAccumulator, k as CreatePoolSolanaState, l as SwapSolanaState, m as LiquiditySolanaState, n as CollectCoinCreatorFeeSolanaState } from '../sdk-DrGrVjGc.js';
import BN from 'bn.js';
import '@solana/spl-token';

declare class OnlinePumpAmmSdk {
    readonly connection: Connection;
    private readonly program;
    constructor(connection: Connection);
    fetchGlobalConfigAccount(): Promise<GlobalConfig>;
    fetchFeeConfigAccount(): Promise<FeeConfig>;
    fetchPool(pool: PublicKey): Promise<Pool>;
    fetchGlobalVolumeAccumulator(): Promise<GlobalVolumeAccumulator>;
    fetchUserVolumeAccumulator(user: PublicKey): Promise<UserVolumeAccumulator | null>;
    createPoolSolanaState(index: number, creator: PublicKey, baseMint: PublicKey, quoteMint: PublicKey, userBaseTokenAccount?: PublicKey | undefined, userQuoteTokenAccount?: PublicKey | undefined): Promise<CreatePoolSolanaState>;
    swapSolanaState(poolKey: PublicKey, user: PublicKey, userBaseTokenAccount?: PublicKey | undefined, userQuoteTokenAccount?: PublicKey | undefined): Promise<SwapSolanaState>;
    swapSolanaStateNoPool(poolKey: PublicKey, user: PublicKey, userBaseTokenAccount?: PublicKey | undefined, userQuoteTokenAccount?: PublicKey | undefined): Promise<SwapSolanaState>;
    liquiditySolanaState(poolKey: PublicKey, user: PublicKey, userBaseTokenAccount?: PublicKey | undefined, userQuoteTokenAccount?: PublicKey | undefined, userPoolTokenAccount?: PublicKey | undefined): Promise<LiquiditySolanaState>;
    collectCoinCreatorFeeSolanaState(coinCreator: PublicKey, coinCreatorTokenAccount?: PublicKey | undefined): Promise<CollectCoinCreatorFeeSolanaState>;
    getCoinCreatorVaultBalance(coinCreator: PublicKey): Promise<BN>;
    claimTokenIncentives(user: PublicKey, payer: PublicKey): Promise<TransactionInstruction[]>;
    getTotalUnclaimedTokens(user: PublicKey): Promise<BN>;
    getCurrentDayTokens(user: PublicKey): Promise<BN>;
}

export { OnlinePumpAmmSdk };
