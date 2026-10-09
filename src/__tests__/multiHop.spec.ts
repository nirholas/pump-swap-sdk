import { expect } from "chai";
import BN from "bn.js";
import {
  AccountInfo,
  Keypair,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  ACCOUNT_SIZE,
  AccountLayout,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  MINT_SIZE,
  MintLayout,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { OFFLINE_PUMP_AMM_PROGRAM, PUMP_AMM_SDK } from "../sdk/offlinePumpAmm";
import { OnlinePumpAmmSdk } from "../sdk/onlinePumpAmm";
import {
  MultiHopCurveQuoteHop,
  MultiHopLegFees,
  MultiHopPoolQuoteHop,
  multiHopLegFees,
  multiHopSwapQuote,
  resolveMultiHopRoute,
} from "../sdk/multiHop";
import {
  bondingCurvePda,
  GLOBAL_CONFIG_PDA,
  lpMintPda,
  poolPda,
  PUMP_AMM_FEE_CONFIG_PDA,
  PUMP_AMM_PROGRAM_ID,
  PUMP_EVENT_AUTHORITY_PDA,
  PUMP_FEE_CONFIG_PDA,
  PUMP_GLOBAL_PDA,
  PUMP_PROGRAM_ID,
  pumpPoolAuthorityPda,
  userVolumeAccumulatorPda,
} from "../sdk/pda";
import { sellBaseInput } from "../sdk/sell";
import { GlobalConfig, Pool } from "../types/sdk";
import {
  accountKey,
  createFeeConfigFromGlobalConfig,
  decodePumpAmmInstruction,
  idlAccounts,
  instructionDiscriminator,
  stubConnection,
} from "./utils";

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
const RESERVE = new BN(1_000_000_000);

/** A canonical pool of `baseMint` quoted in `quoteMint`, with 1e9 / 1e9 reserves. */
function poolHop(
  baseMint: PublicKey,
  quoteMint: PublicKey,
  overrides: Partial<Pool> = {},
): MultiHopPoolQuoteHop {
  const creator = pumpPoolAuthorityPda(baseMint);
  const poolKey = poolPda(0, creator, baseMint, quoteMint);
  return {
    kind: "pool",
    poolKey,
    baseTokenProgram: TOKEN_2022_PROGRAM_ID,
    quoteTokenProgram: TOKEN_PROGRAM_ID,
    poolBaseAmount: RESERVE,
    poolQuoteAmount: RESERVE,
    baseMintSupply: new BN("1000000000000000"),
    pool: {
      poolBump: 255,
      index: 0,
      creator,
      baseMint,
      quoteMint,
      lpMint: lpMintPda(poolKey),
      poolBaseTokenAccount: PublicKey.unique(),
      poolQuoteTokenAccount: PublicKey.unique(),
      lpSupply: new BN(0),
      coinCreator: PublicKey.unique(),
      isMayhemMode: false,
      isCashbackCoin: false,
      virtualQuoteReserves: new BN(0),
      creatorFeeBps: new BN(0),
      canEditCreatorFee: false,
      isHolderReward: false,
      protocolFees: new BN(0),
      creatorFees: new BN(0),
      ...overrides,
    },
  };
}

function curveHop(
  baseMint: PublicKey,
  quoteMint: PublicKey,
  quote: MultiHopCurveQuoteHop["quote"] = (amountIn) => amountIn,
): MultiHopCurveQuoteHop {
  return {
    kind: "curve",
    baseMint,
    quoteMint,
    baseTokenProgram: TOKEN_2022_PROGRAM_ID,
    quoteTokenProgram: TOKEN_2022_PROGRAM_ID,
    quote,
  };
}

const [A, B, C, D] = [0, 1, 2, 3].map(() => PublicKey.unique());
const user = Keypair.generate().publicKey;

function pumpAmmInstruction(
  instructions: TransactionInstruction[],
): TransactionInstruction {
  return instructions.find((ix) => ix.programId.equals(PUMP_AMM_PROGRAM_ID))!;
}

describe("resolveMultiHopRoute", () => {
  it("walks the mint chain and places the fee legs by direction", () => {
    const buy = resolveMultiHopRoute(A, [poolHop(B, A), poolHop(C, B)]);
    expect(buy.isBuy).to.eq(true);
    expect(buy.mints.map((m) => m.toBase58())).to.deep.equal(
      [A, B, C].map((m) => m.toBase58()),
    );
    const sell = resolveMultiHopRoute(C, [poolHop(C, B), poolHop(B, A)]);
    expect(sell.isBuy).to.eq(false);
    expect(sell.mints[2].equals(A)).to.eq(true);

    expect(multiHopLegFees(true, 0, 3)).to.deep.equal({
      protocol: true,
      creator: false,
      lp: false,
    });
    expect(multiHopLegFees(true, 1, 3)).to.deep.equal({
      protocol: false,
      creator: false,
      lp: false,
    });
    expect(multiHopLegFees(false, 0, 3)).to.deep.equal({
      protocol: false,
      creator: true,
      lp: true,
    });
    expect(multiHopLegFees(false, 0, 1)).to.deep.equal({
      protocol: true,
      creator: true,
      lp: true,
    });
  });

  it("refuses what multi_hop_swap refuses", () => {
    expect(() => resolveMultiHopRoute(A, [])).to.throw(/at least one hop/);
    expect(() => resolveMultiHopRoute(A, [poolHop(C, B)])).to.throw(
      /running mint/,
    );
    // A -> B is a buy, B -> A back down is a sell.
    expect(() =>
      resolveMultiHopRoute(A, [poolHop(B, A), poolHop(B, A)]),
    ).to.throw(/same direction/);
    expect(() =>
      resolveMultiHopRoute(A, [poolHop(B, A, { isMayhemMode: true })]),
    ).to.throw(/mayhem/);
    expect(() =>
      resolveMultiHopRoute(A, [poolHop(B, A, { creator: PublicKey.unique() })]),
    ).to.throw(/canonical/);
    // A cashback pool may only be a leg that charges no creator fee.
    const cashback = poolHop(B, A, { isCashbackCoin: true });
    expect(() => resolveMultiHopRoute(A, [cashback])).to.throw(/cashback/);
    resolveMultiHopRoute(A, [cashback, poolHop(C, B)]);
  });
});

describe("multiHopSwapInstructions", () => {
  it("buy route pool -> curve: fixed accounts, hop groups, protocol-leg buyback ATA, output ATA", async () => {
    const venues = [poolHop(B, A), curveHop(C, B)];
    const instructions = await PUMP_AMM_SDK.multiHopSwapInstructions({
      user,
      inMint: A,
      venues,
      amountIn: new BN(1_000),
      minAmountOut: new BN(7),
      globalConfig,
    });

    // The out ATA (C under Token-2022) is created; A is not wSOL, so nothing is wrapped.
    expect(instructions).to.have.length(2);
    expect(instructions[0].programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID)).to.eq(
      true,
    );
    const ix = pumpAmmInstruction(instructions);
    expect(ix.data.subarray(0, 8)).to.deep.equal(
      instructionDiscriminator("multiHopSwap"),
    );
    const args = decodePumpAmmInstruction<{
      amountIn: BN;
      minAmountOut: BN;
    }>(instructions, "multiHopSwap");
    expect([args.amountIn.toString(), args.minAmountOut.toString()]).to.deep.eq(
      ["1000", "7"],
    );

    const fixed = idlAccounts("multiHopSwap").length;
    expect(fixed).to.equal(16);
    const ata = (mint: PublicKey, owner: PublicKey, program: PublicKey) =>
      getAssociatedTokenAddressSync(mint, owner, true, program);
    const expected: Record<string, PublicKey> = {
      user,
      userInTokenAccount: ata(A, user, TOKEN_PROGRAM_ID),
      userOutTokenAccount: ata(C, user, TOKEN_2022_PROGRAM_ID),
      globalConfig: GLOBAL_CONFIG_PDA,
      feeConfig: PUMP_AMM_FEE_CONFIG_PDA,
      userVolumeAccumulator: userVolumeAccumulatorPda(user),
      // The protocol leg is the first hop (a pool quoted in A).
      buybackFeeRecipient: ata(
        A,
        globalConfig.buybackFeeRecipients[0],
        TOKEN_PROGRAM_ID,
      ),
      pumpProgram: PUMP_PROGRAM_ID,
      pumpGlobal: PUMP_GLOBAL_PDA,
      pumpFeeConfig: PUMP_FEE_CONFIG_PDA,
      pumpEventAuthority: PUMP_EVENT_AUTHORITY_PDA,
    };
    for (const [name, key] of Object.entries(expected)) {
      expect(accountKey(ix, "multiHopSwap", name).toBase58(), name).to.equal(
        key.toBase58(),
      );
    }

    const curve = bondingCurvePda(C);
    const pool = venues[0] as MultiHopPoolQuoteHop;
    const groups = ix.keys.slice(fixed);
    expect(groups.map((k) => k.pubkey.toBase58())).to.deep.equal(
      [
        B,
        A,
        pool.poolKey,
        pool.pool.poolBaseTokenAccount,
        pool.pool.poolQuoteTokenAccount,
        C,
        B,
        curve,
        ata(C, curve, TOKEN_2022_PROGRAM_ID),
        ata(B, curve, TOKEN_2022_PROGRAM_ID),
      ].map((k) => k.toBase58()),
    );
    expect(groups.map((k) => k.isWritable)).to.deep.equal([
      false,
      false,
      true,
      true,
      true,
      false,
      false,
      true,
      true,
      true,
    ]);
  });

  it("a curve protocol leg needs the buyback recipient from pump's Global", async () => {
    const sell = {
      user,
      inMint: C,
      venues: [poolHop(C, B), curveHop(B, A)],
      amountIn: new BN(1_000),
      minAmountOut: new BN(1),
      globalConfig,
    };
    let error: Error | undefined;
    await PUMP_AMM_SDK.multiHopSwapInstructions(sell).catch((e) => (error = e));
    expect(error?.message).to.match(/buybackFeeRecipient/);

    // A wallet: the builder passes its ATA for the protocol leg's quote (A, under the curve's
    // Token-2022 quote program).
    const recipient = Keypair.generate().publicKey;
    const ix = pumpAmmInstruction(
      await PUMP_AMM_SDK.multiHopSwapInstructions({
        ...sell,
        buybackFeeRecipient: recipient,
      }),
    );
    expect(
      accountKey(ix, "multiHopSwap", "buybackFeeRecipient").toBase58(),
    ).to.equal(
      getAssociatedTokenAddressSync(
        A,
        recipient,
        true,
        TOKEN_2022_PROGRAM_ID,
      ).toBase58(),
    );
  });

  it("wraps a legacy-WSOL input and closes it afterwards", async () => {
    const instructions = await PUMP_AMM_SDK.multiHopSwapInstructions({
      user,
      inMint: NATIVE_MINT,
      venues: [poolHop(B, NATIVE_MINT)],
      amountIn: new BN(5_000),
      minAmountOut: new BN(1),
      globalConfig,
    });
    // wSOL ATA create, transfer, sync, out ATA create, swap, close.
    expect(instructions).to.have.length(6);
    expect(instructions[1].data.readBigUInt64LE(4)).to.equal(BigInt(5_000));
    expect(instructions[5].programId.equals(TOKEN_PROGRAM_ID)).to.eq(true);
  });
});

