import { expect } from "chai";
import BN from "bn.js";
import {
  AccountInfo,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  AccountLayout,
  ACCOUNT_SIZE,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  canonicalPumpPoolPda,
  coinCreatorVaultAtaPda,
  coinCreatorVaultAuthorityPda,
  GLOBAL_CONFIG_PDA,
  PUMP_AMM_EVENT_AUTHORITY_PDA,
  PUMP_AMM_PROGRAM_ID,
  pumpPda,
} from "../sdk/pda";
import { USDC_MINT } from "../sdk/fees";
import { OFFLINE_PUMP_AMM_PROGRAM, PUMP_AMM_SDK } from "../sdk/offlinePumpAmm";
import { OnlinePumpAmmSdk } from "../sdk/onlinePumpAmm";
import { PumpAmmAdminSdk } from "../sdk/pumpAmmAdmin";
import { CollectCoinCreatorFeeSolanaState, GlobalConfig } from "../types/sdk";
import {
  accountKey,
  CLOSE_ACCOUNT_TAG,
  createAtaKeys,
  goldenInstruction,
  idlAccounts,
  instructionDiscriminator,
  isTokenInstruction,
  stubConnection,
  SYNC_NATIVE_TAG,
} from "./utils";
import {
  COLLECT_COIN_CREATOR_FEE_WSOL_GOLDEN,
  GoldenInstruction,
} from "./collectCoinCreatorFeeWsolGolden";

function isPumpAmmInstruction(
  instruction: TransactionInstruction,
  instructionName: string,
): boolean {
  return (
    instruction.programId.equals(PUMP_AMM_PROGRAM_ID) &&
    instruction.data
      .subarray(0, 8)
      .equals(instructionDiscriminator(instructionName))
  );
}

function isCreateAtaIdempotent(instruction: TransactionInstruction): boolean {
  return (
    instruction.programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID) &&
    instruction.data.equals(Buffer.from([1]))
  );
}

/** One-word shape of each instruction, to assert on a whole sequence at once. */
function shape(instructions: TransactionInstruction[]): string[] {
  return instructions.map((instruction) => {
    if (isCreateAtaIdempotent(instruction)) return "createAta";
    if (isTokenInstruction(instruction, CLOSE_ACCOUNT_TAG)) {
      return "closeAccount";
    }
    if (isTokenInstruction(instruction, SYNC_NATIVE_TAG)) return "syncNative";
    if (instruction.programId.equals(SystemProgram.programId)) return "system";
    if (isPumpAmmInstruction(instruction, "collectCoinCreatorFee")) {
      return "collectCoinCreatorFee";
    }
    return `unknown:${instruction.programId.toBase58()}`;
  });
}

const existingTokenAccount = (owner: PublicKey): AccountInfo<Buffer> => ({
  data: Buffer.alloc(ACCOUNT_SIZE),
  executable: false,
  lamports: 2_039_280,
  owner,
});

function collectState({
  coinCreator,
  quoteMint,
  quoteTokenProgram,
  vaultAtaExists,
  creatorAtaExists,
}: {
  coinCreator: PublicKey;
  quoteMint: PublicKey;
  quoteTokenProgram: PublicKey;
  vaultAtaExists: boolean;
  creatorAtaExists: boolean;
}): CollectCoinCreatorFeeSolanaState {
  const coinCreatorVaultAuthority = coinCreatorVaultAuthorityPda(coinCreator);
  return {
    coinCreator,
    quoteMint,
    quoteTokenProgram,
    coinCreatorVaultAuthority,
    coinCreatorVaultAta: coinCreatorVaultAtaPda(
      coinCreatorVaultAuthority,
      quoteMint,
      quoteTokenProgram,
    ),
    coinCreatorTokenAccount: getAssociatedTokenAddressSync(
      quoteMint,
      coinCreator,
      true,
      quoteTokenProgram,
    ),
    coinCreatorVaultAtaAccountInfo: vaultAtaExists
      ? existingTokenAccount(quoteTokenProgram)
      : null,
    coinCreatorTokenAccountInfo: creatorAtaExists
      ? existingTokenAccount(quoteTokenProgram)
      : null,
  };
}

function mintAccount(owner: PublicKey): AccountInfo<Buffer> {
  return { data: Buffer.alloc(82), executable: false, lamports: 1, owner };
}

