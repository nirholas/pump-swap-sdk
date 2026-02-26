import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';

declare const PUMP_PROGRAM_ID: PublicKey;
declare const PUMP_AMM_PROGRAM_ID: PublicKey;
declare const PUMP_FEE_PROGRAM_ID: PublicKey;
declare const PUMP_MINT: PublicKey;
declare const CANONICAL_POOL_INDEX = 0;
declare function pumpPda(seeds: Array<Buffer | Uint8Array>): PublicKey;
declare function pumpAmmPda(seeds: Array<Buffer | Uint8Array>): PublicKey;
declare function pumpFeePda(seeds: Array<Buffer | Uint8Array>): PublicKey;
declare const GLOBAL_CONFIG_PDA: PublicKey;
declare const PUMP_AMM_EVENT_AUTHORITY_PDA: PublicKey;
declare const GLOBAL_VOLUME_ACCUMULATOR_PDA: PublicKey;
declare const PUMP_AMM_FEE_CONFIG_PDA: PublicKey;
declare function poolPda(index: number, owner: PublicKey, baseMint: PublicKey, quoteMint: PublicKey): PublicKey;
declare function lpMintPda(pool: PublicKey): PublicKey;
declare function lpMintAta(lpMint: PublicKey, owner: PublicKey): PublicKey;
declare function pumpPoolAuthorityPda(mint: PublicKey): PublicKey;
declare function canonicalPumpPoolPda(mint: PublicKey): PublicKey;
declare function userVolumeAccumulatorPda(user: PublicKey): PublicKey;
declare function coinCreatorVaultAuthorityPda(coinCreator: PublicKey): PublicKey;
declare function coinCreatorVaultAtaPda(coinCreatorVaultAuthority: PublicKey, quoteMint: PublicKey, quoteTokenProgram: PublicKey): PublicKey;

export { CANONICAL_POOL_INDEX, GLOBAL_CONFIG_PDA, GLOBAL_VOLUME_ACCUMULATOR_PDA, PUMP_AMM_EVENT_AUTHORITY_PDA, PUMP_AMM_FEE_CONFIG_PDA, PUMP_AMM_PROGRAM_ID, PUMP_FEE_PROGRAM_ID, PUMP_MINT, PUMP_PROGRAM_ID, canonicalPumpPoolPda, coinCreatorVaultAtaPda, coinCreatorVaultAuthorityPda, lpMintAta, lpMintPda, poolPda, pumpAmmPda, pumpFeePda, pumpPda, pumpPoolAuthorityPda, userVolumeAccumulatorPda };