describe("multiHopSwapQuote", () => {
  // Reference constant-product buy of an exact (net) quote input: pump-amm buy_exact_quote_in.
  const cpBuy = (net: bigint, base: bigint, quote: bigint) =>
    ((net - BigInt(1)) * base) / (quote + net - BigInt(1));

  it("a single-hop sell pays exactly what sellBaseInput quotes (every fee charged)", () => {
    const hop = poolHop(B, A);
    const { amountOut } = multiHopSwapQuote({
      inMint: B,
      hops: [hop],
      amountIn: new BN(1_000_000),
      slippage: 0,
      globalConfig,
      feeConfig,
    });
    const { uiQuote } = sellBaseInput({
      base: new BN(1_000_000),
      slippage: 0,
      baseReserve: hop.poolBaseAmount,
      quoteReserve: hop.poolQuoteAmount,
      globalConfig,
      feeConfig,
      baseMintAccount: {
        supply: BigInt(hop.baseMintSupply.toString()),
      } as never,
      baseMint: B,
      coinCreator: hop.pool.coinCreator,
      creator: hop.pool.creator,
      quoteMint: A,
    });
    expect(amountOut.toString()).to.equal(uiQuote.toString());
  });

  it("a buy route charges the protocol fee on the first hop, nothing in the middle, LP and creator on the last", () => {
    const amountIn = BigInt(1_000_000);
    const curveCalls: { isBuy: boolean; legs: MultiHopLegFees }[] = [];
    const { hopAmountsOut, amountOut, minAmountOut } = multiHopSwapQuote({
      inMint: A,
      hops: [
        poolHop(B, A),
        poolHop(C, B),
        curveHop(D, C, (amount, hop) => {
          curveCalls.push(hop);
          return amount.divn(2);
        }),
      ],
      amountIn: new BN(amountIn.toString()),
      slippage: 1,
      globalConfig,
      feeConfig,
    });

    // Hop 0, protocol only (5 bps): net = floor(1e6 * 1e4 / 10005) = 999500, fee ceil(499.75) =
    // 500; the whole budget less the fee enters the reserves.
    const r = BigInt(RESERVE.toString());
    const hop0 = cpBuy(amountIn - BigInt(500), r, r);
    expect(hopAmountsOut[0].toString()).to.equal(hop0.toString());
    // Hop 1 charges nothing: a pure constant-product buy.
    expect(hopAmountsOut[1].toString()).to.equal(cpBuy(hop0, r, r).toString());
    // The curve hop is the far leg of a buy: creator, no protocol, and never an LP fee.
    expect(curveCalls).to.deep.equal([
      { isBuy: true, legs: { protocol: false, creator: true, lp: false } },
    ]);
    expect(amountOut.toString()).to.equal(hopAmountsOut[1].divn(2).toString());
    expect(minAmountOut.toString()).to.equal(
      amountOut.muln(99).divn(100).toString(),
    );
  });

  it("sells are capped by the vault net of the fee buckets", () => {
    const hop = poolHop(B, A, {
      virtualQuoteReserves: new BN(900_000_000),
      protocolFees: new BN(600_000_000),
      creatorFees: new BN(400_000_000),
    });
    expect(() =>
      multiHopSwapQuote({
        inMint: B,
        hops: [hop],
        amountIn: new BN(500_000_000),
        slippage: 0,
        globalConfig,
        feeConfig,
      }),
    ).to.throw(/Insufficient real quote reserves/);
  });
});