/** The 165-byte SPL Token account layout holding `amount`. */
function splTokenAccountData(
  mint: PublicKey,
  owner: PublicKey,
  amount: BN,
): Buffer {
  const base = Buffer.alloc(ACCOUNT_SIZE);
  AccountLayout.encode(
    {
      mint,
      owner,
      amount: BigInt(amount.toString()),
      delegateOption: 0,
      delegate: PublicKey.default,
      state: 1,
      isNativeOption: 0,
      isNative: BigInt(0),
      delegatedAmount: BigInt(0),
      closeAuthorityOption: 0,
      closeAuthority: PublicKey.default,
    },
    base,
  );
  return base;
}

function splTokenAccount(
  mint: PublicKey,
  owner: PublicKey,
  amount: BN,
): AccountInfo<Buffer> {
  return {
    data: splTokenAccountData(mint, owner, amount),
    executable: false,
    lamports: 1,
    owner: TOKEN_PROGRAM_ID,
  };
}

/**
 * A Token-2022 token account holding `amount`: the 165-byte SPL layout, the account-type byte
 * and one empty ImmutableOwner TLV entry (170 bytes), the smallest shape a Token-2022 ATA has.
 */
function token2022Account(
  mint: PublicKey,
  owner: PublicKey,
  amount: BN,
): AccountInfo<Buffer> {
  const base = splTokenAccountData(mint, owner, amount);
  const accountType = Buffer.from([2]);
  const immutableOwnerTlv = Buffer.from([7, 0, 0, 0]);
  return {
    data: Buffer.concat([base, accountType, immutableOwnerTlv]),
    executable: false,
    lamports: 1,
    owner: TOKEN_2022_PROGRAM_ID,
  };
}

const coinCreator = Keypair.generate().publicKey;
const payer = Keypair.generate().publicKey;
const token2022Quote = PublicKey.unique();

