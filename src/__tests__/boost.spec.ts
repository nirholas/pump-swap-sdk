import { expect } from "chai";
import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import { RawMint } from "@solana/spl-token";
import { buyQuoteInput } from "../sdk/buy";
import { sellBaseInput, sellQuoteInput } from "../sdk/sell";
import { createFeeConfigFromGlobalConfig } from "./utils";
import { GlobalConfig } from "../types/sdk";

describe("boost-aware quote logic", () => {
  const baseMintAccount: RawMint = {
    mintAuthorityOption: 0,
    mintAuthority: PublicKey.unique(),
    supply: BigInt(1),
    decimals: 9,
    isInitialized: false,
    freezeAuthorityOption: 0,
    freezeAuthority: PublicKey.unique(),
  };

  const globalConfig: GlobalConfig = {
    admin: PublicKey.unique(),
    lpFeeBasisPoints: new BN(30),
    protocolFeeBasisPoints: new BN(20),
    disableFlags: 0,
    protocolFeeRecipients: [],
    coinCreatorFeeBasisPoints: new BN(0),
    adminSetCoinCreatorAuthority: PublicKey.unique(),
    whitelistPda: PublicKey.unique(),
    reservedFeeRecipient: PublicKey.unique(),
    mayhemModeEnabled: false,
    reservedFeeRecipients: [],
    isCashbackEnabled: false,
    buybackFeeRecipients: [],
    buybackBasisPoints: new BN(0),
    boostAuthority: PublicKey.default,
    boostEnabled: false,
    creatorFeeConfigurable: false,
    maxConfigurableCreatorFeeBps: new BN(0),
  };

  const feeConfig = createFeeConfigFromGlobalConfig(globalConfig);
  const coinCreator = PublicKey.default;
  const creator = PublicKey.unique();
  const baseMint = PublicKey.unique();

  it("prices buys against effective (real + virtual) quote reserves", () => {
    const baseReserve = new BN(1_000_000);
    const quoteReserve = new BN(2_000_000);
    const quote = new BN(100_000);

    const withoutVirtual = buyQuoteInput({
      quote,
      slippage: 0,
      baseReserve,
      quoteReserve,
      globalConfig,
      baseMintAccount,
      baseMint,
      coinCreator,
      creator,
      feeConfig,
    });

    const withVirtual = buyQuoteInput({
      quote,
      slippage: 0,
      baseReserve,
      quoteReserve,
      virtualQuoteReserves: new BN(2_000_000),
      globalConfig,
      baseMintAccount,
      baseMint,
      coinCreator,
      creator,
      feeConfig,
    });

    // Larger effective reserves dampen price impact, so the same quote in
    // buys fewer base tokens.
    expect(withVirtual.base.lt(withoutVirtual.base)).to.eq(true);
  });

  it("rejects sells whose output exceeds the real quote reserves", () => {
    expect(() =>
      sellBaseInput({
        base: new BN(1_000),
        slippage: 0,
        baseReserve: new BN(1_000),
        quoteReserve: new BN(1_000),
        virtualQuoteReserves: new BN(1_000_000),
        globalConfig,
        baseMintAccount,
        baseMint,
        coinCreator,
        creator,
        feeConfig,
      }),
    ).to.throw(/Insufficient real quote reserves/);
  });

  // Boosted pool whose v2 trades left fees in the vault: sigma 1_000_000 minus 100_000 of fee
  // buckets gives virtualQuoteReserves 900_000, so real reserves are 900_000 of the 1_000_000 vault.
  it("rejects sells the vault covers only with accrued fee buckets", () => {
    const args = {
      base: new BN(1_000_000),
      slippage: 0,
      baseReserve: new BN(1_000_000),
      quoteReserve: new BN(1_000_000),
      virtualQuoteReserves: new BN(900_000),
      globalConfig,
      baseMintAccount,
      baseMint,
      coinCreator,
      creator,
      feeConfig,
    };

    // 950_000 out minus a 2_850 LP fee fits the vault, not the vault minus the buckets.
    expect(sellBaseInput(args).internalQuoteAmountOut.toString()).to.eq(
      "950000",
    );
    expect(() =>
      sellBaseInput({ ...args, feeBucketsTotal: new BN(100_000) }),
    ).to.throw(/Insufficient real quote reserves/);
  });

  it("checks sellQuoteInput's gross outflow, not the user's quote, against real reserves", () => {
    const args = {
      slippage: 0,
      baseReserve: new BN(1_000_000),
      quoteReserve: new BN(1_000_000),
      virtualQuoteReserves: new BN(1_000_000),
      globalConfig,
      baseMintAccount,
      baseMint,
      coinCreator,
      creator,
      feeConfig,
    };

    // 999_000 fits the vault, but with the protocol fee the outflow is ~1_001_000.
    expect(() => sellQuoteInput({ ...args, quote: new BN(999_000) })).to.throw(
      /Insufficient real quote reserves/,
    );
    // 990_000 needs ~992_000 of liquidity: fine, until 10_000 of it is fee buckets.
    sellQuoteInput({ ...args, quote: new BN(990_000) });
    expect(() =>
      sellQuoteInput({
        ...args,
        quote: new BN(990_000),
        feeBucketsTotal: new BN(10_000),
      }),
    ).to.throw(/Insufficient real quote reserves/);
  });

  it("matches non-boost pricing when virtual reserves are zero", () => {
    const args = {
      base: new BN(1_000),
      slippage: 0,
      baseReserve: new BN(1_000_000),
      quoteReserve: new BN(2_000_000),
      globalConfig,
      baseMintAccount,
      baseMint,
      coinCreator,
      creator,
      feeConfig,
    };

    const baseline = sellBaseInput(args);
    const explicitZero = sellBaseInput({
      ...args,
      virtualQuoteReserves: new BN(0),
    });

    expect(explicitZero.uiQuote.toString()).to.eq(baseline.uiQuote.toString());
  });
});
