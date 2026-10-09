import { expect } from "chai";
import BN from "bn.js";
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
  RawAccount,
  RawMint,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PUMP_AMM_SDK } from "../sdk/offlinePumpAmm";
import {
  coinCreatorVaultAuthorityPda,
  GLOBAL_CONFIG_PDA,
  PUMP_AMM_EVENT_AUTHORITY_PDA,
  PUMP_AMM_FEE_CONFIG_PDA,
  PUMP_AMM_PROGRAM_ID,
  userVolumeAccumulatorPda,
} from "../sdk/pda";
import { supportsTradeV2 } from "../sdk/util";
import {
  GlobalConfig,
  LiquiditySolanaState,
  Pool,
  SwapSolanaState,
} from "../types/sdk";
import {
  accountKey,
  createFeeConfigFromGlobalConfig,
  createSwapSolanaState,
  decodePumpAmmInstruction,
  idlAccounts,
  instructionDiscriminator,
  isTokenInstruction,
  CLOSE_ACCOUNT_TAG,
  SYNC_NATIVE_TAG,
} from "./utils";

const PUMP_AMM_NAMES = [
  "buy",
  "sell",
  "buyV2",
  "buyExactQuoteInV2",
  "sellV2",
  "sweepProtocolFee",
  "sweepCreatorFee",
];

function shape(instructions: TransactionInstruction[]): string[] {
  return instructions.map((instruction) => {
    if (instruction.programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID)) {
      return "createAta";
    }
    if (instruction.programId.equals(SystemProgram.programId)) {
      return "systemTransfer";
    }
    if (isTokenInstruction(instruction, SYNC_NATIVE_TAG)) return "syncNative";
    if (isTokenInstruction(instruction, CLOSE_ACCOUNT_TAG)) {
      return "closeAccount";
    }
    const name = PUMP_AMM_NAMES.find(
      (name) =>
        instruction.programId.equals(PUMP_AMM_PROGRAM_ID) &&
        instruction.data.subarray(0, 8).equals(instructionDiscriminator(name)),
    );
    return name ?? `unknown:${instruction.programId.toBase58()}`;
  });
}

function pumpAmmInstruction(
  instructions: TransactionInstruction[],
): TransactionInstruction {
  return instructions.find((ix) => ix.programId.equals(PUMP_AMM_PROGRAM_ID))!;
}

const baseMintAccount: RawMint = {
  mintAuthorityOption: 0,
  mintAuthority: PublicKey.unique(),
  supply: BigInt("1000000000000000"),
  decimals: 6,
  isInitialized: true,
  freezeAuthorityOption: 0,
  freezeAuthority: PublicKey.unique(),
};

