import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import {
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { Buffer } from "buffer";

export const PUMP_PROGRAM_ID = new PublicKey(
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
);

export const PUMP_AMM_PROGRAM_ID = new PublicKey(
  "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA",
);

export const PUMP_FEE_PROGRAM_ID = new PublicKey(
  "pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ",
);

export const PUMP_MINT = new PublicKey(
  "pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn",
);

export const CANONICAL_POOL_INDEX = 0;

export function pumpPda(seeds: Array<Buffer | Uint8Array>) {
  return PublicKey.findProgramAddressSync(seeds, PUMP_PROGRAM_ID)[0];
}

export function pumpAmmPda(seeds: Array<Buffer | Uint8Array>) {
  return PublicKey.findProgramAddressSync(seeds, PUMP_AMM_PROGRAM_ID)[0];
}

export function pumpFeePda(seeds: Array<Buffer | Uint8Array>) {
  return PublicKey.findProgramAddressSync(seeds, PUMP_FEE_PROGRAM_ID)[0];
}

export const GLOBAL_CONFIG_PDA = pumpAmmPda([Buffer.from("global_config")]);

export const PUMP_AMM_EVENT_AUTHORITY_PDA = pumpAmmPda([
  Buffer.from("__event_authority"),
]);

export const GLOBAL_VOLUME_ACCUMULATOR_PDA = pumpAmmPda([
  Buffer.from("global_volume_accumulator"),
]);

export const PUMP_AMM_FEE_CONFIG_PDA = pumpFeePda([
  Buffer.from("fee_config"),
  PUMP_AMM_PROGRAM_ID.toBuffer(),
]);

/** pump's `Global` (`["global"]`), passed to `multi_hop_swap` for its curve hops. */
export const PUMP_GLOBAL_PDA = pumpPda([Buffer.from("global")]);

export const PUMP_EVENT_AUTHORITY_PDA = pumpPda([
  Buffer.from("__event_authority"),
]);

/** pump-fees' `FeeConfig` for the pump program (the curves' fee schedule). */
export const PUMP_FEE_CONFIG_PDA = pumpFeePda([
  Buffer.from("fee_config"),
  PUMP_PROGRAM_ID.toBuffer(),
]);

export function poolPda(
  index: number,
  owner: PublicKey,
  baseMint: PublicKey,
  quoteMint: PublicKey,
): PublicKey {
  return pumpAmmPda([
    Buffer.from("pool"),
    new BN(index).toArrayLike(Buffer, "le", 2),
    owner.toBuffer(),
    baseMint.toBuffer(),
    quoteMint.toBuffer(),
  ]);
}

export function lpMintPda(pool: PublicKey): PublicKey {
  return pumpAmmPda([Buffer.from("pool_lp_mint"), pool.toBuffer()]);
}

export function lpMintAta(lpMint: PublicKey, owner: PublicKey) {
  return getAssociatedTokenAddressSync(
    lpMint,
    owner,
    true,
    TOKEN_2022_PROGRAM_ID,
  );
}

export function pumpPoolAuthorityPda(mint: PublicKey): PublicKey {
  return pumpPda([Buffer.from("pool-authority"), mint.toBuffer()]);
}

/**
 * The pump holder-rewards PDA of `mint` (`["holder-rewards", mint]` under the pump program): the
 * `coinCreator` of a holder-reward coin's canonical pool (`Pool.isHolderReward`). Its coin-creator
 * vault (`coinCreatorVaultAtaPda(coinCreatorVaultAuthorityPda(holderRewardsPda(mint)), ...)`)
 * accrues the pool's creator fees; the pump program pays them out to holders.
 */
export function holderRewardsPda(mint: PublicKey): PublicKey {
  return pumpPda([Buffer.from("holder-rewards"), mint.toBuffer()]);
}

export const MPL_TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);

/** The pump bonding curve of `mint` (`["bonding-curve", mint]` under the pump program). */
export function bondingCurvePda(mint: PublicKey): PublicKey {
  return pumpPda([Buffer.from("bonding-curve"), mint.toBuffer()]);
}

/**
 * The Metaplex token metadata of `mint` (`["metadata", token metadata program, mint]` under that
 * program). `set_coin_creator` reads a canonical pool's coin creator from it.
 */
export function metadataPda(mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      MPL_TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    MPL_TOKEN_METADATA_PROGRAM_ID,
  )[0];
}

/**
 * The quote mint a canonical pump pool is keyed by, given a bonding curve's `quote_mint`: SOL
 * curves store the zero key, but the pool they graduate into is quoted in legacy WSOL.
 */
export function canonicalPoolQuoteMint(
  bondingCurveQuoteMint: PublicKey,
): PublicKey {
  return bondingCurveQuoteMint.equals(PublicKey.default)
    ? NATIVE_MINT
    : bondingCurveQuoteMint;
}

/**
 * The canonical pump pool of `mint`. `quoteMint` may be the pool's quote mint or the bonding
 * curve's `quote_mint` (the zero key for SOL curves); both name the same pool.
 */
export function canonicalPumpPoolPda(
  mint: PublicKey,
  quoteMint: PublicKey = NATIVE_MINT,
): PublicKey {
  return poolPda(
    CANONICAL_POOL_INDEX,
    pumpPoolAuthorityPda(mint),
    mint,
    canonicalPoolQuoteMint(quoteMint),
  );
}

export function userVolumeAccumulatorPda(user: PublicKey): PublicKey {
  return pumpAmmPda([Buffer.from("user_volume_accumulator"), user.toBuffer()]);
}

export function coinCreatorVaultAuthorityPda(coinCreator: PublicKey) {
  return pumpAmmPda([Buffer.from("creator_vault"), coinCreator.toBuffer()]);
}

export function coinCreatorVaultAtaPda(
  coinCreatorVaultAuthority: PublicKey,
  quoteMint: PublicKey,
  quoteTokenProgram: PublicKey,
) {
  return getAssociatedTokenAddressSync(
    quoteMint,
    coinCreatorVaultAuthority,
    true,
    quoteTokenProgram,
  );
}

/**
 * The pump-fees `SharingConfig` of `mint` (`["sharing-config", mint]` under the fee program). It is
 * the coin creator of a pool whose creator fees are shared.
 */
export function feeSharingConfigPda(mint: PublicKey): PublicKey {
  return pumpFeePda([Buffer.from("sharing-config"), mint.toBuffer()]);
}

export function poolV2Pda(baseMint: PublicKey): PublicKey {
  return pumpAmmPda([Buffer.from("pool-v2"), baseMint.toBuffer()]);
}

export function boostVaultAuthorityPda(pool: PublicKey): PublicKey {
  return pumpAmmPda([Buffer.from("boost_vault"), pool.toBuffer()]);
}

export function boostVaultAta(
  boostVaultAuthority: PublicKey,
  quoteMint: PublicKey,
  quoteTokenProgram: PublicKey,
): PublicKey {
  return getAssociatedTokenAddressSync(
    quoteMint,
    boostVaultAuthority,
    true,
    quoteTokenProgram,
  );
}
