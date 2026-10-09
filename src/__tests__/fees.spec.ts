import { expect } from "chai";
import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import { NATIVE_MINT, NATIVE_MINT_2022 } from "@solana/spl-token";
import {
  calculateFeeTier,
  computeFeesBps,
  feesForQuoteMint,
  isSolLikeQuoteMint,
  isStableQuoteMint,
  isZeroFees,
  SOL_LIKE_QUOTE_MINTS,
  STABLE_QUOTE_MINTS,
  USDC_MINT,
} from "../sdk/fees";
import { Fees, FeeConfig, FeeTier, GlobalConfig } from "../types/sdk";
import { PUMP_FEE_PROGRAM_ID, pumpPoolAuthorityPda } from "../sdk/pda";
import { poolMarketCap, PUMP_AMM_TOTAL_TOKEN_SUPPLY } from "../sdk/util";
import { PUMP_AMM_SDK } from "../sdk/offlinePumpAmm";
import { fees, feeTier, ZERO_FEES } from "./utils";
import { MAINNET_FEE_CONFIG_DATA_BASE64 } from "./feeConfigMainnetFixture";

describe("computeFeesBps", () => {
  const tier1Fees: FeeTier = {
    marketCapLamportsThreshold: new BN(100_000_000_000_000),
    fees: {
      lpFeeBps: new BN(15),
      protocolFeeBps: new BN(5),
      creatorFeeBps: new BN(5),
    },
  };

  const tier2Fees: FeeTier = {
    marketCapLamportsThreshold: new BN(500_000_000_000_000),
    fees: {
      lpFeeBps: new BN(20),
      protocolFeeBps: new BN(5),
      creatorFeeBps: new BN(5),
    },
  };

  const tier3Fees: FeeTier = {
    marketCapLamportsThreshold: new BN(2_500_000_000_000_000),
    fees: {
      lpFeeBps: new BN(15),
      protocolFeeBps: new BN(2),
      creatorFeeBps: new BN(3),
    },
  };

  const flatFees: Fees = {
    lpFeeBps: new BN(25),
    protocolFeeBps: new BN(5),
    creatorFeeBps: new BN(0),
  };

  const globalConfig: GlobalConfig = {
    admin: PublicKey.unique(),
    lpFeeBasisPoints: new BN(42),
    protocolFeeBasisPoints: new BN(42),
    disableFlags: 0,
    protocolFeeRecipients: [],
    coinCreatorFeeBasisPoints: new BN(42),
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

  const feeConfig: FeeConfig = {
    admin: PublicKey.unique(),
    flatFees,
    feeTiers: [tier1Fees, tier2Fees, tier3Fees],
    stableFeeTiers: [],
    exoticFlatFees: ZERO_FEES,
  };

  const baseMint = PublicKey.unique();
  const baseMintSupply = new BN(1_000_000);

  const pumpPool = {
    poolBump: 1,
    index: 0,
    creator: pumpPoolAuthorityPda(baseMint),
    baseMint,
    quoteMint: PublicKey.unique(),
    lpMint: PublicKey.unique(),
    poolBaseTokenAccount: PublicKey.unique(),
    poolQuoteTokenAccount: PublicKey.unique(),
    lpSupply: new BN(1_000_000),
    coinCreator: PublicKey.unique(),
  };

  const tradeSize = new BN(10_000);

  it("market cap should be correct", () => {
    let baseReserve = new BN(1_000_000);
    let quoteReserve = new BN(2_000_000);
    let marketCap = poolMarketCap({
      baseMintSupply,
      baseReserve,
      quoteReserve,
    });
    let expectedMarketCap = quoteReserve.mul(baseMintSupply).div(baseReserve);
    expect(marketCap.toString()).to.equal(expectedMarketCap.toString());

    quoteReserve = new BN(500_000_000_000_000);
    marketCap = poolMarketCap({
      baseMintSupply,
      baseReserve,
      quoteReserve,
    });
    expectedMarketCap = quoteReserve.mul(baseMintSupply).div(baseReserve);
    expect(marketCap.toString()).to.equal(expectedMarketCap.toString());

    baseReserve = new BN(1_000_000);
    quoteReserve = new BN(2_500_000_000_000_000);
    marketCap = poolMarketCap({
      baseMintSupply,
      baseReserve,
      quoteReserve,
    });
    expectedMarketCap = quoteReserve.mul(baseMintSupply).div(baseReserve);
    expect(marketCap.toString()).to.equal(expectedMarketCap.toString());
  });

  it("mayhem pool market cap uses the fixed total token supply, not the live mint supply", () => {
    const baseReserve = new BN(1_000_000);
    const quoteReserve = new BN(2_000_000);
    expect(PUMP_AMM_TOTAL_TOKEN_SUPPLY.toString()).to.equal("1000000000000000");

    const live = poolMarketCap({ baseMintSupply, baseReserve, quoteReserve });
    expect(live.toString()).to.equal(
      quoteReserve.mul(baseMintSupply).div(baseReserve).toString(),
    );
    expect(
      poolMarketCap({
        baseMintSupply,
        baseReserve,
        quoteReserve,
        isMayhemMode: false,
      }).toString(),
    ).to.equal(live.toString());

    const mayhem = poolMarketCap({
      baseMintSupply,
      baseReserve,
      quoteReserve,
      isMayhemMode: true,
    });
    expect(mayhem.toString()).to.equal(
      quoteReserve.mul(PUMP_AMM_TOTAL_TOKEN_SUPPLY).div(baseReserve).toString(),
    );
  });

  it("mayhem pool picks its fee tier from the fixed-supply market cap", () => {
    // Live supply: market cap 2_000_000 (below tier 1). Mayhem basis: 2e6 * 1e15 / 1e6 = 2e15,
    // between tier 2 (5e14) and tier 3 (2.5e15).
    const args = {
      globalConfig,
      feeConfig,
      creator: pumpPool.creator,
      baseMintSupply,
      baseMint: pumpPool.baseMint,
      baseReserve: new BN(1_000_000),
      quoteReserve: new BN(2_000_000),
      tradeSize,
    };
    expectCalculatedFeesEqualFees(
      computeFeesBps({ ...args, isMayhemMode: false }),
      tier1Fees.fees,
    );
    expectCalculatedFeesEqualFees(computeFeesBps(args), tier1Fees.fees);
    expectCalculatedFeesEqualFees(
      computeFeesBps({ ...args, isMayhemMode: true }),
      tier2Fees.fees,
    );
  });

  it("non pump pool should use flat fees", () => {
    const nonPumpPool = {
      ...pumpPool,
      creator: PublicKey.unique(),
    };

    const result = computeFeesBps({
      globalConfig,
      feeConfig,
      creator: nonPumpPool.creator,
      baseMintSupply,
      baseMint: nonPumpPool.baseMint,
      baseReserve: new BN(1_000_000),
      quoteReserve: new BN(2_000_000),
      tradeSize: new BN(10_000),
    });

    expectCalculatedFeesEqualFees(result, flatFees);
  });

  it("pump pool should use first tier when market cap is below first tier", () => {
    const result = computeFeesBps({
      globalConfig,
      feeConfig,
      creator: pumpPool.creator,
      baseMintSupply,
      baseMint: pumpPool.baseMint,
      baseReserve: new BN(1_000_000),
      quoteReserve: new BN(tier1Fees.marketCapLamportsThreshold).sub(new BN(1)),
      tradeSize,
    });
    expectCalculatedFeesEqualFees(result, tier1Fees.fees);
  });

  it("pump pool should use last tier when market cap is above last tier", () => {
    const result = computeFeesBps({
      globalConfig,
      feeConfig,
      creator: pumpPool.creator,
      baseMintSupply,
      baseMint: pumpPool.baseMint,
      baseReserve: new BN(1_000_000),
      quoteReserve: new BN(tier3Fees.marketCapLamportsThreshold).add(new BN(1)),
      tradeSize,
    });
    expectCalculatedFeesEqualFees(result, tier3Fees.fees);
  });

  it("should use global config fees when fee config is null", () => {
    const result = computeFeesBps({
      globalConfig,
      feeConfig: null,
      creator: pumpPool.creator,
      baseMintSupply,
      baseMint: pumpPool.baseMint,
      baseReserve: new BN(1_000_000),
      quoteReserve: new BN(2_000_000),
      tradeSize,
    });
    expectCalculatedFeesEqualFees(result, {
      lpFeeBps: globalConfig.lpFeeBasisPoints,
      protocolFeeBps: globalConfig.protocolFeeBasisPoints,
      creatorFeeBps: globalConfig.coinCreatorFeeBasisPoints,
    });
  });
});

function expectCalculatedFeesEqualFees(actual: Fees, expected: Fees) {
  expect(actual.creatorFeeBps.toString()).to.equal(
    expected.creatorFeeBps.toString()
  );
  expect(actual.lpFeeBps.toString()).to.equal(expected.lpFeeBps.toString());
  expect(actual.protocolFeeBps.toString()).to.equal(
    expected.protocolFeeBps.toString()
  );
}

describe("feesForQuoteMint", () => {
  // Same shape as the pump-fees unit fixture: two tiers per schedule with a 1_000 threshold, and
  // fee values that differ between the SOL and stable schedules at every rank.
  const flatFees = fees(25, 5, 0);
  const solTiers: FeeTier[] = [
    feeTier(0, fees(1, 90, 30)),
    feeTier(1_000, fees(2, 80, 20)),
  ];
  const stableTiers: FeeTier[] = [
    feeTier(0, fees(3, 70, 10)),
    feeTier(1_000, fees(4, 60, 5)),
  ];
  const exoticFlatFees = fees(5, 300, 25);
  const feeConfig: FeeConfig = {
    admin: PublicKey.unique(),
    flatFees,
    feeTiers: solTiers,
    stableFeeTiers: stableTiers,
    exoticFlatFees,
  };

  const DEVNET_USDC = new PublicKey(
    "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  );
  // Two unlisted quote keys. Routing is by key equality only, so nothing about them is specific
  // to a token program; both stand for any SPL or Token-2022 quote that is neither SOL-like nor USDC.
  const splQuote = PublicKey.unique();
  const otherQuote = PublicKey.unique();
  const huge = new BN("340282366920938463463374607431768211455"); // u128::MAX

  function select(
    quoteMint: PublicKey,
    marketCap: BN | number,
    config: FeeConfig = feeConfig,
    isPumpPool = true,
  ): Fees {
    return feesForQuoteMint({
      feeConfig: config,
      isPumpPool,
      marketCap: new BN(marketCap),
      quoteMint,
    });
  }

  it("mirrors the on-chain constants", () => {
    expect(USDC_MINT.toBase58()).to.equal(
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    );
    expect(STABLE_QUOTE_MINTS.map((m) => m.toBase58())).to.deep.equal([
      USDC_MINT.toBase58(),
    ]);
    expect(SOL_LIKE_QUOTE_MINTS.map((m) => m.toBase58())).to.deep.equal([
      PublicKey.default.toBase58(),
      NATIVE_MINT.toBase58(),
      NATIVE_MINT_2022.toBase58(),
    ]);
    expect(NATIVE_MINT_2022.toBase58()).to.equal(
      "9pan9bMn5HatX4EJdBwg9VgCa7Uz5HL8N1m5D3NdXejP",
    );

    for (const mint of SOL_LIKE_QUOTE_MINTS) {
      expect(isSolLikeQuoteMint(mint)).to.be.true;
      expect(isStableQuoteMint(mint)).to.be.false;
    }
    expect(isStableQuoteMint(USDC_MINT)).to.be.true;
    expect(isSolLikeQuoteMint(USDC_MINT)).to.be.false;
    // The on-chain sets are fixed; freezing stops a process-wide mutation from re-routing fees.
    expect(Object.isFrozen(STABLE_QUOTE_MINTS)).to.be.true;
    expect(Object.isFrozen(SOL_LIKE_QUOTE_MINTS)).to.be.true;
    for (const mint of [DEVNET_USDC, splQuote, otherQuote]) {
      expect(isSolLikeQuoteMint(mint)).to.be.false;
      expect(isStableQuoteMint(mint)).to.be.false;
    }

    expect(isZeroFees(ZERO_FEES)).to.be.true;
    expect(isZeroFees(fees(0, 0, 1))).to.be.false;
    expect(isZeroFees(fees(0, 1, 0))).to.be.false;
    expect(isZeroFees(fees(1, 0, 0))).to.be.false;
  });

  it("non-pump pools pay flat fees whatever the quote", () => {
    for (const quote of [PublicKey.default, NATIVE_MINT, USDC_MINT, splQuote]) {
      expectCalculatedFeesEqualFees(
        select(quote, 0, feeConfig, false),
        flatFees,
      );
      expectCalculatedFeesEqualFees(
        select(quote, huge, feeConfig, false),
        flatFees,
      );
    }
  });

  it("SOL-like quotes (zero key, WSOL, Token-2022 native) use the SOL tiers", () => {
    for (const quote of [PublicKey.default, NATIVE_MINT, NATIVE_MINT_2022]) {
      expectCalculatedFeesEqualFees(select(quote, 0), solTiers[0].fees);
      expectCalculatedFeesEqualFees(select(quote, 999), solTiers[0].fees);
      expectCalculatedFeesEqualFees(select(quote, 1_000), solTiers[1].fees);
      expectCalculatedFeesEqualFees(select(quote, huge), solTiers[1].fees);
    }
  });

  it("USDC uses the stable tiers by market cap", () => {
    expectCalculatedFeesEqualFees(select(USDC_MINT, 0), stableTiers[0].fees);
    expectCalculatedFeesEqualFees(select(USDC_MINT, 999), stableTiers[0].fees);
    expectCalculatedFeesEqualFees(
      select(USDC_MINT, 1_000),
      stableTiers[1].fees,
    );
    expectCalculatedFeesEqualFees(select(USDC_MINT, huge), stableTiers[1].fees);
  });

  it("USDC falls back to the SOL tiers when the stable schedule is empty (pre-stable FeeConfig)", () => {
    const preStable: FeeConfig = { ...feeConfig, stableFeeTiers: [] };
    expectCalculatedFeesEqualFees(
      select(USDC_MINT, 999, preStable),
      solTiers[0].fees,
    );
    expectCalculatedFeesEqualFees(
      select(USDC_MINT, 1_000, preStable),
      solTiers[1].fees,
    );
  });

  it("any other quote pays the exotic flat fees regardless of market cap", () => {
    for (const quote of [splQuote, otherQuote, DEVNET_USDC]) {
      expectCalculatedFeesEqualFees(select(quote, 0), exoticFlatFees);
      expectCalculatedFeesEqualFees(select(quote, 1_000), exoticFlatFees);
      expectCalculatedFeesEqualFees(select(quote, huge), exoticFlatFees);
    }
  });

  it("falls back to flat fees while the exotic schedule is unset (all-zero)", () => {
    const unset: FeeConfig = { ...feeConfig, exoticFlatFees: ZERO_FEES };
    for (const quote of [splQuote, otherQuote, DEVNET_USDC]) {
      expectCalculatedFeesEqualFees(select(quote, 0, unset), flatFees);
      expectCalculatedFeesEqualFees(select(quote, huge, unset), flatFees);
    }
    // The fallback is specific to the exotic branch: SOL and USDC schedules are untouched.
    expectCalculatedFeesEqualFees(
      select(NATIVE_MINT, 0, unset),
      solTiers[0].fees,
    );
    expectCalculatedFeesEqualFees(
      select(USDC_MINT, 0, unset),
      stableTiers[0].fees,
    );
  });

  it("calculateFeeTier rejects an empty schedule", () => {
    expect(() =>
      calculateFeeTier({ feeTiers: [], marketCap: new BN(0) }),
    ).to.throw("Fee tiers cannot be empty.");
    expect(() =>
      select(NATIVE_MINT, 0, { ...feeConfig, feeTiers: [] }),
    ).to.throw("Fee tiers cannot be empty.");
    // Both schedules empty: the stable fallback has nothing to fall back to.
    expect(() =>
      select(USDC_MINT, 0, { ...feeConfig, feeTiers: [], stableFeeTiers: [] }),
    ).to.throw("Fee tiers cannot be empty.");
  });

  describe("through computeFeesBps", () => {
    const globalConfig: GlobalConfig = {
      admin: PublicKey.unique(),
      lpFeeBasisPoints: new BN(42),
      protocolFeeBasisPoints: new BN(42),
      disableFlags: 0,
      protocolFeeRecipients: [],
      coinCreatorFeeBasisPoints: new BN(42),
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
    const baseMint = PublicKey.unique();
    // baseMintSupply 1_000 / baseReserve 1_000 => market cap == quoteReserve.
    const args = {
      globalConfig,
      feeConfig,
      creator: pumpPoolAuthorityPda(baseMint),
      baseMintSupply: new BN(1_000),
      baseMint,
      baseReserve: new BN(1_000),
      quoteReserve: new BN(1_000),
    };

    it("omitting quoteMint selects the SOL schedule, exactly like passing WSOL", () => {
      const omitted = computeFeesBps(args);
      expectCalculatedFeesEqualFees(omitted, solTiers[1].fees);
      expectCalculatedFeesEqualFees(
        computeFeesBps({ ...args, quoteMint: NATIVE_MINT }),
        omitted,
      );
      expectCalculatedFeesEqualFees(
        computeFeesBps({ ...args, quoteMint: PublicKey.default }),
        omitted,
      );
    });

    it("selects by the pool's quote mint", () => {
      expectCalculatedFeesEqualFees(
        computeFeesBps({ ...args, quoteMint: USDC_MINT }),
        stableTiers[1].fees,
      );
      expectCalculatedFeesEqualFees(
        computeFeesBps({
          ...args,
          quoteMint: USDC_MINT,
          quoteReserve: new BN(999),
        }),
        stableTiers[0].fees,
      );
      expectCalculatedFeesEqualFees(
        computeFeesBps({ ...args, quoteMint: splQuote }),
        exoticFlatFees,
      );
      expectCalculatedFeesEqualFees(
        computeFeesBps({
          ...args,
          quoteMint: USDC_MINT,
          creator: PublicKey.unique(),
        }),
        flatFees,
      );
    });

    it("a null fee config still returns the global config fees for every quote", () => {
      const fromGlobal = {
        lpFeeBps: globalConfig.lpFeeBasisPoints,
        protocolFeeBps: globalConfig.protocolFeeBasisPoints,
        creatorFeeBps: globalConfig.coinCreatorFeeBasisPoints,
      };
      for (const quote of [undefined, NATIVE_MINT, USDC_MINT, splQuote]) {
        expectCalculatedFeesEqualFees(
          computeFeesBps({ ...args, feeConfig: null, quoteMint: quote }),
          fromGlobal,
        );
      }
    });
  });

  it("live mainnet FeeConfig: a USDC canonical pool lands in a different tier than the SOL schedule", () => {
    const mainnet = PUMP_AMM_SDK.decodeFeeConfig({
      data: Buffer.from(MAINNET_FEE_CONFIG_DATA_BASE64, "base64"),
      executable: false,
      lamports: 0,
      owner: PUMP_FEE_PROGRAM_ID,
    });
    // 100e9 is below the first SOL threshold (420e9 lamports) but above the first stable one
    // (59e9 USDC units), so the same number selects rank 0 on one schedule and rank 1 on the other.
    const marketCap = new BN(100_000_000_000);
    const sol = select(NATIVE_MINT, marketCap, mainnet);
    const usdc = select(USDC_MINT, marketCap, mainnet);
    expectCalculatedFeesEqualFees(sol, mainnet.feeTiers[0].fees);
    expectCalculatedFeesEqualFees(usdc, mainnet.stableFeeTiers[1].fees);
    expect(sol.creatorFeeBps.toString()).to.equal("30");
    expect(usdc.creatorFeeBps.toString()).to.equal("95");
    // The exotic schedule is unset on the live account, so an unlisted quote pays flat fees today.
    expectCalculatedFeesEqualFees(
      select(splQuote, marketCap, mainnet),
      mainnet.flatFees,
    );
    expectCalculatedFeesEqualFees(
      select(DEVNET_USDC, marketCap, mainnet),
      mainnet.flatFees,
    );
  });
});
