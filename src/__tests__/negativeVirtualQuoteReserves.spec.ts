import { expect } from "chai";
import BN from "bn.js";
import { AccountInfo, PublicKey } from "@solana/web3.js";
import { NATIVE_MINT, RawMint, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { buyBaseInput, buyQuoteInput } from "../sdk/buy";
import { sellBaseInput, sellQuoteInput } from "../sdk/sell";
import { multiHopSwapQuote, MultiHopPoolQuoteHop } from "../sdk/multiHop";
import { OFFLINE_PUMP_AMM_PROGRAM, PUMP_AMM_SDK } from "../sdk/offlinePumpAmm";
import { PUMP_AMM_PROGRAM_ID } from "../sdk/pda";
import { GlobalConfig, Pool, SwapSolanaState } from "../types/sdk";
import {
  createFeeConfigFromGlobalConfig,
  createSwapSolanaState,
  decodePumpAmmInstruction,
} from "./utils";

// Since the October 2026 PumpSwap upgrade, v2 trades and multi_hop_swap keep the protocol and
// creator fee in the quote vault and subtract them from `Pool::virtual_quote_reserves`, an i128
// that is now negative on most pools with v2 volume. Every quote path must price against
// `vault + virtual_quote_reserves` as a signed addition; reading the field as unsigned (or its
// absolute value) over-prices buys and over-pays sells.
// See pump-public-docs docs/NEGATIVE_VIRTUAL_QUOTE_RESERVES.md.

function globalConfigWithFees(
  lpFeeBps: number,
  protocolFeeBps: number,
  creatorFeeBps: number,
): GlobalConfig {
  return {
    admin: PublicKey.unique(),
    lpFeeBasisPoints: new BN(lpFeeBps),
    protocolFeeBasisPoints: new BN(protocolFeeBps),
    disableFlags: 0,
    protocolFeeRecipients: [PublicKey.unique()],
    coinCreatorFeeBasisPoints: new BN(creatorFeeBps),
    adminSetCoinCreatorAuthority: PublicKey.unique(),
    whitelistPda: PublicKey.unique(),
    reservedFeeRecipient: PublicKey.unique(),
    mayhemModeEnabled: false,
    reservedFeeRecipients: [],
    isCashbackEnabled: false,
    buybackFeeRecipients: [PublicKey.unique()],
    buybackBasisPoints: new BN(2_000),
    boostAuthority: PublicKey.default,
    boostEnabled: false,
    creatorFeeConfigurable: false,
    maxConfigurableCreatorFeeBps: new BN(0),
  };
}

const noFeeGlobalConfig = globalConfigWithFees(0, 0, 0);
const noFeeConfig = createFeeConfigFromGlobalConfig(noFeeGlobalConfig);
const feeGlobalConfig = globalConfigWithFees(20, 5, 5);
const feeConfig = createFeeConfigFromGlobalConfig(feeGlobalConfig);

const baseMintAccount: RawMint = {
  mintAuthorityOption: 0,
  mintAuthority: PublicKey.unique(),
  supply: BigInt("1000000000000000"),
  decimals: 6,
  isInitialized: true,
  freezeAuthorityOption: 0,
  freezeAuthority: PublicKey.unique(),
};

// 500M base tokens against a 30 SOL quote vault that also holds 0.6 SOL of fees waiting to be
// swept, so virtual_quote_reserves = -0.6 SOL and the effective reserves are 29.4 SOL.
const BASE_RESERVE = BigInt("500000000000000");
const QUOTE_VAULT = BigInt(30_000_000_000);
const WAITING_FEES = BigInt(600_000_000);
const VIRTUAL = -WAITING_FEES;
const EFFECTIVE = QUOTE_VAULT + VIRTUAL;

const bn = (value: bigint) => new BN(value.toString());
const ceilDiv = (a: bigint, b: bigint) => (a + b - BigInt(1)) / b;

// Reference constant-product math of pump-amm, written independently of the SDK.
const cpQuoteForBaseOut = (base: bigint, effective: bigint) =>
  ceilDiv(effective * base, BASE_RESERVE - base);
const cpQuoteForBaseIn = (base: bigint, effective: bigint) =>
  (effective * base) / (BASE_RESERVE + base);
const cpBaseForQuoteIn = (quote: bigint, effective: bigint) =>
  (BASE_RESERVE * (quote - BigInt(1))) / (effective + quote - BigInt(1));
const cpBaseForQuoteOut = (quote: bigint, effective: bigint) =>
  ceilDiv(BASE_RESERVE * quote, effective - quote);

function quoteArgs(
  virtualQuoteReserves: bigint,
  { withFees = false, quoteReserve = QUOTE_VAULT } = {},
) {
  return {
    slippage: 0,
    baseReserve: bn(BASE_RESERVE),
    quoteReserve: bn(quoteReserve),
    virtualQuoteReserves: bn(virtualQuoteReserves),
    globalConfig: withFees ? feeGlobalConfig : noFeeGlobalConfig,
    feeConfig: withFees ? feeConfig : noFeeConfig,
    baseMintAccount,
    baseMint: PublicKey.unique(),
    coinCreator: PublicKey.unique(),
    creator: PublicKey.unique(),
    quoteMint: NATIVE_MINT,
  };
}

describe("negative virtual_quote_reserves in the quote functions", () => {
  const base = BigInt(1_000_000_000_000);
  const quote = BigInt(250_000_000);

  it("buyBaseInput prices against vault + virtual reserves (signed)", () => {
    const { uiQuote } = buyBaseInput({ ...quoteArgs(VIRTUAL), base: bn(base) });
    expect(uiQuote.toString()).to.equal(
      cpQuoteForBaseOut(base, EFFECTIVE).toString(),
    );
    // Reading the field unsigned (its magnitude) or ignoring it over-prices the buy.
    const unsigned = buyBaseInput({
      ...quoteArgs(WAITING_FEES),
      base: bn(base),
    }).uiQuote;
    const ignored = buyBaseInput({ ...quoteArgs(BigInt(0)), base: bn(base) })
      .uiQuote;
    expect(uiQuote.lt(ignored)).to.eq(true);
    expect(ignored.lt(unsigned)).to.eq(true);
  });

  it("buyQuoteInput buys more base when the virtual reserves are negative", () => {
    const { base: baseOut } = buyQuoteInput({
      ...quoteArgs(VIRTUAL),
      quote: bn(quote),
    });
    expect(baseOut.toString()).to.equal(
      cpBaseForQuoteIn(quote, EFFECTIVE).toString(),
    );
    const ignored = buyQuoteInput({
      ...quoteArgs(BigInt(0)),
      quote: bn(quote),
    }).base;
    expect(baseOut.gt(ignored)).to.eq(true);
  });

  it("sellBaseInput pays out of the effective reserves, not the vault", () => {
    const { uiQuote } = sellBaseInput({
      ...quoteArgs(VIRTUAL),
      base: bn(base),
      feeBucketsTotal: bn(WAITING_FEES),
    });
    expect(uiQuote.toString()).to.equal(
      cpQuoteForBaseIn(base, EFFECTIVE).toString(),
    );
    const ignored = sellBaseInput({
      ...quoteArgs(BigInt(0)),
      base: bn(base),
    }).uiQuote;
    expect(uiQuote.lt(ignored)).to.eq(true);
  });

  it("sellQuoteInput needs more base for the same quote when the virtual reserves are negative", () => {
    const { base: baseIn } = sellQuoteInput({
      ...quoteArgs(VIRTUAL),
      quote: bn(quote),
      feeBucketsTotal: bn(WAITING_FEES),
    });
    expect(baseIn.toString()).to.equal(
      cpBaseForQuoteOut(quote, EFFECTIVE).toString(),
    );
    const ignored = sellQuoteInput({
      ...quoteArgs(BigInt(0)),
      quote: bn(quote),
    }).base;
    expect(baseIn.gt(ignored)).to.eq(true);
  });

  it("with fees, a negative value prices exactly like a vault already holding the effective reserves", () => {
    const withFees = { withFees: true };
    const swept = { withFees: true, quoteReserve: EFFECTIVE };
    const pairs: [string, BN, BN][] = [
      [
        "buyBaseInput",
        buyBaseInput({ ...quoteArgs(VIRTUAL, withFees), base: bn(base) })
          .uiQuote,
        buyBaseInput({ ...quoteArgs(BigInt(0), swept), base: bn(base) })
          .uiQuote,
      ],
      [
        "buyQuoteInput",
        buyQuoteInput({ ...quoteArgs(VIRTUAL, withFees), quote: bn(quote) })
          .base,
        buyQuoteInput({ ...quoteArgs(BigInt(0), swept), quote: bn(quote) })
          .base,
      ],
      [
        "sellBaseInput",
        sellBaseInput({
          ...quoteArgs(VIRTUAL, withFees),
          base: bn(base),
          feeBucketsTotal: bn(WAITING_FEES),
        }).uiQuote,
        sellBaseInput({ ...quoteArgs(BigInt(0), swept), base: bn(base) })
          .uiQuote,
      ],
      [
        "sellQuoteInput",
        sellQuoteInput({
          ...quoteArgs(VIRTUAL, withFees),
          quote: bn(quote),
          feeBucketsTotal: bn(WAITING_FEES),
        }).base,
        sellQuoteInput({ ...quoteArgs(BigInt(0), swept), quote: bn(quote) })
          .base,
      ],
    ];
    for (const [name, beforeSweep, afterSweep] of pairs) {
      expect(beforeSweep.toString(), name).to.equal(afterSweep.toString());
    }
  });

  it("keeps full precision when the virtual reserves exceed 2^53 in magnitude", () => {
    // A u64-sized vault almost entirely offset by the signed field: effective reserves of 1e13.
    const vault = BigInt("18000000000000000000");
    const virtual = BigInt("-17999990000000000000");
    const effective = vault + virtual;
    const { uiQuote } = buyBaseInput({
      ...quoteArgs(virtual, { quoteReserve: vault }),
      base: bn(base),
    });
    expect(uiQuote.toString()).to.equal(
      cpQuoteForBaseOut(base, effective).toString(),
    );
  });
});

describe("negative virtual_quote_reserves through the instruction builders", () => {
  const POOL_VIRTUAL_RESERVES_OFFSET = 245;

  // `Pool` bytes as the program writes them, with virtual_quote_reserves stored as an i128 in
  // two's complement little-endian, built by hand rather than by the coder under test.
  async function poolAccountWithVirtualReserves(
    pool: Pool,
    virtualQuoteReserves: bigint,
  ): Promise<AccountInfo<Buffer>> {
    const data = await OFFLINE_PUMP_AMM_PROGRAM.coder.accounts.encode<Pool>(
      "pool",
      { ...pool, virtualQuoteReserves: new BN(0) },
    );
    const raw = BigInt.asUintN(128, virtualQuoteReserves);
    data.writeBigUInt64LE(
      raw & BigInt("0xffffffffffffffff"),
      POOL_VIRTUAL_RESERVES_OFFSET,
    );
    data.writeBigUInt64LE(raw >> BigInt(64), POOL_VIRTUAL_RESERVES_OFFSET + 8);
    return { data, executable: false, lamports: 1, owner: PUMP_AMM_PROGRAM_ID };
  }

  function stateWith(
    poolQuoteAmount: bigint,
    pool: Partial<Pool>,
  ): SwapSolanaState {
    const state = createSwapSolanaState({
      globalConfig: feeGlobalConfig,
      feeConfig,
      quoteMint: NATIVE_MINT,
      quoteTokenProgram: TOKEN_PROGRAM_ID,
      baseMintAccount,
      poolBaseAmount: bn(BASE_RESERVE),
      poolQuoteAmount: bn(poolQuoteAmount),
    });
    return {
      ...state,
      pool: { ...state.pool, coinCreator: PublicKey.unique(), ...pool },
    };
  }

  it("decodes the i128 with its sign and the v2 builders carry limits priced from it", async () => {
    const template = stateWith(QUOTE_VAULT, {
      protocolFees: bn(WAITING_FEES / BigInt(2)),
      creatorFees: bn(WAITING_FEES / BigInt(2)),
    });
    const account = await poolAccountWithVirtualReserves(
      template.pool,
      VIRTUAL,
    );
    const decoded = PUMP_AMM_SDK.decodePool(account);
    expect(decoded.virtualQuoteReserves.toString()).to.equal(VIRTUAL.toString());
    expect(decoded.protocolFees.add(decoded.creatorFees).toString()).to.equal(
      WAITING_FEES.toString(),
    );

    const state: SwapSolanaState = { ...template, pool: decoded };
    const base = bn(BigInt(1_000_000_000_000));

    const buy = await PUMP_AMM_SDK.buyBaseInput(state, base, 0, { v2: true });
    const { maxQuoteAmountIn } = decodePumpAmmInstruction<{
      maxQuoteAmountIn: BN;
    }>(buy, "buyV2");
    const expectedBuy = buyBaseInput({
      ...quoteArgs(VIRTUAL, { withFees: true }),
      base,
      baseMint: state.pool.baseMint,
      coinCreator: state.pool.coinCreator,
      creator: state.pool.creator,
    });
    expect(maxQuoteAmountIn.toString()).to.equal(
      expectedBuy.maxQuote.toString(),
    );

    const sell = await PUMP_AMM_SDK.sellBaseInput(state, base, 0, { v2: true });
    const { minQuoteAmountOut } = decodePumpAmmInstruction<{
      minQuoteAmountOut: BN;
    }>(sell, "sellV2");
    const expectedSell = sellBaseInput({
      ...quoteArgs(VIRTUAL, { withFees: true }),
      base,
      feeBucketsTotal: bn(WAITING_FEES),
      baseMint: state.pool.baseMint,
      coinCreator: state.pool.coinCreator,
      creator: state.pool.creator,
    });
    expect(minQuoteAmountOut.toString()).to.equal(
      expectedSell.minQuote.toString(),
    );
  });

  it("a fee sweep does not move the price the builders quote", async () => {
    const coinCreator = PublicKey.unique();
    const beforeSweep = stateWith(QUOTE_VAULT, {
      coinCreator,
      virtualQuoteReserves: bn(VIRTUAL),
      protocolFees: bn(WAITING_FEES / BigInt(3)),
      creatorFees: bn(WAITING_FEES - WAITING_FEES / BigInt(3)),
    });
    const afterSweep: SwapSolanaState = {
      ...beforeSweep,
      poolQuoteAmount: bn(EFFECTIVE),
      pool: {
        ...beforeSweep.pool,
        virtualQuoteReserves: new BN(0),
        protocolFees: new BN(0),
        creatorFees: new BN(0),
      },
    };
    const base = bn(BigInt(2_500_000_000_000));
    const quote = bn(BigInt(400_000_000));

    type Build = (state: SwapSolanaState) => ReturnType<
      typeof PUMP_AMM_SDK.buyBaseInput
    >;
    const builders: [string, Build, string, string][] = [
      [
        "buyBaseInput",
        (state) => PUMP_AMM_SDK.buyBaseInput(state, base, 1, { v2: true }),
        "buyV2",
        "maxQuoteAmountIn",
      ],
      [
        "buyQuoteInput",
        (state) => PUMP_AMM_SDK.buyQuoteInput(state, quote, 1, { v2: true }),
        "buyV2",
        "baseAmountOut",
      ],
      [
        "sellBaseInput",
        (state) => PUMP_AMM_SDK.sellBaseInput(state, base, 1, { v2: true }),
        "sellV2",
        "minQuoteAmountOut",
      ],
      [
        "sellQuoteInput",
        (state) => PUMP_AMM_SDK.sellQuoteInput(state, quote, 1, { v2: true }),
        "sellV2",
        "baseAmountIn",
      ],
    ];
    for (const [method, build, ixName, field] of builders) {
      const before = decodePumpAmmInstruction<Record<string, BN>>(
        await build(beforeSweep),
        ixName,
      );
      const after = decodePumpAmmInstruction<Record<string, BN>>(
        await build(afterSweep),
        ixName,
      );
      expect(before[field].toString(), method).to.equal(
        after[field].toString(),
      );
    }
  });

  it("multiHopSwapQuote prices a pool hop from the signed virtual reserves", () => {
    const quoteMint = NATIVE_MINT;
    const state = stateWith(QUOTE_VAULT, {
      virtualQuoteReserves: bn(VIRTUAL),
      protocolFees: bn(WAITING_FEES),
    });
    const hop: MultiHopPoolQuoteHop = {
      kind: "pool",
      poolKey: state.poolKey,
      pool: state.pool,
      baseTokenProgram: TOKEN_PROGRAM_ID,
      quoteTokenProgram: TOKEN_PROGRAM_ID,
      poolBaseAmount: bn(BASE_RESERVE),
      poolQuoteAmount: bn(QUOTE_VAULT),
      baseMintSupply: new BN(baseMintAccount.supply.toString()),
    };
    const base = bn(BigInt(1_000_000_000_000));
    const { amountOut } = multiHopSwapQuote({
      inMint: state.pool.baseMint,
      hops: [hop],
      amountIn: base,
      slippage: 0,
      globalConfig: feeGlobalConfig,
      feeConfig,
    });
    const { uiQuote } = sellBaseInput({
      ...quoteArgs(VIRTUAL, { withFees: true }),
      base,
      feeBucketsTotal: bn(WAITING_FEES),
      baseMint: state.pool.baseMint,
      coinCreator: state.pool.coinCreator,
      creator: state.pool.creator,
      quoteMint,
    });
    expect(amountOut.toString()).to.equal(uiQuote.toString());
  });
});
