import BN from "bn.js";
import { BorshInstructionCoder, Idl } from "@coral-xyz/anchor";
import {
  AccountInfo,
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  RawMint,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  FeeConfig,
  Fees,
  FeeTier,
  GlobalConfig,
  Pool,
  SwapSolanaState,
} from "../types/sdk";
import {
  lpMintPda,
  poolPda,
  PUMP_AMM_PROGRAM_ID,
  pumpPoolAuthorityPda,
} from "../sdk/pda";
import {
  OFFLINE_PUMP_AMM_PROGRAM,
  POOL_ACCOUNT_NEW_SIZE,
} from "../sdk/offlinePumpAmm";
import { GoldenInstruction } from "./collectCoinCreatorFeeWsolGolden";

export const ZERO_FEES: Fees = {
  lpFeeBps: new BN(0),
  protocolFeeBps: new BN(0),
  creatorFeeBps: new BN(0),
};

export function fees(
  lpFeeBps: number,
  protocolFeeBps: number,
  creatorFeeBps: number,
): Fees {
  return {
    lpFeeBps: new BN(lpFeeBps),
    protocolFeeBps: new BN(protocolFeeBps),
    creatorFeeBps: new BN(creatorFeeBps),
  };
}

export function feeTier(
  marketCapLamportsThreshold: BN | number | string,
  tierFees: Fees,
): FeeTier {
  return {
    marketCapLamportsThreshold: new BN(marketCapLamportsThreshold),
    fees: tierFees,
  };
}

export function createFeeConfigFromGlobalConfig(
  globalConfig: GlobalConfig,
): FeeConfig {
  let fees: Fees = {
    lpFeeBps: globalConfig.lpFeeBasisPoints,
    protocolFeeBps: globalConfig.protocolFeeBasisPoints,
    creatorFeeBps: globalConfig.coinCreatorFeeBasisPoints,
  };
  return {
    admin: globalConfig.admin,
    flatFees: fees,
    feeTiers: [
      {
        marketCapLamportsThreshold: new BN(0),
        fees,
      },
    ],
    stableFeeTiers: [],
    exoticFlatFees: ZERO_FEES,
  };
}

/**
 * A fully offline `SwapSolanaState` for a canonical pump pool (creator = pump pool authority of
 * the base mint) whose user owns no token accounts yet, so `PumpAmmSdk` can build swap
 * instructions without RPC. `globalConfig` must carry at least one protocol and one buyback fee
 * recipient (and a reserved recipient for mayhem pools).
 */
export function createSwapSolanaState({
  globalConfig,
  feeConfig,
  quoteMint,
  quoteTokenProgram = TOKEN_PROGRAM_ID,
  baseMintAccount,
  poolBaseAmount,
  poolQuoteAmount,
  isMayhemMode = false,
}: {
  globalConfig: GlobalConfig;
  feeConfig: FeeConfig | null;
  quoteMint: PublicKey;
  quoteTokenProgram?: PublicKey;
  baseMintAccount: RawMint;
  poolBaseAmount: BN;
  poolQuoteAmount: BN;
  isMayhemMode?: boolean;
}): SwapSolanaState {
  const baseMint = PublicKey.unique();
  const creator = pumpPoolAuthorityPda(baseMint);
  const poolKey = poolPda(0, creator, baseMint, quoteMint);
  // Wallets must be on-curve for ATA derivation; `PublicKey.unique()` is not always.
  const user = Keypair.generate().publicKey;

  const pool: Pool = {
    poolBump: 255,
    index: 0,
    creator,
    baseMint,
    quoteMint,
    lpMint: lpMintPda(poolKey),
    poolBaseTokenAccount: getAssociatedTokenAddressSync(
      baseMint,
      poolKey,
      true,
    ),
    poolQuoteTokenAccount: getAssociatedTokenAddressSync(
      quoteMint,
      poolKey,
      true,
      quoteTokenProgram,
    ),
    lpSupply: new BN(0),
    coinCreator: PublicKey.default,
    isMayhemMode,
    isCashbackCoin: false,
    virtualQuoteReserves: new BN(0),
    creatorFeeBps: new BN(0),
    canEditCreatorFee: false,
    isHolderReward: false,
    protocolFees: new BN(0),
    creatorFees: new BN(0),
  };
  const poolAccountInfo: AccountInfo<Buffer> = {
    data: Buffer.alloc(POOL_ACCOUNT_NEW_SIZE),
    executable: false,
    lamports: 0,
    owner: PUMP_AMM_PROGRAM_ID,
  };

  return {
    globalConfig,
    feeConfig,
    poolKey,
    poolAccountInfo,
    pool,
    poolBaseAmount,
    poolQuoteAmount,
    baseTokenProgram: TOKEN_PROGRAM_ID,
    quoteTokenProgram,
    baseMint,
    baseMintAccount,
    user,
    userBaseTokenAccount: getAssociatedTokenAddressSync(baseMint, user),
    userQuoteTokenAccount: getAssociatedTokenAddressSync(
      quoteMint,
      user,
      false,
      quoteTokenProgram,
    ),
    userBaseAccountInfo: null,
    userQuoteAccountInfo: null,
  };
}

