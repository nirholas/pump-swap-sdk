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
  RawMint,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PUMP_AMM_SDK } from "../sdk/offlinePumpAmm";
import { coinCreatorVaultAuthorityPda, PUMP_AMM_PROGRAM_ID } from "../sdk/pda";
import { GlobalConfig, SwapSolanaState } from "../types/sdk";
import {
  accountKey,
  CLOSE_ACCOUNT_TAG,
  createAtaKeys,
  createFeeConfigFromGlobalConfig,
  createSwapSolanaState,
  idlAccounts,
  instructionDiscriminator,
  isTokenInstruction,
  SYNC_NATIVE_TAG,
} from "./utils";

/** One-word shape of each instruction, to assert on a whole sequence at once. */
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
    if (instruction.programId.equals(PUMP_AMM_PROGRAM_ID)) {
      for (const name of ["buy", "sell"]) {
        if (
          instruction.data.subarray(0, 8).equals(instructionDiscriminator(name))
        ) {
          return name;
        }
      }
    }
    return `unknown:${instruction.programId.toBase58()}`;
  });
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
  buybackBasisPoints: new BN(0),
  boostAuthority: PublicKey.default,
  boostEnabled: false,
  creatorFeeConfigurable: false,
  maxConfigurableCreatorFeeBps: new BN(0),
};
const feeConfig = createFeeConfigFromGlobalConfig(globalConfig);

const baseOut = new BN(1_000_000);
const maxQuoteIn = new BN(50_000_000);
const baseIn = new BN(1_000_000);
const minQuoteOut = new BN(40_000_000);

function swapState(quoteMint: PublicKey, quoteTokenProgram: PublicKey) {
  return createSwapSolanaState({
    globalConfig,
    feeConfig,
    quoteMint,
    quoteTokenProgram,
    baseMintAccount,
    poolBaseAmount: new BN("500000000000000"),
    poolQuoteAmount: new BN("30000000000"),
  });
}

/**
 * Every quote-side token account the swap instruction names must be the ATA of its owner for the
 * pool's quote mint under `quoteTokenProgram`, and the program itself must be passed as
 * `quoteTokenProgram`.
 */
function expectQuoteSideAccounts(
  instruction: TransactionInstruction,
  name: "buy" | "sell",
  state: SwapSolanaState,
  quoteTokenProgram: PublicKey,
) {
  const { pool } = state;
  const ata = (owner: PublicKey) =>
    getAssociatedTokenAddressSync(
      pool.quoteMint,
      owner,
      true,
      quoteTokenProgram,
    );
  const protocolFeeRecipient = accountKey(
    instruction,
    name,
    "protocolFeeRecipient",
  );
  expect(
    protocolFeeRecipient.equals(globalConfig.protocolFeeRecipients[0]),
  ).to.eq(true);

  const expected: Record<string, PublicKey> = {
    quoteMint: pool.quoteMint,
    quoteTokenProgram,
    baseTokenProgram: TOKEN_PROGRAM_ID,
    userQuoteTokenAccount: ata(state.user),
    poolQuoteTokenAccount: ata(state.poolKey),
    protocolFeeRecipientTokenAccount: ata(protocolFeeRecipient),
    coinCreatorVaultAta: ata(coinCreatorVaultAuthorityPda(pool.coinCreator)),
  };
  for (const [accountName, key] of Object.entries(expected)) {
    expect(
      accountKey(instruction, name, accountName).toBase58(),
      accountName,
    ).to.equal(key.toBase58());
  }

  // Remaining accounts: buyback fee recipient and its quote ATA (no cashback, no coin creator).
  const remaining = instruction.keys.slice(idlAccounts(name).length);
  expect(remaining.map((key) => key.pubkey.toBase58())).to.deep.equal([
    globalConfig.buybackFeeRecipients[0].toBase58(),
    ata(globalConfig.buybackFeeRecipients[0]).toBase58(),
  ]);
  expect(remaining[1].isWritable).to.eq(true);
}

