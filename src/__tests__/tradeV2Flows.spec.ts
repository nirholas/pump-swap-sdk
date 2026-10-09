import { expect } from "chai";
import BN from "bn.js";
import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  RawMint,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PUMP_AMM_SDK } from "../sdk/offlinePumpAmm";
import {
  coinCreatorVaultAtaPda,
  coinCreatorVaultAuthorityPda,
  PUMP_AMM_PROGRAM_ID,
} from "../sdk/pda";
import { buyQuoteInput } from "../sdk/buy";
import {
  CollectCoinCreatorFeeSolanaState,
  GlobalConfig,
  SwapSolanaState,
} from "../types/sdk";
import {
  accountKey,
  createFeeConfigFromGlobalConfig,
  createSwapSolanaState,
  decodePumpAmmInstruction,
  idlAccounts,
  instructionDiscriminator,
} from "./utils";

// The October 2026 PumpSwap upgrade: buy_v2, buy_exact_quote_in_v2 and sell_v2 take one shared
// 17-account list with no remaining accounts, keep the protocol and creator fee in the pool, and
// sweep_creator_fee pays the creator fee into the vault collect_coin_creator_fee drains.
// See pump-public-docs docs/instructions/PUMP_SWAP_TRADE_V2.md and SWEEP_FEES.md.

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

const baseMintAccount: RawMint = {
  mintAuthorityOption: 0,
  mintAuthority: PublicKey.unique(),
  supply: BigInt("1000000000000000"),
  decimals: 6,
  isInitialized: true,
  freezeAuthorityOption: 0,
  freezeAuthority: PublicKey.unique(),
};

function tokenQuotedState(quoteTokenProgram: PublicKey): SwapSolanaState {
  const state = createSwapSolanaState({
    globalConfig,
    feeConfig,
    quoteMint: PublicKey.unique(),
    quoteTokenProgram,
    baseMintAccount,
    poolBaseAmount: new BN("500000000000000"),
    poolQuoteAmount: new BN("30000000000"),
  });
  return {
    ...state,
    pool: { ...state.pool, coinCreator: Keypair.generate().publicKey },
  };
}

function onlyPumpAmm(
  instructions: TransactionInstruction[],
): TransactionInstruction {
  const pumpAmm = instructions.filter((ix) =>
    ix.programId.equals(PUMP_AMM_PROGRAM_ID),
  );
  expect(pumpAmm).to.have.length(1);
  return pumpAmm[0];
}

describe("v2 trades share one 17-account list", () => {
  const V1_ONLY_ACCOUNTS = [
    "protocolFeeRecipient",
    "protocolFeeRecipientTokenAccount",
    "coinCreatorVaultAta",
    "coinCreatorVaultAuthority",
    "globalVolumeAccumulator",
    "feeProgram",
  ];

  for (const [label, quoteTokenProgram] of [
    ["SPL Token quote", TOKEN_PROGRAM_ID],
    ["Token-2022 quote", TOKEN_2022_PROGRAM_ID],
  ] as const) {
    it(`${label}: buy_v2, buy_exact_quote_in_v2 and sell_v2 carry identical keys in IDL order`, async () => {
      const state = tokenQuotedState(quoteTokenProgram);
      const buy = onlyPumpAmm(
        await PUMP_AMM_SDK.buyV2Instructions(
          state,
          new BN(1_000),
          new BN(2_000),
        ),
      );
      const exactIn = onlyPumpAmm(
        await PUMP_AMM_SDK.buyExactQuoteInV2Instructions(
          state,
          new BN(5_000),
          new BN(7),
        ),
      );
      const sell = onlyPumpAmm(
        await PUMP_AMM_SDK.sellV2Instructions(
          state,
          new BN(1_000),
          new BN(900),
        ),
      );

      for (const [name, ix] of [
        ["buyV2", buy],
        ["buyExactQuoteInV2", exactIn],
        ["sellV2", sell],
      ] as const) {
        expect(ix.keys, name).to.have.length(17);
        expect(ix.keys, name).to.have.length(idlAccounts(name).length);
        expect(ix.data.subarray(0, 8).equals(instructionDiscriminator(name)))
          .to.eq(true);
        for (const missing of V1_ONLY_ACCOUNTS) {
          expect(
            idlAccounts(name).map((account) => account.name),
            `${name} must not take ${missing}`,
          ).to.not.include(missing);
        }
      }

      const keyList = (ix: TransactionInstruction) =>
        ix.keys.map(
          (key) =>
            `${key.pubkey.toBase58()}:${key.isSigner}:${key.isWritable}`,
        );
      expect(keyList(exactIn)).to.deep.equal(keyList(buy));
      expect(keyList(sell)).to.deep.equal(keyList(buy));

      // The protocol fee recipients never appear: the fee stays in the pool until it is swept.
      for (const recipient of globalConfig.protocolFeeRecipients) {
        expect(
          buy.keys.some((key) => key.pubkey.equals(recipient)),
        ).to.eq(false);
      }
      expect(accountKey(buy, "buyV2", "pool").equals(state.poolKey)).to.eq(
        true,
      );
      expect(buy.keys[0].isWritable).to.eq(true);
    });
  }

  it("sell_v2 and buy_exact_quote_in_v2 encode their limits", async () => {
    const state = tokenQuotedState(TOKEN_PROGRAM_ID);
    const sell = decodePumpAmmInstruction<{
      baseAmountIn: BN;
      minQuoteAmountOut: BN;
    }>(
      await PUMP_AMM_SDK.sellV2Instructions(
        state,
        new BN("123456789012"),
        new BN("987654321"),
      ),
      "sellV2",
    );
    expect(sell.baseAmountIn.toString()).to.equal("123456789012");
    expect(sell.minQuoteAmountOut.toString()).to.equal("987654321");

    // An exact-quote-in v2 buy built from the same quote function the v1 builders use.
    const spend = new BN(250_000_000);
    const { base } = buyQuoteInput({
      quote: spend,
      slippage: 0,
      baseReserve: state.poolBaseAmount,
      quoteReserve: state.poolQuoteAmount,
      virtualQuoteReserves: state.pool.virtualQuoteReserves,
      globalConfig,
      feeConfig,
      baseMintAccount,
      baseMint: state.pool.baseMint,
      coinCreator: state.pool.coinCreator,
      creator: state.pool.creator,
      quoteMint: state.pool.quoteMint,
    });
    const minBaseOut = base.muln(99).divn(100);
    const exactIn = decodePumpAmmInstruction<{
      spendableQuoteIn: BN;
      minBaseAmountOut: BN;
    }>(
      await PUMP_AMM_SDK.buyExactQuoteInV2Instructions(
        state,
        spend,
        minBaseOut,
      ),
      "buyExactQuoteInV2",
    );
    expect(exactIn.spendableQuoteIn.toString()).to.equal(spend.toString());
    expect(exactIn.minBaseAmountOut.toString()).to.equal(
      minBaseOut.toString(),
    );
    expect(exactIn.minBaseAmountOut.gtn(0)).to.eq(true);
  });
});