const globalConfig: GlobalConfig = {
  admin: PublicKey.unique(),
  lpFeeBasisPoints: new BN(20),
  protocolFeeBasisPoints: new BN(5),
  disableFlags: 0,
  protocolFeeRecipients: [PublicKey.unique()],
  coinCreatorFeeBasisPoints: new BN(5),
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
const feeConfig = createFeeConfigFromGlobalConfig(globalConfig);

function swapState(
  quoteMint: PublicKey,
  quoteTokenProgram: PublicKey,
  pool: Partial<Pool> = {},
): SwapSolanaState {
  const state = createSwapSolanaState({
    globalConfig,
    feeConfig,
    quoteMint,
    quoteTokenProgram,
    baseMintAccount,
    poolBaseAmount: new BN("500000000000000"),
    poolQuoteAmount: new BN("30000000000"),
  });
  return {
    ...state,
    pool: { ...state.pool, coinCreator: PublicKey.unique(), ...pool },
  };
}

describe("v2 trade builders", () => {
  it("buy_v2 on a Token-2022 quote: the 17 IDL accounts, the buyback recipient's quote ATA, no remaining accounts", async () => {
    const state = swapState(PublicKey.unique(), TOKEN_2022_PROGRAM_ID);
    const { pool, user } = state;
    const instructions = await PUMP_AMM_SDK.buyV2Instructions(
      state,
      new BN(1_000),
      new BN(2_000),
    );

    // No extend_account (the program grows the pool) and no wrap on a non-wSOL quote.
    expect(shape(instructions)).to.deep.equal(["createAta", "buyV2"]);
    const ix = instructions[1];
    expect(ix.keys).to.have.length(idlAccounts("buyV2").length);
    expect(ix.keys).to.have.length(17);

    const quoteAta = (owner: PublicKey) =>
      getAssociatedTokenAddressSync(
        pool.quoteMint,
        owner,
        true,
        TOKEN_2022_PROGRAM_ID,
      );
    const expected: Record<string, PublicKey> = {
      pool: state.poolKey,
      user,
      globalConfig: GLOBAL_CONFIG_PDA,
      baseMint: pool.baseMint,
      quoteMint: pool.quoteMint,
      userBaseTokenAccount: state.userBaseTokenAccount,
      userQuoteTokenAccount: quoteAta(user),
      poolBaseTokenAccount: pool.poolBaseTokenAccount,
      poolQuoteTokenAccount: pool.poolQuoteTokenAccount,
      baseTokenProgram: TOKEN_PROGRAM_ID,
      quoteTokenProgram: TOKEN_2022_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      userVolumeAccumulator: userVolumeAccumulatorPda(user),
      feeConfig: PUMP_AMM_FEE_CONFIG_PDA,
      buybackFeeRecipient: quoteAta(globalConfig.buybackFeeRecipients[0]),
      eventAuthority: PUMP_AMM_EVENT_AUTHORITY_PDA,
      program: PUMP_AMM_PROGRAM_ID,
    };
    for (const [name, key] of Object.entries(expected)) {
      expect(accountKey(ix, "buyV2", name).toBase58(), name).to.equal(
        key.toBase58(),
      );
    }
    expect(ix.keys[14].isWritable).to.eq(true);
    expect(ix.keys[1]).to.include({ isSigner: true, isWritable: true });

    const args = decodePumpAmmInstruction<{
      baseAmountOut: BN;
      maxQuoteAmountIn: BN;
    }>(instructions, "buyV2");
    expect(args.baseAmountOut.toString()).to.equal("1000");
    expect(args.maxQuoteAmountIn.toString()).to.equal("2000");
  });

  it("wSOL quote: v2 buys wrap their quote budget and v2 sells unwrap, exactly as v1", async () => {
    const state = swapState(NATIVE_MINT, TOKEN_PROGRAM_ID);

    const buy = await PUMP_AMM_SDK.buyExactQuoteInV2Instructions(
      state,
      new BN(5_000),
      new BN(7),
    );
    expect(shape(buy)).to.deep.equal([
      "createAta",
      "systemTransfer",
      "syncNative",
      "createAta",
      "buyExactQuoteInV2",
      "closeAccount",
    ]);
    // The wrapped lamports are the spendable budget.
    expect(buy[1].data.readBigUInt64LE(4)).to.equal(BigInt(5_000));
    const args = decodePumpAmmInstruction<{
      spendableQuoteIn: BN;
      minBaseAmountOut: BN;
    }>(buy, "buyExactQuoteInV2");
    expect(args.spendableQuoteIn.toString()).to.equal("5000");
    expect(args.minBaseAmountOut.toString()).to.equal("7");

    const sell = await PUMP_AMM_SDK.sellV2Instructions(
      state,
      new BN(1_000),
      new BN(900),
    );
    expect(shape(sell)).to.deep.equal(["createAta", "sellV2", "closeAccount"]);
    expect(
      accountKey(sell[1], "sellV2", "buybackFeeRecipient").toBase58(),
    ).to.equal(
      getAssociatedTokenAddressSync(
        NATIVE_MINT,
        globalConfig.buybackFeeRecipients[0],
        true,
      ).toBase58(),
    );
  });
});

describe("TradeOptions.v2 routing", () => {
  const cases: [string, Partial<Pool>, boolean][] = [
    ["canonical pool", {}, true],
    ["cashback pool", { isCashbackCoin: true }, false],
    ["mayhem pool", { isMayhemMode: true }, true],
    ["permissionless pool", { creator: PublicKey.unique() }, true],
  ];

  for (const [label, pool, v2] of cases) {
    it(`${label}: ${v2 ? "v2" : "v1"} instructions with { v2: true }, v1 without`, async () => {
      const state = swapState(PublicKey.unique(), TOKEN_PROGRAM_ID, pool);
      expect(supportsTradeV2(state.pool)).to.eq(v2);
      const base = new BN(1_000_000);
      const quote = new BN(1_000_000);

      for (const [build, v1Name, v2Name] of [
        [PUMP_AMM_SDK.buyBaseInput, "buy", "buyV2"],
        [PUMP_AMM_SDK.buyQuoteInput, "buy", "buyV2"],
        [PUMP_AMM_SDK.sellBaseInput, "sell", "sellV2"],
        [PUMP_AMM_SDK.sellQuoteInput, "sell", "sellV2"],
      ] as const) {
        const amount = build === PUMP_AMM_SDK.buyQuoteInput ? quote : base;
        const routed = await build.call(PUMP_AMM_SDK, state, amount, 1, {
          v2: true,
        });
        expect(shape(routed), build.name).to.include(v2 ? v2Name : v1Name);
        const plain = await build.call(PUMP_AMM_SDK, state, amount, 1);
        expect(shape(plain), build.name).to.include(v1Name);
      }
    });
  }

  it("v2 and v1 carry the same limits", async () => {
    const state = swapState(PublicKey.unique(), TOKEN_PROGRAM_ID);
    const v1 = await PUMP_AMM_SDK.buyBaseInput(state, new BN(1_000_000), 1);
    const v2 = await PUMP_AMM_SDK.buyBaseInput(state, new BN(1_000_000), 1, {
      v2: true,
    });
    const v1Args = decodePumpAmmInstruction<{ maxQuoteAmountIn: BN }>(
      v1,
      "buy",
    );
    const v2Args = decodePumpAmmInstruction<{ maxQuoteAmountIn: BN }>(
      v2,
      "buyV2",
    );
    expect(v2Args.maxQuoteAmountIn.toString()).to.equal(
      v1Args.maxQuoteAmountIn.toString(),
    );
  });
});

describe("fee sweeps", () => {
  const payer = PublicKey.unique();

  function sweepExpectations(
    ix: TransactionInstruction,
    name: string,
    pool: Pool,
    poolKey: PublicKey,
    quoteTokenProgram: PublicKey,
    recipient: PublicKey,
  ) {
    expect(shape([ix])).to.deep.equal([name]);
    expect(ix.keys).to.have.length(idlAccounts(name).length);
    const expected: Record<string, PublicKey> = {
      payer,
      globalConfig: GLOBAL_CONFIG_PDA,
      pool: poolKey,
      quoteMint: pool.quoteMint,
      quoteTokenProgram,
      poolQuoteTokenAccount: pool.poolQuoteTokenAccount,
      recipient,
      recipientTokenAccount: getAssociatedTokenAddressSync(
        pool.quoteMint,
        recipient,
        true,
        quoteTokenProgram,
      ),
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    };
    for (const [account, key] of Object.entries(expected)) {
      expect(accountKey(ix, name, account).toBase58(), account).to.equal(
        key.toBase58(),
      );
    }
    expect(ix.keys[0]).to.include({ isSigner: true, isWritable: true });
  }

  it("sweep_creator_fee pays the coin-creator vault of pool.coinCreator", async () => {
    const { pool, poolKey } = swapState(
      PublicKey.unique(),
      TOKEN_2022_PROGRAM_ID,
    );
    const ix = await PUMP_AMM_SDK.sweepCreatorFeeInstruction({
      payer,
      poolKey,
      pool,
      quoteTokenProgram: TOKEN_2022_PROGRAM_ID,
    });
    sweepExpectations(
      ix,
      "sweepCreatorFee",
      pool,
      poolKey,
      TOKEN_2022_PROGRAM_ID,
      coinCreatorVaultAuthorityPda(pool.coinCreator),
    );
  });

  it("sweep_protocol_fee pays a protocol fee recipient, a reserved one on a mayhem pool", async () => {
    for (const [isMayhemMode, recipient] of [
      [false, globalConfig.protocolFeeRecipients[0]],
      [true, globalConfig.reservedFeeRecipient],
    ] as const) {
      const { pool, poolKey } = swapState(NATIVE_MINT, TOKEN_PROGRAM_ID, {
        isMayhemMode,
      });
      const ix = await PUMP_AMM_SDK.sweepProtocolFeeInstruction({
        payer,
        poolKey,
        pool,
        quoteTokenProgram: TOKEN_PROGRAM_ID,
        globalConfig,
      });
      sweepExpectations(
        ix,
        "sweepProtocolFee",
        pool,
        poolKey,
        TOKEN_PROGRAM_ID,
        recipient,
      );
    }
  });
});

describe("fee buckets are not liquidity", () => {
  it("PumpAmmSdk sells check the vault net of pool.protocolFees + pool.creatorFees", async () => {
    // A boosted pool whose v2 trades left 100_000 in the vault: sigma 1_000_000 less the buckets
    // is the stored virtual 900_000. Selling the whole base reserve takes 950_000 out (less a
    // ~1_900 LP fee): the vault covers it, its 900_000 of liquidity does not.
    const state = swapState(PublicKey.unique(), TOKEN_PROGRAM_ID, {
      virtualQuoteReserves: new BN(900_000),
      protocolFees: new BN(60_000),
      creatorFees: new BN(40_000),
    });
    const boosted = {
      ...state,
      poolBaseAmount: new BN(1_000_000),
      poolQuoteAmount: new BN(1_000_000),
    };

    let error: Error | undefined;
    try {
      await PUMP_AMM_SDK.sellBaseInput(boosted, new BN(1_000_000), 1);
    } catch (e) {
      error = e as Error;
    }
    expect(error?.message).to.match(/Insufficient real quote reserves/);

    const swept = {
      ...boosted,
      pool: {
        ...boosted.pool,
        protocolFees: new BN(0),
        creatorFees: new BN(0),
        virtualQuoteReserves: new BN(1_000_000),
      },
    };
    expect(
      shape(await PUMP_AMM_SDK.sellBaseInput(swept, new BN(500_000), 1)),
    ).to.include("sell");
  });

  it("deposit and withdraw amounts use the vault net of the buckets", async () => {
    const { pool } = swapState(PublicKey.unique(), TOKEN_PROGRAM_ID, {
      lpSupply: new BN(1_000),
      protocolFees: new BN(60),
      creatorFees: new BN(40),
    });
    const tokenAccount = (amount: number) =>
      ({ amount: BigInt(amount) }) as RawAccount;
    // 2_100 in the vault, 100 of it fees: 2_000 of quote liquidity against 1_000 base.
    const state = {
      pool,
      poolBaseTokenAccount: tokenAccount(1_000),
      poolQuoteTokenAccount: tokenAccount(2_100),
    } as LiquiditySolanaState;

    const withdrawn = PUMP_AMM_SDK.withdrawInputs(state, new BN(500), 0);
    expect(withdrawn.base.toString()).to.equal("500");
    expect(withdrawn.quote.toString()).to.equal("1000");

    const deposit = PUMP_AMM_SDK.depositBaseInput(state, new BN(100), 0);
    expect(deposit.quote.toString()).to.equal("200");
    expect(deposit.lpToken.toString()).to.equal("100");
    const byQuote = PUMP_AMM_SDK.depositQuoteInput(state, new BN(200), 0);
    expect(byQuote.base.toString()).to.equal("100");
    expect(byQuote.lpToken.toString()).to.equal("100");
  });
});
