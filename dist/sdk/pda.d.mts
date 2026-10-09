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
/** pump's `Global` (`["global"]`), passed to `multi_hop_swap` for its curve hops. */
declare const PUMP_GLOBAL_PDA: PublicKey;
declare const PUMP_EVENT_AUTHORITY_PDA: PublicKey;
/** pump-fees' `FeeConfig` for the pump program (the curves' fee schedule). */
declare const PUMP_FEE_CONFIG_PDA: PublicKey;
declare function poolPda(index: number, owner: PublicKey, baseMint: PublicKey, quoteMint: PublicKey): PublicKey;
declare function lpMintPda(pool: PublicKey): PublicKey;
declare function lpMintAta(lpMint: PublicKey, owner: PublicKey): PublicKey;
declare function pumpPoolAuthorityPda(mint: PublicKey): PublicKey;
/**
 * The pump holder-rewards PDA of `mint` (`["holder-rewards", mint]` under the pump program): the
 * `coinCreator` of a holder-reward coin's canonical pool (`Pool.isHolderReward`). Its coin-creator
 * vault (`coinCreatorVaultAtaPda(coinCreatorVaultAuthorityPda(holderRewardsPda(mint)), ...)`)
 * accrues the pool's creator fees; the pump program pays them out to holders.
 */
declare function holderRewardsPda(mint: PublicKey): PublicKey;
declare const MPL_TOKEN_METADATA_PROGRAM_ID: PublicKey;
/** The pump bonding curve of `mint` (`["bonding-curve", mint]` under the pump program). */
declare function bondingCurvePda(mint: PublicKey): PublicKey;
/**
 * The Metaplex token metadata of `mint` (`["metadata", token metadata program, mint]` under that
 * program). `set_coin_creator` reads a canonical pool's coin creator from it.
 */
declare function metadataPda(mint: PublicKey): PublicKey;
/**
 * The quote mint a canonical pump pool is keyed by, given a bonding curve's `quote_mint`: SOL
 * curves store the zero key, but the pool they graduate into is quoted in legacy WSOL.
 */
declare function canonicalPoolQuoteMint(bondingCurveQuoteMint: PublicKey): PublicKey;
/**
 * The canonical pump pool of `mint`. `quoteMint` may be the pool's quote mint or the bonding
 * curve's `quote_mint` (the zero key for SOL curves); both name the same pool.
 */
declare function canonicalPumpPoolPda(mint: PublicKey, quoteMint?: PublicKey): PublicKey;
declare function userVolumeAccumulatorPda(user: PublicKey): PublicKey;
declare function coinCreatorVaultAuthorityPda(coinCreator: PublicKey): PublicKey;
declare function coinCreatorVaultAtaPda(coinCreatorVaultAuthority: PublicKey, quoteMint: PublicKey, quoteTokenProgram: PublicKey): PublicKey;
/**
 * The pump-fees `SharingConfig` of `mint` (`["sharing-config", mint]` under the fee program). It is
 * the coin creator of a pool whose creator fees are shared.
 */
declare function feeSharingConfigPda(mint: PublicKey): PublicKey;
declare function poolV2Pda(baseMint: PublicKey): PublicKey;
declare function boostVaultAuthorityPda(pool: PublicKey): PublicKey;
declare function boostVaultAta(boostVaultAuthority: PublicKey, quoteMint: PublicKey, quoteTokenProgram: PublicKey): PublicKey;

export { CANONICAL_POOL_INDEX, GLOBAL_CONFIG_PDA, GLOBAL_VOLUME_ACCUMULATOR_PDA, MPL_TOKEN_METADATA_PROGRAM_ID, PUMP_AMM_EVENT_AUTHORITY_PDA, PUMP_AMM_FEE_CONFIG_PDA, PUMP_AMM_PROGRAM_ID, PUMP_EVENT_AUTHORITY_PDA, PUMP_FEE_CONFIG_PDA, PUMP_FEE_PROGRAM_ID, PUMP_GLOBAL_PDA, PUMP_MINT, PUMP_PROGRAM_ID, bondingCurvePda, boostVaultAta, boostVaultAuthorityPda, canonicalPoolQuoteMint, canonicalPumpPoolPda, coinCreatorVaultAtaPda, coinCreatorVaultAuthorityPda, feeSharingConfigPda, holderRewardsPda, lpMintAta, lpMintPda, metadataPda, poolPda, poolV2Pda, pumpAmmPda, pumpFeePda, pumpPda, pumpPoolAuthorityPda, userVolumeAccumulatorPda };
