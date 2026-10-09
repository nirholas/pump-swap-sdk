import { expect } from "chai";
import BN from "bn.js";
import {
  Connection,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { EventParser } from "@coral-xyz/anchor";
import { buyQuoteInput } from "../sdk/buy";
import { OnlinePumpAmmSdk } from "../sdk/onlinePumpAmm";
import {
  OFFLINE_PUMP_AMM_PROGRAM,
  PUMP_AMM_SDK,
} from "../sdk/offlinePumpAmm";
import {
  poolPda,
  pumpPoolAuthorityPda,
  PUMP_AMM_PROGRAM_ID,
} from "../sdk/pda";

// USDC-quote pools are used to avoid the SOL-only buyback fee path,
// so the SDK's predicted base out should match the on-chain BuyEvent exactly
// when slippage is 0. The pure `buyQuoteInput` call passes exactly what the
// `PumpAmmSdk` wrapper passes (`quoteMint`, `isMayhemMode`,
// `virtualQuoteReserves` from the decoded pool), so a USDC pool is priced on
// the stable schedule here, as on-chain.
describe("buyQuoteInput matches on-chain simulation (USDC quote)", () => {
  const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  const sdk = new OnlinePumpAmmSdk(connection);

  // USDC mainnet mint (used as quote on localnet via cloned account).
  const USDC_MINT = new PublicKey(
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  );

  const baseMint = new PublicKey("8XrqT9yLg3Bef1epT1a1J9VqoNN7GKXmy3Wxc1u4pump");
  const poolIndex = 0;

  const user = new PublicKey("4kBH5H5p9oRkZPGLSx8R4WKoDsmXnEpmzsgkebkKvzSg");

  // 9 USDC (6 decimals)
  const quote = new BN(9_000_000);
  const slippage = 0;

  // The migrated pump-amm pool's `creator` is the pump pool-authority PDA,
  // not the bonding curve's `creator`. The clone script re-keys patched
  // USDC fixtures under poolPda(0, pool_authority(mint), mint, USDC).
  const poolCreator = pumpPoolAuthorityPda(baseMint);
  const poolKey = poolPda(poolIndex, poolCreator, baseMint, USDC_MINT);

  it("predicted base equals BuyEvent.base_amount_out from simulation", async () => {

    const swapState = await sdk.swapSolanaState(poolKey, user);
    const {
      pool,
      baseMintAccount,
      feeConfig,
      globalConfig,
      poolBaseAmount,
      poolQuoteAmount,
    } = swapState;

    console.log("── inputs ──");
    console.log("  poolKey       ", poolKey.toBase58());
    console.log("  baseMint      ", baseMint.toBase58());
    console.log("  quoteMint     ", USDC_MINT.toBase58());
    console.log("  user          ", user.toBase58());
    console.log("  poolBaseAmount", poolBaseAmount.toString());
    console.log("  poolQuoteAmount", poolQuoteAmount.toString());
    console.log("  coinCreator   ", pool.coinCreator.toBase58());
    console.log("  creator       ", pool.creator.toBase58());
    console.log("  quote         ", quote.toString());
    console.log("  slippage      ", slippage);

    const { base, maxQuote, internalQuoteWithoutFees } = buyQuoteInput({
      quote,
      slippage,
      baseReserve: poolBaseAmount,
      quoteReserve: poolQuoteAmount,
      virtualQuoteReserves: pool.virtualQuoteReserves,
      globalConfig,
      baseMintAccount,
      baseMint,
      coinCreator: pool.coinCreator,
      creator: pool.creator,
      feeConfig,
      quoteMint: pool.quoteMint,
      isMayhemMode: pool.isMayhemMode,
    });

    console.log("── buyQuoteInput (SDK) ──");
    console.log("  base                    ", base.toString());
    console.log("  maxQuote                ", maxQuote.toString());
    console.log("  internalQuoteWithoutFees", internalQuoteWithoutFees.toString());

    const instructions = await PUMP_AMM_SDK.buyInstructions(
      swapState,
      base,
      maxQuote,
    );

    const tx = new VersionedTransaction(
      new TransactionMessage({
        payerKey: user,
        recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
        instructions,
      }).compileToV0Message(),
    );

    const sim = await connection.simulateTransaction(tx, {
      sigVerify: false,
      replaceRecentBlockhash: true,
    });

    expect(sim.value.err, JSON.stringify(sim.value.logs)).to.equal(null);
    expect(sim.value.logs).to.not.be.null;

    const eventParser = new EventParser(
      PUMP_AMM_PROGRAM_ID,
      OFFLINE_PUMP_AMM_PROGRAM.coder,
    );

    const events = [...eventParser.parseLogs(sim.value.logs!)];
    const buyEvent = events.find((e) => e.name === "buyEvent");
    expect(buyEvent, "BuyEvent not emitted").to.exist;

    const d = buyEvent!.data;
    console.log("── BuyEvent (on-chain) ──");
    console.log("  baseAmountOut          ", d.baseAmountOut.toString());
    console.log("  quoteAmountIn          ", d.quoteAmountIn.toString());
    console.log("  userQuoteAmountIn      ", d.userQuoteAmountIn.toString());
    console.log("  quoteAmountInWithLpFee ", d.quoteAmountInWithLpFee.toString());
    console.log("  lpFee                  ", d.lpFee.toString());
    console.log("  protocolFee            ", d.protocolFee.toString());
    console.log("  coinCreatorFee         ", d.coinCreatorFee.toString());
    console.log("  buybackFee             ", d.buybackFee.toString());
    console.log("  cashback               ", d.cashback.toString());

    expect(d.baseAmountOut.toString()).to.equal(base.toString());
    // With slippage=0 the user cannot pay more than `quote`.
    expect(
      new BN(d.userQuoteAmountIn.toString()).lte(quote),
      `user_quote_amount_in (${d.userQuoteAmountIn}) > quote (${quote})`,
    ).to.equal(true);
  });

  // Same setup, but call buy_exact_quote_in directly with
  // (spendable_quote_in = quote, min_base_amount_out = SDK-predicted base).
  // buy_exact_quote_in shares the buy IX's account list, so we reuse the
  // keys from PUMP_AMM_SDK.buyInstructions and only swap the data.
  it("buy_exact_quote_in yields >= SDK-predicted base", async () => {
    const swapState = await sdk.swapSolanaState(poolKey, user);
    const {
      pool,
      baseMintAccount,
      feeConfig,
      globalConfig,
      poolBaseAmount,
      poolQuoteAmount,
    } = swapState;

    const { base, maxQuote, internalQuoteWithoutFees } = buyQuoteInput({
      quote,
      slippage,
      baseReserve: poolBaseAmount,
      quoteReserve: poolQuoteAmount,
      virtualQuoteReserves: pool.virtualQuoteReserves,
      globalConfig,
      baseMintAccount,
      baseMint,
      coinCreator: pool.coinCreator,
      creator: pool.creator,
      feeConfig,
      quoteMint: pool.quoteMint,
      isMayhemMode: pool.isMayhemMode,
    });

    const instructions = await PUMP_AMM_SDK.buyInstructions(
      swapState,
      base,
      maxQuote,
    );

    // The buy IX is the only PUMP_AMM ix whose data > 8 bytes (extend_account
    // is just the discriminator). Replace its data with buy_exact_quote_in.
    const buyIxIdx = instructions.findIndex(
      (ix) =>
        ix.programId.equals(PUMP_AMM_PROGRAM_ID) && ix.data.length > 8,
    );
    expect(buyIxIdx, "buy ix not found in bundle").to.be.gte(0);

    const newData = OFFLINE_PUMP_AMM_PROGRAM.coder.instruction.encode(
      "buyExactQuoteIn",
      {
        spendableQuoteIn: quote,
        minBaseAmountOut: base,
        trackVolume: { 0: true },
      },
    );

    instructions[buyIxIdx] = new TransactionInstruction({
      programId: instructions[buyIxIdx].programId,
      keys: instructions[buyIxIdx].keys,
      data: newData,
    });

    const tx = new VersionedTransaction(
      new TransactionMessage({
        payerKey: user,
        recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
        instructions,
      }).compileToV0Message(),
    );

    const sim = await connection.simulateTransaction(tx, {
      sigVerify: false,
      replaceRecentBlockhash: true,
    });

    expect(sim.value.err, JSON.stringify(sim.value.logs)).to.equal(null);

    const events = [
      ...new EventParser(
        PUMP_AMM_PROGRAM_ID,
        OFFLINE_PUMP_AMM_PROGRAM.coder,
      ).parseLogs(sim.value.logs!),
    ];
    const buyEvent = events.find((e) => e.name === "buyEvent");
    expect(buyEvent, "BuyEvent not emitted").to.exist;

    const d = buyEvent!.data;
    console.log("── buy_exact_quote_in BuyEvent (on-chain) ──");
    console.log("  baseAmountOut    ", d.baseAmountOut.toString());
    console.log("  userQuoteAmountIn", d.userQuoteAmountIn.toString());
    console.log("  ixName           ", d.ixName);

    // SDK's buyQuoteInput is the inverse of buy_exact_quote_in: the chain
    // emits `userQuoteAmountIn` = the post-fee curve input the contract
    // routes through the AMM, which matches the SDK's `internalQuoteWithoutFees`.
    expect(d.userQuoteAmountIn.toString()).to.equal(
      internalQuoteWithoutFees.toString(),
    );
    expect(d.baseAmountOut.toString()).to.equal(base.toString());
  });
});
