import { expect } from "chai";
import { PublicKey } from "@solana/web3.js";
import {
  NATIVE_MINT,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  CANONICAL_POOL_INDEX,
  canonicalPoolQuoteMint,
  canonicalPumpPoolPda,
  coinCreatorVaultAtaPda,
  coinCreatorVaultAuthorityPda,
  poolPda,
  pumpPoolAuthorityPda,
} from "../sdk/pda";
import { USDC_MINT } from "../sdk/fees";

describe("canonicalPoolQuoteMint", () => {
  it("maps a SOL bonding curve's zero quote mint to legacy WSOL", () => {
    expect(canonicalPoolQuoteMint(PublicKey.default).equals(NATIVE_MINT)).to.eq(
      true,
    );
  });

  it("leaves every other quote mint alone", () => {
    const quoteMint = PublicKey.unique();
    expect(canonicalPoolQuoteMint(NATIVE_MINT).equals(NATIVE_MINT)).to.eq(true);
    expect(canonicalPoolQuoteMint(USDC_MINT).equals(USDC_MINT)).to.eq(true);
    expect(canonicalPoolQuoteMint(quoteMint).equals(quoteMint)).to.eq(true);
  });
});

describe("canonicalPumpPoolPda", () => {
  const mint = PublicKey.unique();

  it("derives the WSOL pool by default, for WSOL and for the bonding curve's zero key", () => {
    const solPool = poolPda(
      CANONICAL_POOL_INDEX,
      pumpPoolAuthorityPda(mint),
      mint,
      NATIVE_MINT,
    );
    expect(canonicalPumpPoolPda(mint).equals(solPool)).to.eq(true);
    expect(canonicalPumpPoolPda(mint, NATIVE_MINT).equals(solPool)).to.eq(true);
    expect(canonicalPumpPoolPda(mint, PublicKey.default).equals(solPool)).to.eq(
      true,
    );
  });

  it("derives a different pool for a USDC-quoted coin", () => {
    const usdcPool = canonicalPumpPoolPda(mint, USDC_MINT);
    expect(usdcPool.equals(canonicalPumpPoolPda(mint))).to.eq(false);
    expect(
      usdcPool.equals(
        poolPda(
          CANONICAL_POOL_INDEX,
          pumpPoolAuthorityPda(mint),
          mint,
          USDC_MINT,
        ),
      ),
    ).to.eq(true);
  });
});

describe("coinCreatorVaultAtaPda", () => {
  it("derives a different vault ATA per quote token program", () => {
    const vaultAuthority = coinCreatorVaultAuthorityPda(PublicKey.unique());
    const quoteMint = PublicKey.unique();
    const splVault = coinCreatorVaultAtaPda(
      vaultAuthority,
      quoteMint,
      TOKEN_PROGRAM_ID,
    );
    const token2022Vault = coinCreatorVaultAtaPda(
      vaultAuthority,
      quoteMint,
      TOKEN_2022_PROGRAM_ID,
    );
    expect(splVault.equals(token2022Vault)).to.eq(false);
  });
});