describe("PumpAmmSdk.collectCoinCreatorFee", () => {
  it("wSOL, creator pays: creates both ATAs, collects, then unwraps the creator's wSOL", async () => {
    const state = collectState({
      coinCreator,
      quoteMint: NATIVE_MINT,
      quoteTokenProgram: TOKEN_PROGRAM_ID,
      vaultAtaExists: false,
      creatorAtaExists: false,
    });
    const instructions = await PUMP_AMM_SDK.collectCoinCreatorFee(state);

    expect(shape(instructions)).to.deep.equal([
      "createAta",
      "createAta",
      "collectCoinCreatorFee",
      "closeAccount",
    ]);

    const vault = createAtaKeys(instructions[0]);
    expect(vault.payer.pubkey.equals(coinCreator)).to.eq(true);
    expect(vault.payer.isSigner).to.eq(true);
    expect(vault.ata.pubkey.equals(state.coinCreatorVaultAta)).to.eq(true);
    expect(vault.owner.pubkey.equals(state.coinCreatorVaultAuthority)).to.eq(
      true,
    );
    expect(vault.mint.pubkey.equals(NATIVE_MINT)).to.eq(true);
    expect(vault.tokenProgram.pubkey.equals(TOKEN_PROGRAM_ID)).to.eq(true);

    const creator = createAtaKeys(instructions[1]);
    expect(creator.ata.pubkey.equals(state.coinCreatorTokenAccount)).to.eq(
      true,
    );
    expect(creator.owner.pubkey.equals(coinCreator)).to.eq(true);
    expect(creator.tokenProgram.pubkey.equals(TOKEN_PROGRAM_ID)).to.eq(true);

    // close_account: account, destination, authority.
    const [closed, destination, authority] = instructions[3].keys;
    expect(closed.pubkey.equals(state.coinCreatorTokenAccount)).to.eq(true);
    expect(destination.pubkey.equals(coinCreator)).to.eq(true);
    expect(authority.pubkey.equals(coinCreator)).to.eq(true);
    expect(authority.isSigner).to.eq(true);
  });

  it("wSOL, third-party payer: skips existing ATAs and leaves the creator's wSOL wrapped", async () => {
    const state = collectState({
      coinCreator,
      quoteMint: NATIVE_MINT,
      quoteTokenProgram: TOKEN_PROGRAM_ID,
      vaultAtaExists: true,
      creatorAtaExists: true,
    });

    expect(
      shape(await PUMP_AMM_SDK.collectCoinCreatorFee(state, payer)),
    ).to.deep.equal(["collectCoinCreatorFee"]);
    expect(
      shape(await PUMP_AMM_SDK.collectCoinCreatorFee(state)),
    ).to.deep.equal(["collectCoinCreatorFee", "closeAccount"]);

    const [creatorMissing] = await PUMP_AMM_SDK.collectCoinCreatorFee(
      { ...state, coinCreatorTokenAccountInfo: null },
      payer,
    );
    expect(createAtaKeys(creatorMissing).payer.pubkey.equals(payer)).to.eq(
      true,
    );
  });

  it("SPL quote (USDC): creates both ATAs and never unwraps", async () => {
    const state = collectState({
      coinCreator,
      quoteMint: USDC_MINT,
      quoteTokenProgram: TOKEN_PROGRAM_ID,
      vaultAtaExists: false,
      creatorAtaExists: false,
    });
    const instructions = await PUMP_AMM_SDK.collectCoinCreatorFee(state);

    expect(shape(instructions)).to.deep.equal([
      "createAta",
      "createAta",
      "collectCoinCreatorFee",
    ]);
    expect(createAtaKeys(instructions[0]).mint.pubkey.equals(USDC_MINT)).to.eq(
      true,
    );
  });

  it("Token-2022 quote: creates both ATAs under Token-2022 and never unwraps", async () => {
    const state = collectState({
      coinCreator,
      quoteMint: token2022Quote,
      quoteTokenProgram: TOKEN_2022_PROGRAM_ID,
      vaultAtaExists: false,
      creatorAtaExists: false,
    });
    const instructions = await PUMP_AMM_SDK.collectCoinCreatorFee(state);

    expect(shape(instructions)).to.deep.equal([
      "createAta",
      "createAta",
      "collectCoinCreatorFee",
    ]);
    for (const instruction of instructions.slice(0, 2)) {
      expect(
        createAtaKeys(instruction).tokenProgram.pubkey.equals(
          TOKEN_2022_PROGRAM_ID,
        ),
      ).to.eq(true);
    }

    const collect = instructions[2];
    const name = "collectCoinCreatorFee";
    expect(
      accountKey(collect, name, "quoteTokenProgram").equals(
        TOKEN_2022_PROGRAM_ID,
      ),
    ).to.eq(true);
    expect(accountKey(collect, name, "quoteMint").equals(token2022Quote)).to.eq(
      true,
    );
    expect(
      accountKey(collect, name, "coinCreatorVaultAta").equals(
        getAssociatedTokenAddressSync(
          token2022Quote,
          state.coinCreatorVaultAuthority,
          true,
          TOKEN_2022_PROGRAM_ID,
        ),
      ),
    ).to.eq(true);
    expect(
      accountKey(collect, name, "coinCreatorTokenAccount").equals(
        state.coinCreatorTokenAccount,
      ),
    ).to.eq(true);
  });

  it("Token-2022 quote with existing ATAs: only the collect instruction", async () => {
    const state = collectState({
      coinCreator,
      quoteMint: token2022Quote,
      quoteTokenProgram: TOKEN_2022_PROGRAM_ID,
      vaultAtaExists: true,
      creatorAtaExists: true,
    });
    expect(
      shape(await PUMP_AMM_SDK.collectCoinCreatorFee(state)),
    ).to.deep.equal(["collectCoinCreatorFee"]);
  });

  it("custom destination: an existing non-ATA token account is used as is, a missing one is rejected", async () => {
    const customDestination = Keypair.generate().publicKey;
    const state: CollectCoinCreatorFeeSolanaState = {
      ...collectState({
        coinCreator,
        quoteMint: USDC_MINT,
        quoteTokenProgram: TOKEN_PROGRAM_ID,
        vaultAtaExists: false,
        creatorAtaExists: true,
      }),
      coinCreatorTokenAccount: customDestination,
    };

    const instructions = await PUMP_AMM_SDK.collectCoinCreatorFee(state);
    // Only the vault ATA is created; the custom destination is passed through untouched.
    expect(shape(instructions)).to.deep.equal([
      "createAta",
      "collectCoinCreatorFee",
    ]);
    expect(
      accountKey(
        instructions[1],
        "collectCoinCreatorFee",
        "coinCreatorTokenAccount",
      ).equals(customDestination),
    ).to.eq(true);

    let error: unknown;
    try {
      await PUMP_AMM_SDK.collectCoinCreatorFee({
        ...state,
        coinCreatorTokenAccountInfo: null,
      });
    } catch (e) {
      error = e;
    }
    expect(String(error)).to.match(
      /coinCreatorTokenAccount=.* does not exist; only the creator's ATA is created automatically/,
    );
  });

  it("wSOL: byte-identical to the pre-quote-mint builder for all 8 missing/present x payer cases", async () => {
    const goldenCreator = Keypair.fromSeed(Buffer.alloc(32, 1)).publicKey;
    const goldenPayer = Keypair.fromSeed(Buffer.alloc(32, 2)).publicKey;
    const built: Record<string, GoldenInstruction[]> = {};
    for (const vaultAtaExists of [false, true]) {
      for (const creatorAtaExists of [false, true]) {
        for (const payerIsCreator of [true, false]) {
          const state = collectState({
            coinCreator: goldenCreator,
            quoteMint: NATIVE_MINT,
            quoteTokenProgram: TOKEN_PROGRAM_ID,
            vaultAtaExists,
            creatorAtaExists,
          });
          const instructions = await PUMP_AMM_SDK.collectCoinCreatorFee(
            state,
            payerIsCreator ? undefined : goldenPayer,
          );
          built[
            `vault=${vaultAtaExists},creator=${creatorAtaExists},payerIsCreator=${payerIsCreator}`
          ] = instructions.map(goldenInstruction);
        }
      }
    }
    expect(Object.keys(built)).to.have.length(8);
    expect(built).to.deep.equal(COLLECT_COIN_CREATOR_FEE_WSOL_GOLDEN);
  });
});

