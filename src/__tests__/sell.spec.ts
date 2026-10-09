import { expect } from "chai";
import BN from "bn.js";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { NATIVE_MINT, RawMint } from "@solana/spl-token";
import { sellBaseInput, sellQuoteInput } from "../sdk/sell";
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
  FeeConfig,
  Fees,
  GlobalConfig,
  Pool,
  SellBaseInputResult,
  SellQuoteInputResult,
} from "../types/sdk";
import { OnlinePumpAmmSdk } from "../sdk/onlinePumpAmm";
import { PUMP_AMM_SDK } from "../sdk/offlinePumpAmm";

describe("sellBaseInput", () => {
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

  it("should compute final quote and minQuote correctly with typical inputs", () => {
    // Example pool reserves
    const baseReserve = new BN(1_000_000); // base tokens in pool
    const quoteReserve = new BN(2_000_000); // quote tokens in pool

    // The user wants to sell 50,000 base tokens
    const base = new BN(50_000);

    // Slippage = 1% => the user will accept at least 99% of finalQuote
    const slippage = 1;

    const result = sellBaseInput({
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

    console.log("Final quote received:", result.uiQuote.toString());
    console.log("Min quote after slippage:", result.minQuote.toString());

    // Replace these placeholder values with the actual results once you confirm them offline:
    // For example, if you do the math manually or from a reference, set them here:
    const expectedFinalQuote = new BN(94761); // Example placeholder
    const expectedMinQuote = new BN(93813); // Example placeholder

    expect(result.uiQuote.toString()).to.equal(
      expectedFinalQuote.toString(),
      "Incorrect final quote"
    );
    expect(result.minQuote.toString()).to.equal(
      expectedMinQuote.toString(),
      "Incorrect min quote"
    );
  });

  it("should throw an error if 'baseReserve' or 'quoteReserve' is zero", () => {
    const slippage = 1;
    // baseReserve = 0
    expect(() =>
      sellBaseInput({
        base: new BN(1000),
        slippage,
        baseReserve: new BN(0),
        quoteReserve: new BN(2_000_000),
        globalConfig,
        baseMintAccount,
        baseMint: pool.baseMint,
        coinCreator: pool.coinCreator,
        creator: pool.creator,
        feeConfig,
      })
    ).to.throw(
      "Invalid input: 'baseReserve' or 'quoteReserve' cannot be zero."
    );

    // quoteReserve = 0
    expect(() =>
      sellBaseInput({
        base: new BN(1000),
        slippage,
        baseReserve: new BN(1_000_000),
        quoteReserve: new BN(0),
        globalConfig,
        baseMintAccount,
        baseMint: pool.baseMint,
        coinCreator: pool.coinCreator,
        creator: pool.creator,
        feeConfig,
      })
    ).to.throw(
      "Invalid input: 'baseReserve' or 'quoteReserve' cannot be zero."
    );
  });

  it("should throw an error if fees exceed total output (finalQuote negative)", () => {
    // We want quoteAmountOut > 0 but finalQuote < 0 after subtracting fees.
    const base = new BN(1);
    const baseReserve = new BN(1);
    const quoteReserve = new BN(2);
    const slippage = 1;

    const highFeeGlobalConfig: GlobalConfig = {
      admin: PublicKey.unique(),
      lpFeeBasisPoints: new BN(9000),
      protocolFeeBasisPoints: new BN(2000),
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

    const highFeeConfig = createFeeConfigFromGlobalConfig(highFeeGlobalConfig);

    expect(() =>
      sellBaseInput({
        base,
        slippage,
        baseReserve,
        quoteReserve,
        globalConfig,
        baseMintAccount,
        baseMint: pool.baseMint,
        coinCreator: pool.coinCreator,
        creator: pool.creator,
        feeConfig: highFeeConfig,
      })
    ).to.throw("Fees exceed total output; final quote is negative.");
  });

  it("should build the instruction successfully", async () => {
    const pool = new PublicKey("Fzrac7XDX29dYBfMeoPBG18zB2BYFxR5v9fV9zFH7fnV");

    expect(async () => {
      return await PUMP_AMM_SDK.sellBaseInput(
        await sdk.swapSolanaState(pool, user),
        new BN(10),
        10
      );
    }).to.not.throw();
  });
});

describe("sell quote mint fee selection (offline)", () => {
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

  const sellBaseRow = (r: SellBaseInputResult) =>
    [r.uiQuote, r.minQuote, r.internalQuoteAmountOut].map(String);
  const sellQuoteRow = (r: SellQuoteInputResult) =>
    [r.internalRawQuote, r.base, r.minQuote].map(String);

  it("omitting quoteMint prices exactly like WSOL", () => {
    expect(sellBaseRow(sellBaseInput({ ...common, base }))).to.deep.equal(
      sellBaseRow(sellBaseInput({ ...common, base, quoteMint: NATIVE_MINT })),
    );
    expect(sellQuoteRow(sellQuoteInput({ ...common, quote }))).to.deep.equal(
      sellQuoteRow(
        sellQuoteInput({ ...common, quote, quoteMint: NATIVE_MINT }),
      ),
    );
  });

  it("a USDC pool pays the stable schedule", () => {
    const sol = sellBaseInput({ ...common, base });
    const usdc = sellBaseInput({ ...common, base, quoteMint: USDC_MINT });
    expect(sellBaseRow(usdc)).to.deep.equal(
      sellBaseRow(
        sellBaseInput({ ...common, base, feeConfig: withSolTiers(stableFees) }),
      ),
    );
    // The pre-fee output is the same trade; the user receives less after the higher fees.
    expect(usdc.internalQuoteAmountOut.toString()).to.equal(
      sol.internalQuoteAmountOut.toString(),
    );
    expect(usdc.uiQuote.lt(sol.uiQuote)).to.be.true;
    expect(usdc.minQuote.lt(sol.minQuote)).to.be.true;

    const solQ = sellQuoteInput({ ...common, quote });
    const usdcQ = sellQuoteInput({ ...common, quote, quoteMint: USDC_MINT });
    expect(sellQuoteRow(usdcQ)).to.deep.equal(
      sellQuoteRow(
        sellQuoteInput({
          ...common,
          quote,
          feeConfig: withSolTiers(stableFees),
        }),
      ),
    );
    // Receiving the same quote net of higher fees takes more base tokens.
    expect(usdcQ.base.gt(solQ.base)).to.be.true;
    expect(usdcQ.minQuote.toString()).to.equal(solQ.minQuote.toString()); // quote * slippage
  });

  it("an unlisted quote pays the exotic flat fees, or flat fees while they are unset", () => {
    const exoticQuote = PublicKey.unique();
    expect(
      sellBaseRow(sellBaseInput({ ...common, base, quoteMint: exoticQuote })),
    ).to.deep.equal(
      sellBaseRow(
        sellBaseInput({
          ...common,
          base,
          feeConfig: withSolTiers(exoticFlatFees),
        }),
      ),
    );
    const unset: FeeConfig = { ...feeConfig, exoticFlatFees: ZERO_FEES };
    expect(
      sellBaseRow(
        sellBaseInput({
          ...common,
          base,
          feeConfig: unset,
          quoteMint: exoticQuote,
        }),
      ),
    ).to.deep.equal(
      sellBaseRow(
        sellBaseInput({
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
      sellBaseRow(
        sellBaseInput({
          ...golden,
          quoteReserve: new BN("50000000000"),
          base: new BN("1000000000000"),
        }),
      ),
    ).to.deep.equal(["98552892", "97567363", "99800399"]);
    expect(
      sellBaseRow(
        sellBaseInput({
          ...golden,
          coinCreator: PublicKey.default,
          quoteReserve: new BN("1000000000000"),
          virtualQuoteReserves: new BN("30000000000"),
          slippage: 5,
          base: new BN("10000000000000"),
          quoteMint: NATIVE_MINT,
        }),
      ),
    ).to.deep.equal(["20145588234", "19138308822", "20196078431"]);
    expect(
      sellQuoteRow(
        sellQuoteInput({
          ...golden,
          quoteReserve: new BN("250000000000"),
          slippage: 0,
          quote: new BN("1000000000"),
        }),
      ),
    ).to.deep.equal(["1012145749", "2032520325228", "1000000000"]);
    expect(
      sellQuoteRow(
        sellQuoteInput({
          ...golden,
          coinCreator: PublicKey.default,
          quoteReserve: new BN("10000000000000"),
          virtualQuoteReserves: new BN("30000000000"),
          quote: new BN("50000000000"),
          quoteMint: NATIVE_MINT,
        }),
      ),
    ).to.deep.equal(["50125313284", "2511319773921", "49500000000"]);
    // Non-pump pool: flat fees.
    expect(
      sellBaseRow(
        sellBaseInput({
          ...golden,
          creator: PublicKey.unique(),
          quoteReserve: new BN("50000000000"),
          base: new BN("1000000000000"),
        }),
      ),
    ).to.deep.equal(["99500997", "98505987", "99800399"]);
  });

  it("PumpAmmSdk.sellBaseInput / sellQuoteInput price with the pool's quote mint", async () => {
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
      baseAmountIn: BN;
      minQuoteAmountOut: BN;
    }>(await PUMP_AMM_SDK.sellBaseInput(state, base, common.slippage), "sell");
    const expectedBase = sellBaseInput({
      ...poolArgs,
      base,
      quoteMint: USDC_MINT,
    });
    expect(fromBase.baseAmountIn.toString()).to.equal(base.toString());
    expect(fromBase.minQuoteAmountOut.toString()).to.equal(
      expectedBase.minQuote.toString(),
    );
    expect(fromBase.minQuoteAmountOut.toString()).to.not.equal(
      sellBaseInput({ ...poolArgs, base }).minQuote.toString(),
    );

    const fromQuote = decodePumpAmmInstruction<{
      baseAmountIn: BN;
      minQuoteAmountOut: BN;
    }>(
      await PUMP_AMM_SDK.sellQuoteInput(state, quote, common.slippage),
      "sell",
    );
    const expectedQuote = sellQuoteInput({
      ...poolArgs,
      quote,
      quoteMint: USDC_MINT,
    });
    expect(fromQuote.baseAmountIn.toString()).to.equal(
      expectedQuote.base.toString(),
    );
    expect(fromQuote.minQuoteAmountOut.toString()).to.equal(
      expectedQuote.minQuote.toString(),
    );
    expect(fromQuote.baseAmountIn.toString()).to.not.equal(
      sellQuoteInput({ ...poolArgs, quote }).base.toString(),
    );
  });
});