const instructionCoder = new BorshInstructionCoder(
  OFFLINE_PUMP_AMM_PROGRAM.idl,
);

/** The decoded args of the first pump-amm instruction named `name` in `instructions`. */
export function decodePumpAmmInstruction<T>(
  instructions: TransactionInstruction[],
  name: string,
): T {
  for (const instruction of instructions) {
    if (!instruction.programId.equals(PUMP_AMM_PROGRAM_ID)) {
      continue;
    }
    const decoded = instructionCoder.decode(instruction.data);
    if (decoded?.name === name) {
      return decoded.data as T;
    }
  }
  throw new Error(`No pump-amm "${name}" instruction was built.`);
}

const IDL: Idl = OFFLINE_PUMP_AMM_PROGRAM.idl;

function idlInstruction(instructionName: string) {
  const instruction = IDL.instructions.find(
    (candidate) => candidate.name === instructionName,
  );
  if (instruction === undefined) {
    throw new Error(`No "${instructionName}" instruction in the IDL.`);
  }
  return instruction;
}

/** The flat account list of a pump-amm instruction, in the order the program expects. */
export function idlAccounts(instructionName: string) {
  return idlInstruction(instructionName).accounts.map((account) => {
    if ("accounts" in account) {
      throw new Error(`"${instructionName}" nests account groups.`);
    }
    return account;
  });
}

export function instructionDiscriminator(instructionName: string): Buffer {
  return Buffer.from(idlInstruction(instructionName).discriminator);
}

/** The key a built pump-amm instruction carries for the IDL account named `accountName`. */
export function accountKey(
  instruction: TransactionInstruction,
  instructionName: string,
  accountName: string,
): PublicKey {
  const index = idlAccounts(instructionName).findIndex(
    (account) => account.name === accountName,
  );
  if (index < 0) {
    throw new Error(`"${instructionName}" has no "${accountName}" account.`);
  }
  return instruction.keys[index].pubkey;
}

// SPL Token instruction tags shared by both token programs.
export const CLOSE_ACCOUNT_TAG = 9;
export const SYNC_NATIVE_TAG = 17;

/** Whether `instruction` is the SPL Token / Token-2022 instruction tagged `tag`. */
export function isTokenInstruction(
  instruction: TransactionInstruction,
  tag: number,
): boolean {
  return (
    (instruction.programId.equals(TOKEN_PROGRAM_ID) ||
      instruction.programId.equals(TOKEN_2022_PROGRAM_ID)) &&
    instruction.data[0] === tag
  );
}

/**
 * A `Connection` double serving `accounts` from memory and recording which addresses were
 * fetched (and the batch sizes of `getMultipleAccountsInfo`), so RPC-shaped code paths run
 * offline.
 */
export function stubConnection(
  accounts: Map<string, AccountInfo<Buffer>>,
  fetched: string[] = [],
  batchSizes: number[] = [],
): Connection {
  const lookup = (key: PublicKey) => {
    fetched.push(key.toBase58());
    return accounts.get(key.toBase58()) ?? null;
  };
  const stub: Pick<
    Connection,
    "getAccountInfo" | "getAccountInfoAndContext" | "getMultipleAccountsInfo"
  > = {
    getAccountInfo: async (key: PublicKey) => lookup(key),
    getAccountInfoAndContext: async (key: PublicKey) => ({
      context: { slot: 0 },
      value: lookup(key),
    }),
    getMultipleAccountsInfo: async (keys: PublicKey[]) => {
      batchSizes.push(keys.length);
      return keys.map(lookup);
    },
  };
  return stub as unknown as Connection;
}

/** The golden fixtures' serialization of an instruction: program, [key, signer, writable], data. */
export function goldenInstruction(
  instruction: TransactionInstruction,
): GoldenInstruction {
  return {
    programId: instruction.programId.toBase58(),
    keys: instruction.keys.map((key) => [
      key.pubkey.toBase58(),
      key.isSigner,
      key.isWritable,
    ]),
    data: Buffer.from(instruction.data).toString("hex"),
  };
}

/**
 * The accounts of a `create_associated_token_account[_idempotent]` instruction: payer, ata,
 * owner, mint, system program, token program.
 */
export function createAtaKeys(instruction: TransactionInstruction) {
  const [payer, ata, owner, mint, , tokenProgram] = instruction.keys;
  return { payer, ata, owner, mint, tokenProgram };
}