describe("PumpAmmSdk.transferCreatorFeesToPumpV2Instruction", () => {
  const name = "transferCreatorFeesToPumpV2";

  async function expectMatchesIdl(
    quoteMint: PublicKey,
    quoteTokenProgram: PublicKey,
  ) {
    const instruction =
      await PUMP_AMM_SDK.transferCreatorFeesToPumpV2Instruction({
        payer,
        coinCreator,
        quoteMint,
        quoteTokenProgram,
      });
    const coinCreatorVaultAuthority = coinCreatorVaultAuthorityPda(coinCreator);
    // pump program `creator-vault` PDA and its ATA for the quote (the program creates the ATA).
    const pumpCreatorVault = pumpPda([
      Buffer.from("creator-vault"),
      coinCreator.toBuffer(),
    ]);
    const expected: Record<string, PublicKey> = {
      payer,
      quoteMint,
      tokenProgram: quoteTokenProgram,
      systemProgram: SystemProgram.programId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      coinCreator,
      coinCreatorVaultAuthority,
      coinCreatorVaultAta: coinCreatorVaultAtaPda(
        coinCreatorVaultAuthority,
        quoteMint,
        quoteTokenProgram,
      ),
      pumpCreatorVault,
      pumpCreatorVaultAta: getAssociatedTokenAddressSync(
        quoteMint,
        pumpCreatorVault,
        true,
        quoteTokenProgram,
      ),
      eventAuthority: PUMP_AMM_EVENT_AUTHORITY_PDA,
      program: PUMP_AMM_PROGRAM_ID,
    };

    expect(instruction.programId.equals(PUMP_AMM_PROGRAM_ID)).to.eq(true);
    expect(instruction.data.equals(instructionDiscriminator(name))).to.eq(true);

    const accounts = idlAccounts(name);
    expect(accounts.map((account) => account.name)).to.deep.equal(
      Object.keys(expected),
    );
    expect(instruction.keys.length).to.equal(accounts.length);
    accounts.forEach((account, i) => {
      const key = instruction.keys[i];
      expect(key.pubkey.toBase58(), account.name).to.equal(
        expected[account.name].toBase58(),
      );
      expect(key.isWritable, `${account.name} writable`).to.equal(
        account.writable ?? false,
      );
      expect(key.isSigner, `${account.name} signer`).to.equal(
        account.signer ?? false,
      );
    });
  }

  it("wSOL: account order and writability match the IDL, pump_creator_vault_ata included", async () => {
    await expectMatchesIdl(NATIVE_MINT, TOKEN_PROGRAM_ID);
  });

  it("Token-2022 quote: both vault ATAs are derived under the quote token program", async () => {
    await expectMatchesIdl(token2022Quote, TOKEN_2022_PROGRAM_ID);
  });
});