describe("swap instructions for a Token-2022 quote", () => {
  const quoteMint = PublicKey.unique();
  const state = swapState(quoteMint, TOKEN_2022_PROGRAM_ID);

  it("buy: quote-side ATAs are derived under Token-2022 and nothing is wrapped or closed", async () => {
    const instructions = await PUMP_AMM_SDK.buyInstructions(
      state,
      baseOut,
      maxQuoteIn,
    );

    // The user's base ATA is created; the quote ATA is the user's own and must already exist.
    expect(shape(instructions)).to.deep.equal(["createAta", "buy"]);
    expect(
      createAtaKeys(instructions[0]).tokenProgram.pubkey.equals(
        TOKEN_PROGRAM_ID,
      ),
    ).to.eq(true);
    expectQuoteSideAccounts(
      instructions[1],
      "buy",
      state,
      TOKEN_2022_PROGRAM_ID,
    );
  });

  it("sell: the user's quote ATA is created under Token-2022 and not closed afterwards", async () => {
    const instructions = await PUMP_AMM_SDK.sellInstructions(
      state,
      baseIn,
      minQuoteOut,
    );

    expect(shape(instructions)).to.deep.equal(["createAta", "sell"]);
    expect(
      createAtaKeys(instructions[0]).tokenProgram.pubkey.equals(
        TOKEN_2022_PROGRAM_ID,
      ),
    ).to.eq(true);
    expect(
      instructions[0].keys[1].pubkey.equals(state.userQuoteTokenAccount),
    ).to.eq(true);
    expectQuoteSideAccounts(
      instructions[1],
      "sell",
      state,
      TOKEN_2022_PROGRAM_ID,
    );
  });

  it("existing user ATAs: only the swap instruction is built", async () => {
    const funded: SwapSolanaState = {
      ...state,
      userBaseAccountInfo: {
        data: Buffer.alloc(165),
        executable: false,
        lamports: 1,
        owner: TOKEN_PROGRAM_ID,
      },
      userQuoteAccountInfo: {
        data: Buffer.alloc(170),
        executable: false,
        lamports: 1,
        owner: TOKEN_2022_PROGRAM_ID,
      },
    };
    expect(
      shape(await PUMP_AMM_SDK.buyInstructions(funded, baseOut, maxQuoteIn)),
    ).to.deep.equal(["buy"]);
    expect(
      shape(await PUMP_AMM_SDK.sellInstructions(funded, baseIn, minQuoteOut)),
    ).to.deep.equal(["sell"]);
  });
});

describe("swap instructions for a wSOL quote (unchanged wrap / sync / close)", () => {
  const state = swapState(NATIVE_MINT, TOKEN_PROGRAM_ID);

  it("buy: creates and funds the user's wSOL ATA, buys, then closes it", async () => {
    const instructions = await PUMP_AMM_SDK.buyInstructions(
      state,
      baseOut,
      maxQuoteIn,
    );

    expect(shape(instructions)).to.deep.equal([
      "createAta",
      "systemTransfer",
      "syncNative",
      "createAta",
      "buy",
      "closeAccount",
    ]);
    expect(
      createAtaKeys(instructions[0]).tokenProgram.pubkey.equals(
        TOKEN_PROGRAM_ID,
      ),
    ).to.eq(true);
    expect(
      instructions[0].keys[1].pubkey.equals(state.userQuoteTokenAccount),
    ).to.eq(true);
    expect(
      instructions[5].keys[0].pubkey.equals(state.userQuoteTokenAccount),
    ).to.eq(true);
    expectQuoteSideAccounts(instructions[4], "buy", state, TOKEN_PROGRAM_ID);
  });

  it("sell: creates the user's wSOL ATA, sells, then closes it to unwrap", async () => {
    const instructions = await PUMP_AMM_SDK.sellInstructions(
      state,
      baseIn,
      minQuoteOut,
    );

    expect(shape(instructions)).to.deep.equal([
      "createAta",
      "sell",
      "closeAccount",
    ]);
    expectQuoteSideAccounts(instructions[1], "sell", state, TOKEN_PROGRAM_ID);
  });
});
