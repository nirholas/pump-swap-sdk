import { expect } from "chai";
import BN from "bn.js";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import {
  getAccount,
  getMint,
  MintLayout,
  NATIVE_MINT,
  RawMint,
} from "@solana/spl-token";
import { buyBaseInput, buyQuoteInput } from "../sdk/buy";
import { USDC_MINT } from "../sdk/fees";
import { PUMP_FEE_PROGRAM_ID, pumpPoolAuthorityPda } from "../sdk/pda";
import {
  createFeeConfigFromGlobalConfig,
  createSwapSolanaState,
  decodePumpAmmInstruction,
  fees,
  feeTier,
  ZERO_FEES,
} from "./utils";
import { MAINNET_FEE_CONFIG_DATA_BASE64 } from "./feeConfigMainnetFixture";
import {
  BuyBaseInputResult,
  BuyQuoteInputResult,
  FeeConfig,
  Fees,
  GlobalConfig,
  Pool,
} from "../types/sdk";
import { OnlinePumpAmmSdk } from "../sdk/onlinePumpAmm";
import { PUMP_AMM_SDK } from "../sdk/offlinePumpAmm";

describe("buyBaseInput with fees", () => {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const sdk = new OnlinePumpAmmSdk(connection);
  const user = new PublicKey("4kBH5H5p9oRkZPGLSx8R4WKoDsmXnEpmzsgkebkKvzSg");

  const baseMintAccount: RawMint = {
    mintAuthorityOption: 0,
    mintAuthority: PublicKey.unique(),
    supply: BigInt(1),
    decimals: 9,
    isInitialized: false,
    freezeAuthorityOption: 0,
    freezeAuthority: PublicKey.unique(),
  };

  const pool: Pool = {
    poolBump: 1,
    index: 0,
    creator: PublicKey.unique(),
    baseMint: PublicKey.unique(),
    quoteMint: PublicKey.unique(),
    lpMint: PublicKey.unique(),
    poolBaseTokenAccount: PublicKey.unique(),
    poolQuoteTokenAccount: PublicKey.unique(),
    lpSupply: new BN(0),
    coinCreator: PublicKey.default,
    isMayhemMode: false,
    isCashbackCoin: false,
    virtualQuoteReserves: new BN(0),
    creatorFeeBps: new BN(0),
    canEditCreatorFee: false,
    isHolderReward: false,
    protocolFees: new BN(0),
    creatorFees: new BN(0),
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

  it("should compute quote + fees + slippage correctly", () => {
    // Example pool reserves
    const baseReserve = new BN(1_000_000);
    const quoteReserve = new BN(2_000_000);

    // Request to buy 10,000 base tokens
    const base = new BN(10_000);

    // Slippage = 1% (slippage=1 => 1%)
    const slippage = 1;

    const result = buyBaseInput({
      base,
      slippage,
      baseReserve,
      quoteReserve,
      globalConfig,
      baseMintAccount,
      baseMint: pool.baseMint,
      coinCreator: pool.coinCreator,
      creator: pool.creator,
      feeConfig,
    });

    console.log("quote =", result.uiQuote.toString());
    console.log("maxQuote =", result.maxQuote.toString());

    // You can calculate offline and replace these with your
    // actual expected values:
    const expectedQuote = new BN(20305); // Example only
    const expectedMaxQuote = new BN(20508); // Example only

    expect(result.uiQuote.toString()).eq(expectedQuote.toString());
    expect(result.maxQuote.toString()).eq(expectedMaxQuote.toString());
  });

  describe("debug quote errors", () => {
    // https://solscan.io/tx/2RvDKD7vfd5bGZ6TLBu4Xm1zhyjUxe1gmFLmHGoFSskssqTuGQk1hD7cvR6UWkqU96CBu5eYnpXodhz4PjVNThcX?cluster=devnet
    const poolKey = new PublicKey(
      "Eo7kU23fKzYbZux6tKcaosFyr7AfJucijzRpNwPrL9G6",
    );
    const baseReserve = new BN(1_000_000_000_000_000);
    const quoteReserve = new BN(1_381_503_388);
    const base = new BN(306_127_676_981_862);
    const quote = new BN(617_120_563);
    const slippage = 0;

    it("buyBaseInput should compute quote + fees + slippage correctly", async () => {
      const pool = await sdk.fetchPool(poolKey);

      const result = buyBaseInput({
        base,
        slippage,
        baseReserve,
        quoteReserve,
        globalConfig,
        baseMintAccount,
        baseMint: pool.baseMint,
        coinCreator: pool.coinCreator,
        creator: pool.creator,
        feeConfig: await sdk.fetchFeeConfigAccount(),
      });

      const expectedQuote = quote.addn(1).toString();
      expect(result.uiQuote.toString()).eq(expectedQuote);
      expect(result.maxQuote.toString()).eq(expectedQuote);
    });

    it("buyQuoteInput should compute quote + fees + slippage correctly", async () => {
      const pool = await sdk.fetchPool(poolKey);

      const result = buyQuoteInput({
        quote,
        slippage,
        baseReserve,
        quoteReserve,
        globalConfig,
        baseMintAccount,
        baseMint: pool.baseMint,
        coinCreator: pool.coinCreator,
        creator: pool.creator,
        feeConfig: await sdk.fetchFeeConfigAccount(),
      });

      expect(result.base.toString()).eq(base.toString());
    });
  });

  describe("debug quote errors2", () => {
    // https://solscan.io/tx/39xg5JpDUAhxPEQf1iyab5hRKLQeg3TAsQ5Tis1z2P4hzzS3b9vhbuTdiLBr4PAjn6XscUfj1CcQ6cmbRca6pCsd?cluster=devnet
    const poolKey = new PublicKey(
      "Eo7kU23fKzYbZux6tKcaosFyr7AfJucijzRpNwPrL9G6",
    );
    const baseReserve = new BN(1_000_000_000_000_000);
    const quoteReserve = new BN(1_381_908_988);
    const base = new BN(66_703_004_162_116);
    const quote = new BN(100_000_000);
    const slippage = 0;

    // AZhWzPYTxCgb6QcSRCSN8kBA57n3jvAneJoUbGmZpump

    function parseMint(data: Buffer): RawMint | null {
      try {
        return MintLayout.decode(new Uint8Array(data)) as RawMint;
      } catch (e) {
        console.warn("Failed to parse mint account", e);
        return null;
      }
    }

    // https://solscan.io/tx/5rYHFqLR5znTecBzPcYCErPEqv1gGT36URE81avB1WJSocvp9s7ADxH2wemQ7z26wvfHmBQmHwuQde7BtukakbKC?cluster=devnet#tokenBalanceChange
    it("buyBaseInput should compute quote + fees + slippage correctly", async () => {
      const pool = await sdk.fetchPool(poolKey);

      const baseMintAccount = parseMint(
        (await connection.getAccountInfo(pool.baseMint))!.data,
      )!;

      const result = buyBaseInput({
        base,
        slippage,
        baseReserve,
        quoteReserve,
        globalConfig: await sdk.fetchGlobalConfigAccount(),
        baseMintAccount,
        baseMint: pool.baseMint,
        coinCreator: pool.coinCreator,
        creator: pool.creator,
        feeConfig: await sdk.fetchFeeConfigAccount(),
      });

      const expectedQuote = quote.addn(2).toString();
      expect(result.uiQuote.toString()).eq(expectedQuote);
      expect(result.maxQuote.toString()).eq(expectedQuote);
    });

    it("buyQuoteInput should compute quote + fees + slippage correctly", async () => {
      const pool = await sdk.fetchPool(poolKey);

      const result = buyQuoteInput({
        quote,
        slippage,
        baseReserve,
        quoteReserve,
        globalConfig,
        baseMintAccount,
        baseMint: pool.baseMint,
        coinCreator: pool.coinCreator,
        creator: pool.creator,
        feeConfig: await sdk.fetchFeeConfigAccount(),
      });

      const expectedBase = base;
      expect(result.base.toString()).eq(expectedBase.toString());

      const result2 = buyBaseInput({
        base: expectedBase,
        slippage,
        baseReserve,
        quoteReserve,
        globalConfig,
        baseMintAccount,
        baseMint: pool.baseMint,
        coinCreator: pool.coinCreator,
        creator: pool.creator,
        feeConfig: await sdk.fetchFeeConfigAccount(),
      });

      const expectedQuote = quote.addn(2).toString();
      expect(result2.uiQuote.toString()).eq(expectedQuote);
      expect(result2.maxQuote.toString()).eq(expectedQuote);
    });
  });

  it("should fail if base > baseReserve", () => {
    const baseReserve = new BN(1_000_000);
    const quoteReserve = new BN(2_000_000);
    const base = new BN(2_000_000); // more than pool
    const slippage = 1;

    expect(() =>
      buyBaseInput({
        base,
        slippage,
        baseReserve,
        quoteReserve,
        globalConfig,
        baseMintAccount,
        baseMint: pool.baseMint,
        coinCreator: pool.coinCreator,
        creator: pool.creator,
        feeConfig,
      }),
    ).to.throw("Cannot buy more base tokens than the pool reserves.");
  });

  it("should build the instruction successfully", async () => {
    const pool = new PublicKey("Fzrac7XDX29dYBfMeoPBG18zB2BYFxR5v9fV9zFH7fnV");

    expect(async () => {
      return await PUMP_AMM_SDK.buyBaseInput(
        await sdk.swapSolanaState(pool, user),
        new BN(10),
        10,
      );
    }).to.not.throw();
  });
});

describe("buy quote mint fee selection (offline)", () => {
  const baseMintAccount: RawMint = {
    mintAuthorityOption: 0,
    mintAuthority: PublicKey.unique(),
    supply: BigInt(1),
    decimals: 9,
    isInitialized: false,
    freezeAuthorityOption: 0,
    freezeAuthority: PublicKey.unique(),
  };

  // Recipients are needed for the PumpAmmSdk wrappers, which build the full instruction.
  const globalConfig: GlobalConfig = {
    admin: PublicKey.unique(),
    lpFeeBasisPoints: new BN(30),
    protocolFeeBasisPoints: new BN(20),
    disableFlags: 0,
    protocolFeeRecipients: [PublicKey.unique()],
    coinCreatorFeeBasisPoints: new BN(0),
    adminSetCoinCreatorAuthority: PublicKey.unique(),
    whitelistPda: PublicKey.unique(),
    reservedFeeRecipient: PublicKey.unique(),
    mayhemModeEnabled: false,
    reservedFeeRecipients: [],
    isCashbackEnabled: false,
    buybackFeeRecipients: [PublicKey.unique()],
    buybackBasisPoints: new BN(0),
    boostAuthority: PublicKey.default,
    boostEnabled: false,
    creatorFeeConfigurable: false,
    maxConfigurableCreatorFeeBps: new BN(0),
  };

  // One tier per schedule with a zero threshold, so every market cap selects it and the three
  // schedules are told apart purely by their fee values.
  const solFees = fees(30, 20, 0);
  const stableFees = fees(100, 50, 0);
  const exoticFlatFees = fees(200, 100, 0);
  const feeConfig: FeeConfig = {
    admin: PublicKey.unique(),
    flatFees: fees(25, 5, 0),
    feeTiers: [feeTier(0, solFees)],
    stableFeeTiers: [feeTier(0, stableFees)],
    exoticFlatFees,
  };
  // The same config with `tierFees` on the SOL schedule: pricing quote X against `feeConfig` must
  // equal pricing WSOL against `withSolTiers(<the fees X selects>)`.
  const withSolTiers = (tierFees: Fees): FeeConfig => ({
    ...feeConfig,
    feeTiers: [feeTier(0, tierFees)],
  });

  const baseMint = PublicKey.unique();
  const common = {
    slippage: 1,
    baseReserve: new BN(1_000_000_000_000),
    quoteReserve: new BN(2_000_000_000),
    globalConfig,
    baseMintAccount,
    baseMint,
    coinCreator: PublicKey.default,
    creator: pumpPoolAuthorityPda(baseMint), // canonical pump pool: tiered schedules apply
    feeConfig,
  };
  const base = new BN(10_000_000_000);
  const quote = new BN(50_000_000);

  const buyBaseRow = (r: BuyBaseInputResult) =>
    [r.internalQuoteAmount, r.uiQuote, r.maxQuote].map(String);
  const buyQuoteRow = (r: BuyQuoteInputResult) =>
    [r.base, r.internalQuoteWithoutFees, r.maxQuote].map(String);

  it("omitting quoteMint prices exactly like WSOL", () => {
    expect(buyBaseRow(buyBaseInput({ ...common, base }))).to.deep.equal(
      buyBaseRow(buyBaseInput({ ...common, base, quoteMint: NATIVE_MINT })),
    );
    expect(buyQuoteRow(buyQuoteInput({ ...common, quote }))).to.deep.equal(
      buyQuoteRow(buyQuoteInput({ ...common, quote, quoteMint: NATIVE_MINT })),
    );
  });

  it("a USDC pool pays the stable schedule", () => {
    const sol = buyBaseInput({ ...common, base });
    const usdc = buyBaseInput({ ...common, base, quoteMint: USDC_MINT });
    expect(buyBaseRow(usdc)).to.deep.equal(
      buyBaseRow(
        buyBaseInput({ ...common, base, feeConfig: withSolTiers(stableFees) }),
      ),
    );
    // The pre-fee amount is the same trade; only the fee-inclusive amounts move.
    expect(usdc.internalQuoteAmount.toString()).to.equal(
      sol.internalQuoteAmount.toString(),
    );
    expect(usdc.uiQuote.gt(sol.uiQuote)).to.be.true;
    expect(usdc.maxQuote.gt(sol.maxQuote)).to.be.true;

    const solQ = buyQuoteInput({ ...common, quote });
    const usdcQ = buyQuoteInput({ ...common, quote, quoteMint: USDC_MINT });
    expect(buyQuoteRow(usdcQ)).to.deep.equal(
      buyQuoteRow(
        buyQuoteInput({
          ...common,
          quote,
          feeConfig: withSolTiers(stableFees),
        }),
      ),
    );
    // Higher fees leave less of the same quote for the swap, so fewer base tokens come out.
    expect(usdcQ.base.lt(solQ.base)).to.be.true;
    expect(usdcQ.maxQuote.toString()).to.equal(solQ.maxQuote.toString()); // quote * slippage
  });

  it("an unlisted quote pays the exotic flat fees, or flat fees while they are unset", () => {
    const exoticQuote = PublicKey.unique();
    expect(
      buyBaseRow(buyBaseInput({ ...common, base, quoteMint: exoticQuote })),
    ).to.deep.equal(
      buyBaseRow(
        buyBaseInput({
          ...common,
          base,
          feeConfig: withSolTiers(exoticFlatFees),
        }),
      ),
    );
    const unset: FeeConfig = { ...feeConfig, exoticFlatFees: ZERO_FEES };
    expect(
      buyBaseRow(
        buyBaseInput({
          ...common,
          base,
          feeConfig: unset,
          quoteMint: exoticQuote,
        }),
      ),
    ).to.deep.equal(
      buyBaseRow(
        buyBaseInput({
          ...common,
          base,
          feeConfig: withSolTiers(feeConfig.flatFees),
        }),
      ),
    );
  });

  it("SOL pools keep their pre-change amounts (live mainnet FeeConfig goldens)", () => {
    // Recorded with the code before `quoteMint` existed; the SOL schedule must not move.
    const mainnet = PUMP_AMM_SDK.decodeFeeConfig({
      data: Buffer.from(MAINNET_FEE_CONFIG_DATA_BASE64, "base64"),
      executable: false,
      lamports: 0,
      owner: PUMP_FEE_PROGRAM_ID,
    });
    const golden = {
      ...common,
      baseMintAccount: {
        ...baseMintAccount,
        supply: BigInt("1000000000000000"),
      },
      baseReserve: new BN("500000000000000"),
      coinCreator: PublicKey.unique(),
      feeConfig: mainnet,
    };

    expect(
      buyBaseRow(
        buyBaseInput({
          ...golden,
          quoteReserve: new BN("50000000000"),
          base: new BN("1000000000000"),
        }),
      ),
    ).to.deep.equal(["100200401", "101452908", "102467437"]);
    expect(
      buyBaseRow(
        buyBaseInput({
          ...golden,
          quoteReserve: new BN("1000000000000"),
          virtualQuoteReserves: new BN("30000000000"),
          slippage: 5,
          base: new BN("10000000000000"),
          quoteMint: NATIVE_MINT,
        }),
      ),
    ).to.deep.equal(["21020408164", "21262142860", "22325250003"]);
    expect(
      buyQuoteRow(
        buyQuoteInput({
          ...golden,
          coinCreator: PublicKey.default,
          quoteReserve: new BN("250000000000"),
          slippage: 0,
          quote: new BN("1000000000"),
        }),
      ),
    ).to.deep.equal(["1987083949507", "997506233", "1000000000"]);
    expect(
      buyQuoteRow(
        buyQuoteInput({
          ...golden,
          quoteReserve: new BN("10000000000000"),
          virtualQuoteReserves: new BN("30000000000"),
          quote: new BN("50000000000"),
          quoteMint: NATIVE_MINT,
        }),
      ),
    ).to.deep.equal(["2459357881156", "49578582050", "50500000000"]);
    // Non-pump pool: flat fees.
    expect(
      buyBaseRow(
        buyBaseInput({
          ...golden,
          creator: PublicKey.unique(),
          quoteReserve: new BN("50000000000"),
          base: new BN("1000000000000"),
        }),
      ),
    ).to.deep.equal(["100200401", "100501004", "101506014"]);
  });

  it("PumpAmmSdk.buyBaseInput / buyQuoteInput price with the pool's quote mint", async () => {
    const state = createSwapSolanaState({
      globalConfig,
      feeConfig,
      quoteMint: USDC_MINT,
      baseMintAccount,
      poolBaseAmount: common.baseReserve,
      poolQuoteAmount: common.quoteReserve,
    });
    const poolArgs = {
      ...common,
      baseMint: state.baseMint,
      creator: state.pool.creator,
    };

    const fromBase = decodePumpAmmInstruction<{
      baseAmountOut: BN;
      maxQuoteAmountIn: BN;
    }>(await PUMP_AMM_SDK.buyBaseInput(state, base, common.slippage), "buy");
    const expectedBase = buyBaseInput({
      ...poolArgs,
      base,
      quoteMint: USDC_MINT,
    });
    expect(fromBase.baseAmountOut.toString()).to.equal(base.toString());
    expect(fromBase.maxQuoteAmountIn.toString()).to.equal(
      expectedBase.maxQuote.toString(),
    );
    expect(fromBase.maxQuoteAmountIn.toString()).to.not.equal(
      buyBaseInput({ ...poolArgs, base }).maxQuote.toString(),
    );

    const fromQuote = decodePumpAmmInstruction<{
      baseAmountOut: BN;
      maxQuoteAmountIn: BN;
    }>(await PUMP_AMM_SDK.buyQuoteInput(state, quote, common.slippage), "buy");
    const expectedQuote = buyQuoteInput({
      ...poolArgs,
      quote,
      quoteMint: USDC_MINT,
    });
    expect(fromQuote.baseAmountOut.toString()).to.equal(
      expectedQuote.base.toString(),
    );
    expect(fromQuote.maxQuoteAmountIn.toString()).to.equal(
      expectedQuote.maxQuote.toString(),
    );
    expect(fromQuote.baseAmountOut.toString()).to.not.equal(
      buyQuoteInput({ ...poolArgs, quote }).base.toString(),
    );
  });

  it("PumpAmmSdk.buyBaseInput prices a mayhem pool from the fixed-supply market cap", async () => {
    // Live supply is 1 token, so the live market cap is 0 and selects tier 0; the mayhem basis
    // gives 2e9 * 1e15 / 1e12 = 2e12, above the 1e12 threshold of tier 1.
    const tiered: FeeConfig = {
      ...feeConfig,
      feeTiers: [
        feeTier(0, solFees),
        feeTier(new BN("1000000000000"), fees(60, 40, 0)),
      ],
    };
    const state = createSwapSolanaState({
      globalConfig,
      feeConfig: tiered,
      quoteMint: NATIVE_MINT,
      baseMintAccount,
      poolBaseAmount: common.baseReserve,
      poolQuoteAmount: common.quoteReserve,
      isMayhemMode: true,
    });
    const poolArgs = {
      ...common,
      baseMint: state.baseMint,
      creator: state.pool.creator,
      feeConfig: tiered,
    };
    const { maxQuoteAmountIn } = decodePumpAmmInstruction<{
      maxQuoteAmountIn: BN;
    }>(await PUMP_AMM_SDK.buyBaseInput(state, base, common.slippage), "buy");
    expect(maxQuoteAmountIn.toString()).to.equal(
      buyBaseInput({
        ...poolArgs,
        base,
        isMayhemMode: true,
      }).maxQuote.toString(),
    );
    expect(maxQuoteAmountIn.toString()).to.not.equal(
      buyBaseInput({ ...poolArgs, base }).maxQuote.toString(),
    );
  });
});