describe("OnlinePumpAmmSdk creator fee readers", () => {
  const vaultAuthority = coinCreatorVaultAuthorityPda(coinCreator);
  const token2022Vault = coinCreatorVaultAtaPda(
    vaultAuthority,
    token2022Quote,
    TOKEN_2022_PROGRAM_ID,
  );
  const wsolVault = coinCreatorVaultAtaPda(
    vaultAuthority,
    NATIVE_MINT,
    TOKEN_PROGRAM_ID,
  );
  // A second creator whose WSOL vault holds fees, to prove the zero key reads the WSOL vault.
  const solCreator = Keypair.generate().publicKey;
  const solCreatorVaultAuthority = coinCreatorVaultAuthorityPda(solCreator);
  const solCreatorWsolVault = coinCreatorVaultAtaPda(
    solCreatorVaultAuthority,
    NATIVE_MINT,
    TOKEN_PROGRAM_ID,
  );
  // An existing account that is not a mint (a wallet), as `getAccountInfo` would return it.
  const wallet = Keypair.generate().publicKey;
  const NATIVE_LOADER = new PublicKey(
    "NativeLoader1111111111111111111111111111111",
  );
  const accounts = new Map<string, AccountInfo<Buffer>>([
    [token2022Quote.toBase58(), mintAccount(TOKEN_2022_PROGRAM_ID)],
    [USDC_MINT.toBase58(), mintAccount(TOKEN_PROGRAM_ID)],
    [
      token2022Vault.toBase58(),
      token2022Account(token2022Quote, vaultAuthority, new BN(123_456)),
    ],
    [
      solCreatorWsolVault.toBase58(),
      splTokenAccount(
        NATIVE_MINT,
        solCreatorVaultAuthority,
        new BN(5_000_000_000),
      ),
    ],
    // Mainnet shape of the zero key: the System Program account, owned by the native loader.
    [
      PublicKey.default.toBase58(),
      {
        data: Buffer.from("system_program"),
        executable: true,
        lamports: 1,
        owner: NATIVE_LOADER,
      },
    ],
    [
      wallet.toBase58(),
      {
        data: Buffer.alloc(0),
        executable: false,
        lamports: 1_000_000,
        owner: SystemProgram.programId,
      },
    ],
  ]);

  it("collectCoinCreatorFeeSolanaState defaults to wSOL without fetching the mint", async () => {
    const fetched: string[] = [];
    const sdk = new OnlinePumpAmmSdk(stubConnection(accounts, fetched));

    const state = await sdk.collectCoinCreatorFeeSolanaState(coinCreator);

    expect(state.quoteMint.equals(NATIVE_MINT)).to.eq(true);
    expect(state.quoteTokenProgram.equals(TOKEN_PROGRAM_ID)).to.eq(true);
    expect(state.coinCreatorVaultAta.equals(wsolVault)).to.eq(true);
    expect(state.coinCreatorVaultAtaAccountInfo).to.eq(null);
    expect(fetched).to.deep.equal([
      wsolVault.toBase58(),
      state.coinCreatorTokenAccount.toBase58(),
    ]);
  });

  it("collectCoinCreatorFeeSolanaState resolves the token program from the quote mint's owner", async () => {
    const sdk = new OnlinePumpAmmSdk(stubConnection(accounts));

    const state = await sdk.collectCoinCreatorFeeSolanaState(
      coinCreator,
      undefined,
      token2022Quote,
    );

    expect(state.quoteTokenProgram.equals(TOKEN_2022_PROGRAM_ID)).to.eq(true);
    expect(state.coinCreatorVaultAta.equals(token2022Vault)).to.eq(true);
    expect(
      state.coinCreatorTokenAccount.equals(
        getAssociatedTokenAddressSync(
          token2022Quote,
          coinCreator,
          true,
          TOKEN_2022_PROGRAM_ID,
        ),
      ),
    ).to.eq(true);
    expect(state.coinCreatorVaultAtaAccountInfo?.data.length).to.equal(170);

    const explicit = await sdk.collectCoinCreatorFeeSolanaState(
      coinCreator,
      undefined,
      token2022Quote,
      TOKEN_2022_PROGRAM_ID,
    );
    expect(explicit.coinCreatorVaultAta.equals(token2022Vault)).to.eq(true);
  });

  it("accepts a bonding curve's zero key as WSOL in every single-quote method, without fetching it", async () => {
    const fetched: string[] = [];
    const sdk = new OnlinePumpAmmSdk(stubConnection(accounts, fetched));
    const name = "transferCreatorFeesToPumpV2";

    const state = await sdk.collectCoinCreatorFeeSolanaState(
      solCreator,
      undefined,
      PublicKey.default,
    );
    expect(state.quoteMint.equals(NATIVE_MINT)).to.eq(true);
    expect(state.quoteTokenProgram.equals(TOKEN_PROGRAM_ID)).to.eq(true);
    expect(state.coinCreatorVaultAta.equals(solCreatorWsolVault)).to.eq(true);
    expect(state.coinCreatorVaultAtaAccountInfo?.data.length).to.equal(
      ACCOUNT_SIZE,
    );
    expect(
      state.coinCreatorTokenAccount.equals(
        getAssociatedTokenAddressSync(NATIVE_MINT, solCreator),
      ),
    ).to.eq(true);

    expect(
      (
        await sdk.getCoinCreatorVaultBalance(solCreator, PublicKey.default)
      ).toString(),
    ).to.equal("5000000000");
    expect(
      (
        await sdk.getCoinCreatorVaultBalance(solCreator, NATIVE_MINT)
      ).toString(),
    ).to.equal("5000000000");

    const transfer = await sdk.transferCreatorFeesToPumpV2Instruction(
      payer,
      solCreator,
      PublicKey.default,
    );
    expect(accountKey(transfer, name, "quoteMint").equals(NATIVE_MINT)).to.eq(
      true,
    );
    expect(
      accountKey(transfer, name, "tokenProgram").equals(TOKEN_PROGRAM_ID),
    ).to.eq(true);
    expect(
      accountKey(transfer, name, "coinCreatorVaultAta").equals(
        solCreatorWsolVault,
      ),
    ).to.eq(true);

    // The zero key is never looked up: only vault and destination ATAs were fetched.
    expect(fetched).to.not.include(PublicKey.default.toBase58());
    expect(fetched).to.not.include(NATIVE_MINT.toBase58());
  });

  it("rejects an existing quote mint account that no token program owns", async () => {
    const sdk = new OnlinePumpAmmSdk(stubConnection(accounts));
    const notAMint = /quoteMint=.* is not an SPL Token or Token-2022 mint/;

    for (const call of [
      () =>
        sdk.collectCoinCreatorFeeSolanaState(coinCreator, undefined, wallet),
      () => sdk.getCoinCreatorVaultBalance(coinCreator, wallet),
      () =>
        sdk.transferCreatorFeesToPumpV2Instruction(payer, coinCreator, wallet),
    ]) {
      let error: unknown;
      try {
        await call();
      } catch (e) {
        error = e;
      }
      expect(String(error)).to.match(notAMint);
    }
  });

  it("collectCoinCreatorFeeSolanaState rejects an unknown quote mint", async () => {
    const sdk = new OnlinePumpAmmSdk(stubConnection(accounts));
    let error: unknown;
    try {
      await sdk.collectCoinCreatorFeeSolanaState(
        coinCreator,
        undefined,
        PublicKey.unique(),
      );
    } catch (e) {
      error = e;
    }
    expect(String(error)).to.match(/quoteMint=.* not found/);
  });

  it("getCoinCreatorVaultBalance reads an extension-bearing Token-2022 vault and zero for a missing one", async () => {
    const sdk = new OnlinePumpAmmSdk(stubConnection(accounts));

    expect(
      (
        await sdk.getCoinCreatorVaultBalance(coinCreator, token2022Quote)
      ).toString(),
    ).to.equal("123456");
    expect(
      (
        await sdk.getCoinCreatorVaultBalance(
          coinCreator,
          token2022Quote,
          TOKEN_2022_PROGRAM_ID,
        )
      ).toString(),
    ).to.equal("123456");
    expect(
      (await sdk.getCoinCreatorVaultBalance(coinCreator)).toString(),
    ).to.equal("0");
    expect(
      (await sdk.getCoinCreatorVaultBalance(coinCreator, USDC_MINT)).toString(),
    ).to.equal("0");
  });

  it("getCoinCreatorVaultBalance warns and reads zero for a vault the token program does not own", async () => {
    const otherCreator = Keypair.generate().publicKey;
    const otherVault = coinCreatorVaultAtaPda(
      coinCreatorVaultAuthorityPda(otherCreator),
      token2022Quote,
      TOKEN_2022_PROGRAM_ID,
    );
    const served = new Map(accounts);
    // A Token-2022-derived vault address holding an SPL Token-owned account: undecodable.
    served.set(otherVault.toBase58(), {
      ...token2022Account(
        token2022Quote,
        coinCreatorVaultAuthorityPda(otherCreator),
        new BN(777),
      ),
      owner: TOKEN_PROGRAM_ID,
    });
    const sdk = new OnlinePumpAmmSdk(stubConnection(served));

    const warnings: unknown[][] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      warnings.push(args);
    };
    try {
      expect(
        (
          await sdk.getCoinCreatorVaultBalance(otherCreator, token2022Quote)
        ).toString(),
      ).to.equal("0");
    } finally {
      console.warn = originalWarn;
    }
    expect(warnings).to.have.length(1);
    expect(String(warnings[0][0])).to.include(otherVault.toBase58());
  });

  it("getCoinCreatorVaultBalances fetches in chunks of 100 and keys every quote by its own mint", async () => {
    const batchSizes: number[] = [];
    const sdk = new OnlinePumpAmmSdk(stubConnection(accounts, [], batchSizes));
    const quotes = Array.from({ length: 100 }, () => ({
      mint: PublicKey.unique(),
      tokenProgram: TOKEN_PROGRAM_ID,
    }));
    quotes.push({ mint: token2022Quote, tokenProgram: TOKEN_2022_PROGRAM_ID });

    const balances = await sdk.getCoinCreatorVaultBalances(coinCreator, quotes);

    expect(batchSizes).to.deep.equal([100, 1]);
    expect(balances.size).to.equal(101);
    expect([...balances.keys()]).to.deep.equal(
      quotes.map(({ mint }) => mint.toBase58()),
    );
    for (const { mint } of quotes.slice(0, 100)) {
      expect(balances.get(mint.toBase58())?.toString()).to.equal("0");
    }
    expect(balances.get(token2022Quote.toBase58())?.toString()).to.equal(
      "123456",
    );
  });

  it("getCoinCreatorVaultBalances reads every quote in one pass, keyed by mint", async () => {
    const fetched: string[] = [];
    const sdk = new OnlinePumpAmmSdk(stubConnection(accounts, fetched));

    const balances = await sdk.getCoinCreatorVaultBalances(coinCreator, [
      { mint: NATIVE_MINT, tokenProgram: TOKEN_PROGRAM_ID },
      { mint: USDC_MINT, tokenProgram: TOKEN_PROGRAM_ID },
      { mint: token2022Quote, tokenProgram: TOKEN_2022_PROGRAM_ID },
    ]);

    expect([...balances.keys()]).to.deep.equal([
      NATIVE_MINT.toBase58(),
      USDC_MINT.toBase58(),
      token2022Quote.toBase58(),
    ]);
    expect(balances.get(NATIVE_MINT.toBase58())?.toString()).to.equal("0");
    expect(balances.get(USDC_MINT.toBase58())?.toString()).to.equal("0");
    expect(balances.get(token2022Quote.toBase58())?.toString()).to.equal(
      "123456",
    );
    // Only the three vault ATAs; the caller supplied the token programs, so no mint fetches.
    expect(fetched).to.deep.equal([
      wsolVault.toBase58(),
      coinCreatorVaultAtaPda(
        vaultAuthority,
        USDC_MINT,
        TOKEN_PROGRAM_ID,
      ).toBase58(),
      token2022Vault.toBase58(),
    ]);
    expect(
      (await sdk.getCoinCreatorVaultBalances(coinCreator, [])).size,
    ).to.equal(0);
  });

  it("transferCreatorFeesToPumpV2Instruction resolves the token program from the mint", async () => {
    const sdk = new OnlinePumpAmmSdk(stubConnection(accounts));
    const name = "transferCreatorFeesToPumpV2";

    const token2022 = await sdk.transferCreatorFeesToPumpV2Instruction(
      payer,
      coinCreator,
      token2022Quote,
    );
    expect(
      accountKey(token2022, name, "tokenProgram").equals(TOKEN_2022_PROGRAM_ID),
    ).to.eq(true);
    expect(
      accountKey(token2022, name, "coinCreatorVaultAta").equals(token2022Vault),
    ).to.eq(true);

    const wsol = await sdk.transferCreatorFeesToPumpV2Instruction(
      payer,
      coinCreator,
      NATIVE_MINT,
    );
    expect(
      accountKey(wsol, name, "tokenProgram").equals(TOKEN_PROGRAM_ID),
    ).to.eq(true);
  });
});