describe("sweep_creator_fee before collect_coin_creator_fee", () => {
  it("the sweep pays into exactly the vault the claim drains, so both fit one transaction", async () => {
    const quoteTokenProgram = TOKEN_2022_PROGRAM_ID;
    const state = tokenQuotedState(quoteTokenProgram);
    const { pool, poolKey } = state;
    const coinCreator = pool.coinCreator;
    const payer = coinCreator;

    const sweep = await PUMP_AMM_SDK.sweepCreatorFeeInstruction({
      payer,
      poolKey,
      pool: {
        ...pool,
        creatorFees: new BN(1_250_000),
        virtualQuoteReserves: new BN(-1_250_000),
      },
      quoteTokenProgram,
    });

    const vaultAuthority = coinCreatorVaultAuthorityPda(coinCreator);
    const collectState: CollectCoinCreatorFeeSolanaState = {
      coinCreator,
      quoteMint: pool.quoteMint,
      quoteTokenProgram,
      coinCreatorVaultAuthority: vaultAuthority,
      coinCreatorVaultAta: coinCreatorVaultAtaPda(
        vaultAuthority,
        pool.quoteMint,
        quoteTokenProgram,
      ),
      coinCreatorTokenAccount: getAssociatedTokenAddressSync(
        pool.quoteMint,
        coinCreator,
        true,
        quoteTokenProgram,
      ),
      coinCreatorVaultAtaAccountInfo: null,
      coinCreatorTokenAccountInfo: null,
    };
    const collect = await PUMP_AMM_SDK.collectCoinCreatorFee(
      collectState,
      payer,
    );
    const claim = collect.find(
      (ix) =>
        ix.programId.equals(PUMP_AMM_PROGRAM_ID) &&
        ix.data
          .subarray(0, 8)
          .equals(instructionDiscriminator("collectCoinCreatorFee")),
    );
    expect(claim).to.not.equal(undefined);

    expect(
      accountKey(sweep, "sweepCreatorFee", "recipient").toBase58(),
    ).to.equal(
      accountKey(
        claim!,
        "collectCoinCreatorFee",
        "coinCreatorVaultAuthority",
      ).toBase58(),
    );
    expect(
      accountKey(sweep, "sweepCreatorFee", "recipientTokenAccount").toBase58(),
    ).to.equal(
      accountKey(
        claim!,
        "collectCoinCreatorFee",
        "coinCreatorVaultAta",
      ).toBase58(),
    );
    expect(
      accountKey(sweep, "sweepCreatorFee", "quoteTokenProgram").toBase58(),
    ).to.equal(quoteTokenProgram.toBase58());
    expect(sweep.keys).to.have.length(idlAccounts("sweepCreatorFee").length);
    expect(sweep.data).to.have.length(8);
  });
});