describe("multi-hop review regressions", () => {
  const r = BigInt(RESERVE.toString());

  it("a buy hop keeps the fees computed before the rounding shave, as the program does", () => {
    // 1_000_000_029 at 30 bps lands on the shave path: the program spends amountIn less the
    // pre-shave fees and pays 499251129; recomputing the fees after the shave over-quotes by 1.
    const amountIn = BigInt(1_000_000_029);
    const { amountOut } = multiHopSwapQuote({
      inMint: A,
      hops: [poolHop(B, A)],
      amountIn: new BN(amountIn.toString()),
      slippage: 0,
      globalConfig,
      feeConfig,
    });
    const ceil = (n: bigint, bps: bigint) =>
      (n * bps + BigInt(9_999)) / BigInt(10_000);
    const net = (amountIn * BigInt(10_000)) / BigInt(10_030);
    const fees = ceil(net, BigInt(20)) + ceil(net, BigInt(5)) * BigInt(2);
    const input = amountIn - fees - BigInt(1);
    expect(amountOut.toString()).to.equal(
      ((input * r) / (r + input)).toString(),
    );
    expect(amountOut.toString()).to.equal("499251129");
  });

  it("creates an explicitly passed output ATA and never an ATA-create aimed at a custom account", async () => {
    const outAta = getAssociatedTokenAddressSync(
      B,
      user,
      true,
      TOKEN_2022_PROGRAM_ID,
    );
    const explicit = await PUMP_AMM_SDK.multiHopSwapInstructions({
      user,
      inMint: A,
      venues: [poolHop(B, A)],
      amountIn: new BN(1_000),
      minAmountOut: new BN(1),
      globalConfig,
      userOutTokenAccount: outAta,
    });
    expect(explicit[0].programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID)).to.eq(
      true,
    );
    expect(explicit[0].keys[1].pubkey.equals(outAta)).to.eq(true);

    // A custom wSOL input (a keypair account) is funded and closed, never "created".
    const customIn = PublicKey.unique();
    const wsol = await PUMP_AMM_SDK.multiHopSwapInstructions({
      user,
      inMint: NATIVE_MINT,
      venues: [poolHop(B, NATIVE_MINT)],
      amountIn: new BN(5_000),
      minAmountOut: new BN(1),
      globalConfig,
      userInTokenAccount: customIn,
    });
    const creates = wsol.filter((ix) =>
      ix.programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID),
    );
    expect(creates).to.have.length(1);
    expect(creates[0].keys[1].pubkey.equals(customIn)).to.eq(false);
  });

  it("routes SOL bonding curves, and refuses routes past the programs' heap", () => {
    for (const sol of [NATIVE_MINT, PublicKey.default]) {
      const sell = resolveMultiHopRoute(C, [poolHop(C, B), curveHop(B, sol)]);
      // The zero key a SOL curve stores routes as the native mint.
      expect(sell.mints[2].equals(NATIVE_MINT)).to.eq(true);
      resolveMultiHopRoute(sol, [curveHop(B, sol), poolHop(C, B)]);
    }

    const mints = [0, 1, 2, 3, 4, 5, 6, 7].map(() => PublicKey.unique());
    const route = (kinds: string) =>
      [...kinds].map((kind, i) =>
        kind === "p"
          ? poolHop(mints[i + 1], mints[i])
          : curveHop(mints[i + 1], mints[i]),
      );
    resolveMultiHopRoute(mints[0], route("pppccc"));
    resolveMultiHopRoute(mints[0], route("ppppp"));
    expect(() => resolveMultiHopRoute(mints[0], route("ppppcc"))).to.throw(
      /heap/,
    );
    expect(() => resolveMultiHopRoute(mints[0], route("pcccccc"))).to.throw(
      /heap/,
    );
  });

  it("OnlinePumpAmmSdk.multiHopPoolHops reads a route in two round trips", async () => {
    const hops = [poolHop(B, A), poolHop(C, B)];
    const accounts = new Map<string, AccountInfo<Buffer>>();
    const put = (key: PublicKey, data: Buffer, owner: PublicKey) =>
      accounts.set(key.toBase58(), {
        data,
        owner,
        lamports: 1,
        executable: false,
      });
    put(
      GLOBAL_CONFIG_PDA,
      await OFFLINE_PUMP_AMM_PROGRAM.coder.accounts.encode(
        "globalConfig",
        globalConfig,
      ),
      PUMP_AMM_PROGRAM_ID,
    );
    const tokenAccount = (mint: PublicKey, amount: number) => {
      const data = Buffer.alloc(ACCOUNT_SIZE);
      AccountLayout.encode(
        {
          mint,
          owner: PublicKey.unique(),
          amount: BigInt(amount),
          delegateOption: 0,
          delegate: PublicKey.default,
          state: 1,
          isNativeOption: 0,
          isNative: BigInt(0),
          delegatedAmount: BigInt(0),
          closeAuthorityOption: 0,
          closeAuthority: PublicKey.default,
        },
        data,
      );
      return data;
    };
    const mint = (supply: number) => {
      const data = Buffer.alloc(MINT_SIZE);
      MintLayout.encode(
        {
          mintAuthorityOption: 0,
          mintAuthority: PublicKey.default,
          supply: BigInt(supply),
          decimals: 6,
          isInitialized: true,
          freezeAuthorityOption: 0,
          freezeAuthority: PublicKey.default,
        },
        data,
      );
      return data;
    };
    for (const [i, { poolKey, pool }] of hops.entries()) {
      put(
        poolKey,
        await OFFLINE_PUMP_AMM_PROGRAM.coder.accounts.encode("pool", pool),
        PUMP_AMM_PROGRAM_ID,
      );
      put(pool.baseMint, mint(1_000 + i), TOKEN_PROGRAM_ID);
      put(pool.quoteMint, mint(1_000), TOKEN_PROGRAM_ID);
      put(
        pool.poolBaseTokenAccount,
        tokenAccount(pool.baseMint, 10 + i),
        TOKEN_PROGRAM_ID,
      );
      put(
        pool.poolQuoteTokenAccount,
        tokenAccount(pool.quoteMint, 20 + i),
        TOKEN_PROGRAM_ID,
      );
    }

    const batches: number[] = [];
    const online = new OnlinePumpAmmSdk(stubConnection(accounts, [], batches));
    const route = await online.multiHopPoolHops(hops.map((hop) => hop.poolKey));

    // Config + fee config + 2 pools, then B is shared: 3 mints + 4 vaults.
    expect(batches).to.deep.equal([4, 7]);
    expect(route.feeConfig).to.eq(null);
    expect(
      route.globalConfig.buybackFeeRecipients[0].equals(
        globalConfig.buybackFeeRecipients[0],
      ),
    ).to.eq(true);
    expect(
      route.hops.map((hop) => [
        hop.poolKey.toBase58(),
        hop.poolBaseAmount.toString(),
        hop.poolQuoteAmount.toString(),
        hop.baseMintSupply.toString(),
        hop.quoteTokenProgram.toBase58(),
      ]),
    ).to.deep.equal(
      hops.map((hop, i) => [
        hop.poolKey.toBase58(),
        `${10 + i}`,
        `${20 + i}`,
        `${1_000 + i}`,
        TOKEN_PROGRAM_ID.toBase58(),
      ]),
    );
  });
});

describe("SOL bonding curves in multi_hop_swap", () => {
  const wallet = Keypair.generate().publicKey;
  const wsolAta = (owner: PublicKey) =>
    getAssociatedTokenAddressSync(NATIVE_MINT, owner, true, TOKEN_PROGRAM_ID);

  for (const sol of [PublicKey.default, NATIVE_MINT]) {
    const label = sol.equals(NATIVE_MINT) ? "WSOL" : "zero-key";

    it(`buy starting on a ${label} SOL curve: the WSOL ATA is created but never funded; native mint, curve WSOL ATA and the recipient's WSOL ATA in the accounts`, async () => {
      const instructions = await PUMP_AMM_SDK.multiHopSwapInstructions({
        user,
        inMint: sol,
        venues: [curveHop(B, sol), poolHop(C, B)],
        amountIn: new BN(5_000),
        minAmountOut: new BN(1),
        globalConfig,
        buybackFeeRecipient: wallet,
      });
      // createAta(user WSOL), createAta(out), swap, close(user WSOL): no transfer, no sync.
      expect(
        instructions.map((ix) =>
          ix.programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID)
            ? "createAta"
            : ix.programId.equals(PUMP_AMM_PROGRAM_ID)
              ? "swap"
              : ix.programId.equals(TOKEN_PROGRAM_ID)
                ? "token"
                : ix.programId.toBase58(),
        ),
      ).to.deep.equal(["createAta", "createAta", "swap", "token"]);
      expect(instructions[0].keys[1].pubkey.equals(wsolAta(user))).to.eq(true);

      const ix = pumpAmmInstruction(instructions);
      expect(accountKey(ix, "multiHopSwap", "userInTokenAccount")).to.deep.eq(
        wsolAta(user),
      );
      expect(accountKey(ix, "multiHopSwap", "buybackFeeRecipient")).to.deep.eq(
        wsolAta(wallet),
      );
      const group = ix.keys.slice(
        idlAccounts("multiHopSwap").length,
        idlAccounts("multiHopSwap").length + 5,
      );
      const curve = bondingCurvePda(B);
      expect(group.map((k) => k.pubkey.toBase58())).to.deep.equal(
        [
          B,
          NATIVE_MINT,
          curve,
          getAssociatedTokenAddressSync(B, curve, true, TOKEN_2022_PROGRAM_ID),
          wsolAta(curve),
        ].map((k) => k.toBase58()),
      );
    });

    it(`sell ending on a ${label} SOL curve: proceeds land in the user's WSOL ATA, created and closed to unwrap`, async () => {
      const instructions = await PUMP_AMM_SDK.multiHopSwapInstructions({
        user,
        inMint: C,
        venues: [poolHop(C, B), curveHop(B, sol)],
        amountIn: new BN(5_000),
        minAmountOut: new BN(1),
        globalConfig,
        buybackFeeRecipient: wallet,
      });
      expect(instructions).to.have.length(3);
      expect(instructions[0].keys[1].pubkey.equals(wsolAta(user))).to.eq(true);
      const ix = pumpAmmInstruction(instructions);
      expect(accountKey(ix, "multiHopSwap", "userOutTokenAccount")).to.deep.eq(
        wsolAta(user),
      );
      expect(accountKey(ix, "multiHopSwap", "buybackFeeRecipient")).to.deep.eq(
        wsolAta(wallet),
      );
      // The close unwraps the WSOL output.
      expect(instructions[2].programId.equals(TOKEN_PROGRAM_ID)).to.eq(true);
      expect(instructions[2].keys[0].pubkey.equals(wsolAta(user))).to.eq(true);
    });
  }
});
