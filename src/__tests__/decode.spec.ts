import { expect } from "chai";
import BN from "bn.js";
import { AccountInfo, PublicKey } from "@solana/web3.js";
import pumpAmmJson from "../idl/pump_amm.json";
import {
  FEE_CONFIG_SIZE_POST_EXOTIC,
  FEE_CONFIG_SIZE_POST_STABLE,
  FEE_CONFIG_SIZE_PRE_STABLE,
  OFFLINE_PUMP_AMM_PROGRAM,
  PUMP_AMM_SDK,
} from "../sdk/offlinePumpAmm";
import { PUMP_AMM_FEE_CONFIG_PDA, PUMP_FEE_PROGRAM_ID } from "../sdk/pda";
import { FeeConfig, Fees, FeeTier } from "../types/sdk";
import { ZERO_FEES } from "./utils";
import {
  FeeTierRow,
  MAINNET_FEE_CONFIG_ACCOUNT,
  MAINNET_FEE_CONFIG_ADMIN,
  MAINNET_FEE_CONFIG_BUMP,
  MAINNET_FEE_CONFIG_DATA_BASE64,
  MAINNET_FEE_TIERS,
  MAINNET_FLAT_FEES,
  MAINNET_STABLE_FEE_TIERS,
} from "./feeConfigMainnetFixture";

// Hand-rolled borsh encoding of `FeeConfig`, independent of the Anchor coder under test (whose
// encoder is also capped at 1000 bytes, far below a real 4073/4097-byte account).
const FEE_CONFIG_DISCRIMINATOR = Buffer.from(
  pumpAmmJson.accounts.find((account) => account.name === "FeeConfig")!
    .discriminator,
);
// Where `fee_tiers` starts: discriminator (8) + bump (1) + admin (32) + flat_fees (24).
const FEE_TIERS_OFFSET = 8 + 1 + 32 + 24;

function u64(value: BN): Buffer {
  return value.toArrayLike(Buffer, "le", 8);
}

function encodeFees(fees: Fees): Buffer {
  return Buffer.concat([
    u64(fees.lpFeeBps),
    u64(fees.protocolFeeBps),
    u64(fees.creatorFeeBps),
  ]);
}

function encodeFeeTiers(tiers: FeeTier[]): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32LE(tiers.length);
  return Buffer.concat([
    length,
    ...tiers.map((tier) =>
      Buffer.concat([
        tier.marketCapLamportsThreshold.toArrayLike(Buffer, "le", 16),
        encodeFees(tier.fees),
      ]),
    ),
  ]);
}

// The fields every layout version shares: discriminator, bump, admin, flat_fees, fee_tiers.
function encodePreStableFields(config: FeeConfig): Buffer {
  return Buffer.concat([
    FEE_CONFIG_DISCRIMINATOR,
    Buffer.from([255]),
    config.admin.toBuffer(),
    encodeFees(config.flatFees),
    encodeFeeTiers(config.feeTiers),
  ]);
}

function encodeFeeConfig(config: FeeConfig): Buffer {
  return Buffer.concat([
    encodePreStableFields(config),
    encodeFeeTiers(config.stableFeeTiers),
    encodeFees(config.exoticFlatFees),
  ]);
}

function zeroPad(data: Buffer, size: number): Buffer {
  if (data.length > size) {
    throw new Error(`fixture is ${data.length} bytes, larger than ${size}`);
  }
  return Buffer.concat([data, Buffer.alloc(size - data.length)]);
}

function accountInfo(data: Buffer): AccountInfo<Buffer> {
  return { data, executable: false, lamports: 0, owner: PUMP_FEE_PROGRAM_ID };
}

function fees(lp: number, protocol: number, creator: number): Fees {
  return {
    lpFeeBps: new BN(lp),
    protocolFeeBps: new BN(protocol),
    creatorFeeBps: new BN(creator),
  };
}

function feeTiers(count: number, thresholdStep: number): FeeTier[] {
  return Array.from({ length: count }, (_, i) => ({
    marketCapLamportsThreshold: new BN(thresholdStep).muln(i),
    fees: fees(20 + i, 5, count - i),
  }));
}

function expectFees(actual: Fees, expected: Fees) {
  expect([
    actual.lpFeeBps.toString(),
    actual.protocolFeeBps.toString(),
    actual.creatorFeeBps.toString(),
  ]).to.deep.equal([
    expected.lpFeeBps.toString(),
    expected.protocolFeeBps.toString(),
    expected.creatorFeeBps.toString(),
  ]);
}

function feesRow(fees: Fees): [string, string, string] {
  return [
    fees.lpFeeBps.toString(),
    fees.protocolFeeBps.toString(),
    fees.creatorFeeBps.toString(),
  ];
}

function tierRows(tiers: FeeTier[]): FeeTierRow[] {
  return tiers.map((tier) => [
    tier.marketCapLamportsThreshold.toString(),
    ...feesRow(tier.fees),
  ]);
}

function expectFeeTiers(actual: FeeTier[], expected: FeeTier[]) {
  expect(
    actual.map((tier) => tier.marketCapLamportsThreshold.toString()),
  ).to.deep.equal(
    expected.map((tier) => tier.marketCapLamportsThreshold.toString()),
  );
  actual.forEach((tier, i) => expectFees(tier.fees, expected[i].fees));
}

describe("decodeFeeConfig", () => {
  const config: FeeConfig = {
    admin: PublicKey.unique(),
    flatFees: fees(25, 5, 0),
    feeTiers: feeTiers(25, 420_000_000_000),
    stableFeeTiers: feeTiers(25, 59_000_000_000),
    exoticFlatFees: fees(30, 15, 5),
  };
  const full = encodeFeeConfig(config);

  function decode(data: Buffer): FeeConfig {
    return PUMP_AMM_SDK.decodeFeeConfig(accountInfo(data));
  }

  function expectSharedFields(decoded: FeeConfig) {
    expect(decoded.admin.equals(config.admin)).to.be.true;
    expectFees(decoded.flatFees, config.flatFees);
    expectFeeTiers(decoded.feeTiers, config.feeTiers);
  }

  it("pre-stable account (2512 bytes): no stable tiers, exotic flat fees zero", () => {
    const decoded = decode(
      zeroPad(encodePreStableFields(config), FEE_CONFIG_SIZE_PRE_STABLE),
    );
    expectSharedFields(decoded);
    expect(decoded.stableFeeTiers).to.deep.equal([]);
    expectFees(decoded.exoticFlatFees, ZERO_FEES);
  });

  it("pre-stable account ignores stale bytes after fee_tiers", () => {
    // Bytes a shrunken vector leaves behind: they look like one more tier vector and a Fees.
    const stale = Buffer.concat([
      encodeFeeTiers([config.feeTiers[0]]),
      encodeFees(fees(7, 7, 7)),
    ]);
    const decoded = decode(
      zeroPad(
        Buffer.concat([encodePreStableFields(config), stale]),
        FEE_CONFIG_SIZE_PRE_STABLE,
      ),
    );
    expectSharedFields(decoded);
    expect(decoded.stableFeeTiers).to.deep.equal([]);
    expectFees(decoded.exoticFlatFees, ZERO_FEES);
  });

  it("post-stable account (4073 bytes): stable tiers decoded, exotic zero even with non-zero bytes after the stable vec", () => {
    const decoded = decode(
      zeroPad(
        Buffer.concat([
          encodePreStableFields(config),
          encodeFeeTiers(config.stableFeeTiers),
          encodeFees(fees(9, 9, 9)),
        ]),
        FEE_CONFIG_SIZE_POST_STABLE,
      ),
    );
    expectSharedFields(decoded);
    expectFeeTiers(decoded.stableFeeTiers, config.stableFeeTiers);
    expectFees(decoded.exoticFlatFees, ZERO_FEES);
  });

  it("post-exotic account (4097 bytes): exotic flat fees decoded", () => {
    const decoded = decode(zeroPad(full, FEE_CONFIG_SIZE_POST_EXOTIC));
    expectSharedFields(decoded);
    expectFeeTiers(decoded.stableFeeTiers, config.stableFeeTiers);
    expectFees(decoded.exoticFlatFees, config.exoticFlatFees);
  });

  it("a full account with 50 + 50 tiers is exactly 4097 bytes", () => {
    const maxed: FeeConfig = {
      ...config,
      feeTiers: feeTiers(50, 420_000_000_000),
      stableFeeTiers: feeTiers(50, 59_000_000_000),
    };
    const data = encodeFeeConfig(maxed);
    expect(data.length).to.equal(FEE_CONFIG_SIZE_POST_EXOTIC);
    const decoded = decode(data);
    expectFeeTiers(decoded.feeTiers, maxed.feeTiers);
    expectFeeTiers(decoded.stableFeeTiers, maxed.stableFeeTiers);
    expectFees(decoded.exoticFlatFees, maxed.exoticFlatFees);
  });

  it("an account longer than 4097 bytes decodes as post-exotic", () => {
    const decoded = decode(zeroPad(full, FEE_CONFIG_SIZE_POST_EXOTIC + 103));
    expectFeeTiers(decoded.stableFeeTiers, config.stableFeeTiers);
    expectFees(decoded.exoticFlatFees, config.exoticFlatFees);
  });

  it("the account length, not the bytes present, selects the layout version", () => {
    // Same bytes, four lengths straddling the two version boundaries.
    const oneShortOfStable = decode(
      zeroPad(full, FEE_CONFIG_SIZE_POST_STABLE - 1),
    );
    expect(oneShortOfStable.stableFeeTiers).to.deep.equal([]);
    expectFees(oneShortOfStable.exoticFlatFees, ZERO_FEES);

    const postStable = decode(zeroPad(full, FEE_CONFIG_SIZE_POST_STABLE));
    expectFeeTiers(postStable.stableFeeTiers, config.stableFeeTiers);
    expectFees(postStable.exoticFlatFees, ZERO_FEES);

    const oneShortOfExotic = decode(
      zeroPad(full, FEE_CONFIG_SIZE_POST_EXOTIC - 1),
    );
    expectFeeTiers(oneShortOfExotic.stableFeeTiers, config.stableFeeTiers);
    expectFees(oneShortOfExotic.exoticFlatFees, ZERO_FEES);

    const postExotic = decode(zeroPad(full, FEE_CONFIG_SIZE_POST_EXOTIC));
    expectFees(postExotic.exoticFlatFees, config.exoticFlatFees);
  });

  it("rejects accounts shorter than 2512 bytes", () => {
    expect(() =>
      decode(
        zeroPad(encodePreStableFields(config), FEE_CONFIG_SIZE_PRE_STABLE - 1),
      ),
    ).to.throw(/at least 2512/);
  });

  it("rejects a fee tier vector that runs past the account data", () => {
    const prefix = encodePreStableFields(config);
    const claimedLength = Buffer.alloc(4);
    claimedLength.writeUInt32LE(100);
    claimedLength.copy(prefix, FEE_TIERS_OFFSET);
    expect(() => decode(zeroPad(prefix, FEE_CONFIG_SIZE_PRE_STABLE))).to.throw(
      /runs past the account data/,
    );
  });

  it("rejects a fee tier vector whose successor's length prefix would run past the account data", () => {
    // fee_tiers claims 101 tiers, so it ends at 65 + 4 + 101 * 40 = 4109 and only one byte is left
    // for the stable vector's u32 length prefix in a 4110-byte account. Without an explicit check
    // that read surfaces as a raw Node RangeError instead of the descriptive error.
    const prefix = encodePreStableFields(config);
    const claimedLength = Buffer.alloc(4);
    claimedLength.writeUInt32LE(101);
    claimedLength.copy(prefix, FEE_TIERS_OFFSET);
    expect(() => decode(zeroPad(prefix, 4110))).to.throw(
      /vector length at offset 4109 runs past the account data \(4110 bytes\)/,
    );
  });

  it("rejects a wrong discriminator", () => {
    const data = zeroPad(full, FEE_CONFIG_SIZE_POST_EXOTIC);
    data[0] ^= 0xff;
    expect(() => decode(data)).to.throw(/discriminator/);
  });

  it("decodes the live mainnet pump-amm FeeConfig (4073 bytes: 25 fee tiers, 25 stable tiers, exotic unset)", () => {
    expect(
      new PublicKey(MAINNET_FEE_CONFIG_ACCOUNT).equals(PUMP_AMM_FEE_CONFIG_PDA),
    ).to.be.true;
    const data = Buffer.from(MAINNET_FEE_CONFIG_DATA_BASE64, "base64");
    expect(data.length).to.equal(FEE_CONFIG_SIZE_POST_STABLE);

    const decoded = decode(data);
    // Every field the program reads, pinned against an independent parse of the same bytes
    // (see the fixture). `bump` is decoded but not on the TS `FeeConfig` type (pre-existing).
    expect((decoded as unknown as { bump: number }).bump).to.equal(
      MAINNET_FEE_CONFIG_BUMP,
    );
    expect(decoded.admin.toBase58()).to.equal(MAINNET_FEE_CONFIG_ADMIN);
    expect(feesRow(decoded.flatFees)).to.deep.equal(MAINNET_FLAT_FEES);
    expect(tierRows(decoded.feeTiers)).to.deep.equal(MAINNET_FEE_TIERS);
    expect(tierRows(decoded.stableFeeTiers)).to.deep.equal(
      MAINNET_STABLE_FEE_TIERS,
    );
    expectFees(decoded.exoticFlatFees, ZERO_FEES);

    // SOL tiers are keyed in lamports, stable tiers in USDC base units: 25 ranks each with the
    // same fee values per rank but thresholds roughly 7x apart (0 / 420e9 / 1470e9 lamports vs
    // 0 / 59e9 / 300e9 USDC units), which is why the schedule must be picked by quote mint.
    expect(decoded.feeTiers).to.have.length(25);
    expect(decoded.stableFeeTiers).to.have.length(25);
    decoded.feeTiers.forEach((tier, i) =>
      expectFees(tier.fees, decoded.stableFeeTiers[i].fees),
    );
  });
});

describe("vendored pump-amm IDL", () => {
  // Only the parts of an IDL type definition these checks read.
  interface IdlTypeDef {
    name: string;
    type: { kind: string; fields?: Array<string | { name: string }> };
  }
  const idlTypes = pumpAmmJson.types as IdlTypeDef[];

  function fieldNames(typeName: string): string[] {
    const type = idlTypes.find((t) => t.name === typeName)!.type;
    return (type.fields ?? []).map((field) =>
      typeof field === "string" ? field : field.name,
    );
  }

  it("carries the quote-control additions", () => {
    expect(pumpAmmJson.instructions.map((ix) => ix.name)).to.include(
      "transfer_creator_fees_to_pump_v2",
    );
    expect(fieldNames("FeeConfig")).to.deep.equal([
      "bump",
      "admin",
      "flat_fees",
      "fee_tiers",
      "stable_fee_tiers",
      "exotic_flat_fees",
    ]);
    const setBoostAuthority = pumpAmmJson.instructions.find(
      (ix) => ix.name === "set_boost_authority",
    )!;
    expect(
      setBoostAuthority.accounts.map((account) => account.name),
    ).to.include("system_program");
    expect(
      pumpAmmJson.errors.find((error) => error.code === 6067)?.name,
    ).to.equal("SeedLockViolation");
    for (const event of ["BuyEvent", "SellEvent"]) {
      const fields = fieldNames(event);
      expect(fields, event).to.include("base_supply");
    }
  });

  it("carries the configurable-creator-fee additions, with the setters replaced by the CTO", () => {
    const instructionNames = pumpAmmJson.instructions.map((ix) => ix.name);
    for (const name of ["update_creator_fee_config", "admin_cto_pool"]) {
      expect(instructionNames).to.include(name);
    }
    for (const name of [
      "set_coin_creator_fee_bps",
      "admin_set_coin_creator_fee_editable",
      "admin_set_coin_creator",
    ]) {
      expect(instructionNames).to.not.include(name);
    }
    expect(fieldNames("Pool").slice(-5, -2)).to.deep.equal([
      "creator_fee_bps",
      "can_edit_creator_fee",
      "is_holder_reward",
    ]);
    expect(fieldNames("GlobalConfig").slice(-2)).to.deep.equal([
      "creator_fee_configurable",
      "max_configurable_creator_fee_bps",
    ]);
    expect(fieldNames("CreatePoolEvent").slice(-3)).to.deep.equal([
      "creator_fee_bps",
      "can_edit_creator_fee",
      "is_holder_reward",
    ]);
    for (const event of ["BuyEvent", "SellEvent"]) {
      expect(fieldNames(event).slice(-4, -1), event).to.deep.equal([
        "base_supply",
        "holder_rewards_bps",
        "holder_rewards",
      ]);
    }
    // `OptionU64` is a one-field tuple struct like `OptionBool`: 8 LE bytes, EOF-tolerant on-chain.
    expect(idlTypes.find((t) => t.name === "OptionU64")!.type).to.deep.equal({
      kind: "struct",
      fields: ["u64"],
    });
    const createPool = pumpAmmJson.instructions.find(
      (ix) => ix.name === "create_pool",
    )!;
    expect(
      createPool.args.slice(-4).map((arg) => [arg.name, arg.type]),
    ).to.deep.equal([
      ["is_cashback_coin", { defined: { name: "OptionBool" } }],
      ["creator_fee_bps", { defined: { name: "OptionU64" } }],
      ["can_edit_creator_fee", { defined: { name: "OptionBool" } }],
      ["is_holder_reward", { defined: { name: "OptionBool" } }],
    ]);
    const adminCtoPool = pumpAmmJson.instructions.find(
      (ix) => ix.name === "admin_cto_pool",
    )!;
    expect(adminCtoPool.args.map((arg) => [arg.name, arg.type])).to.deep.equal([
      ["coin_creator", "pubkey"],
      ["is_holder_reward", "bool"],
      ["creator_fee_bps", { option: "u64" }],
    ]);
    // Only pump's pool-authority PDA may call it.
    expect(
      adminCtoPool.accounts.find(
        (account) => account.name === "pool_authority",
      ),
    ).to.include({ signer: true });
    const extendAccount = pumpAmmJson.instructions.find(
      (ix) => ix.name === "extend_account",
    )!;
    expect(
      extendAccount.accounts.find((account) => account.name === "user"),
    ).to.include({ writable: true, signer: true });
    expect(
      pumpAmmJson.errors
        .filter((error) => error.code >= 6068 && error.code <= 6077)
        .map((error) => [error.code, error.name]),
    ).to.deep.equal([
      [6068, "CreatorFeeNotConfigurable"],
      [6069, "CreatorFeeBpsOutOfRange"],
      [6070, "CreatorFeeNotEditable"],
      [6071, "CreatorFeeNotAllowedForCashbackCoin"],
      [6072, "SharingConfigNotActive"],
      [6073, "NotAuthorized"],
      [6074, "HolderRewardCreatorImmutable"],
      [6075, "CtoNotAllowedForMayhemPool"],
      [6076, "InvalidHolderRewardCoinCreator"],
      [6077, "CreatorFeeNotConfigurableForQuote"],
    ]);
    const eventNames = pumpAmmJson.events.map((event) => event.name);
    for (const name of ["UpdateCreatorFeeConfigEvent", "AdminCtoPoolEvent"]) {
      expect(eventNames).to.include(name);
    }
    for (const name of [
      "SetCoinCreatorFeeBpsEvent",
      "AdminSetCoinCreatorFeeEditableEvent",
      "AdminSetCoinCreatorEvent",
    ]) {
      expect(eventNames).to.not.include(name);
    }
  });

  it("carries the v2 trades and the fee sweeps, with no buyback bucket", () => {
    const instructionNames = pumpAmmJson.instructions.map((ix) => ix.name);
    for (const name of [
      "buy_v2",
      "buy_exact_quote_in_v2",
      "sell_v2",
      "sweep_protocol_fee",
      "sweep_creator_fee",
    ]) {
      expect(instructionNames).to.include(name);
    }
    expect(instructionNames).to.not.include("sweep_buyback_fee");
    expect(fieldNames("Pool").slice(-2)).to.deep.equal([
      "protocol_fees",
      "creator_fees",
    ]);
    for (const event of ["BuyEvent", "SellEvent"]) {
      expect(fieldNames(event).slice(-1), event).to.deep.equal([
        "creator_fee_unclaimed",
      ]);
    }

    const tradeAccounts = [
      "pool",
      "user",
      "global_config",
      "base_mint",
      "quote_mint",
      "user_base_token_account",
      "user_quote_token_account",
      "pool_base_token_account",
      "pool_quote_token_account",
      "base_token_program",
      "quote_token_program",
      "system_program",
      "user_volume_accumulator",
      "fee_config",
      "buyback_fee_recipient",
      "event_authority",
      "program",
    ];
    for (const [name, args] of [
      ["buy_v2", ["base_amount_out", "max_quote_amount_in"]],
      ["buy_exact_quote_in_v2", ["spendable_quote_in", "min_base_amount_out"]],
      ["sell_v2", ["base_amount_in", "min_quote_amount_out"]],
    ] as const) {
      const ix = pumpAmmJson.instructions.find((ix) => ix.name === name)!;
      expect(
        ix.accounts.map((account) => account.name),
        name,
      ).to.deep.equal(tradeAccounts);
      expect(ix.accounts[14], name).to.include({ writable: true });
      expect(
        ix.args.map((arg) => [arg.name, arg.type]),
        name,
      ).to.deep.equal(args.map((arg) => [arg, "u64"]));
    }
    for (const name of ["sweep_protocol_fee", "sweep_creator_fee"]) {
      const ix = pumpAmmJson.instructions.find((ix) => ix.name === name)!;
      expect(ix.args, name).to.deep.equal([]);
      expect(
        ix.accounts.map((account) => account.name),
        name,
      ).to.deep.equal([
        "payer",
        "global_config",
        "pool",
        "quote_mint",
        "quote_token_program",
        "pool_quote_token_account",
        "recipient",
        "recipient_token_account",
        "system_program",
        "associated_token_program",
        "event_authority",
        "program",
      ]);
    }

    expect(
      pumpAmmJson.errors
        .filter((error) => error.code >= 6078)
        .map((error) => [error.code, error.name]),
    ).to.deep.equal([
      [6078, "OnlyPumpPools"],
      [6079, "CashbackCoinNotSupported"],
      [6080, "MayhemPoolNotSupported"],
      [6081, "CreatorFeesNotSwept"],
      [6082, "FeeTiersEmpty"],
      [6083, "FeeConfigTooShort"],
      [6084, "MultiHopDiscontinuousPath"],
      [6085, "MultiHopCurveRunMismatch"],
      [6086, "MultiHopMixedDirection"],
      [6087, "SelfTransferNotAllowed"],
    ]);
    const multiHop = pumpAmmJson.instructions.find(
      (ix) => ix.name === "multi_hop_swap",
    )!;
    expect(multiHop.args.map((arg) => [arg.name, arg.type])).to.deep.equal([
      ["amount_in", "u64"],
      ["min_amount_out", "u64"],
    ]);
    expect(multiHop.accounts.map((account) => account.name)).to.deep.equal([
      "user",
      "user_in_token_account",
      "user_out_token_account",
      "global_config",
      "fee_config",
      "user_volume_accumulator",
      "buyback_fee_recipient",
      "token_program",
      "token_2022_program",
      "system_program",
      "event_authority",
      "program",
      "pump_program",
      "pump_global",
      "pump_fee_config",
      "pump_event_authority",
    ]);
    expect(fieldNames("SweepPoolFeeEvent")).to.deep.equal([
      "timestamp",
      "pool",
      "base_mint",
      "quote_mint",
      "recipient",
      "payer",
      "amount",
      "bucket",
    ]);
  });

  it("is the IDL the offline program was built from", () => {
    expect(OFFLINE_PUMP_AMM_PROGRAM.programId.toBase58()).to.equal(
      pumpAmmJson.address,
    );
    expect(OFFLINE_PUMP_AMM_PROGRAM.idl.instructions).to.have.length(
      pumpAmmJson.instructions.length,
    );
  });
});

describe("BuyEvent decoding", () => {
  const coder = OFFLINE_PUMP_AMM_PROGRAM.coder;
  const discriminator = Buffer.from(
    pumpAmmJson.events.find((event) => event.name === "BuyEvent")!
      .discriminator,
  );
  const buyEvent = {
    timestamp: new BN(1_700_000_000),
    baseAmountOut: new BN(1),
    maxQuoteAmountIn: new BN(2),
    userBaseTokenReserves: new BN(3),
    userQuoteTokenReserves: new BN(4),
    poolBaseTokenReserves: new BN(5),
    poolQuoteTokenReserves: new BN(6),
    quoteAmountIn: new BN(7),
    lpFeeBasisPoints: new BN(8),
    lpFee: new BN(9),
    protocolFeeBasisPoints: new BN(10),
    protocolFee: new BN(11),
    quoteAmountInWithLpFee: new BN(12),
    userQuoteAmountIn: new BN(13),
    pool: PublicKey.unique(),
    user: PublicKey.unique(),
    userBaseTokenAccount: PublicKey.unique(),
    userQuoteTokenAccount: PublicKey.unique(),
    protocolFeeRecipient: PublicKey.unique(),
    protocolFeeRecipientTokenAccount: PublicKey.unique(),
    coinCreator: PublicKey.unique(),
    coinCreatorFeeBasisPoints: new BN(14),
    coinCreatorFee: new BN(15),
    trackVolume: true,
    totalUnclaimedTokens: new BN(16),
    totalClaimedTokens: new BN(17),
    currentSolVolume: new BN(18),
    lastUpdateTimestamp: new BN(19),
    minBaseAmountOut: new BN(20),
    ixName: "buy",
    cashbackFeeBasisPoints: new BN(21),
    cashback: new BN(22),
    buybackFeeBasisPoints: new BN(23),
    buybackFee: new BN(24),
    virtualQuoteReserves: new BN(-25),
    canBoost: true,
    baseSupply: new BN(1_000_000_000_000_000),
    holderRewardsBps: new BN(26),
    holderRewards: new BN(27),
    creatorFeeUnclaimed: new BN(28),
  };
  const log = Buffer.concat([
    discriminator,
    coder.types.encode("buyEvent", buyEvent),
  ]);

  function decodeLog(data: Buffer) {
    const decoded = coder.events.decode(data.toString("base64"));
    expect(decoded).to.not.be.null;
    return {
      name: decoded!.name,
      data: decoded!.data as unknown as {
        baseAmountOut: BN;
        virtualQuoteReserves: BN;
        baseSupply: BN;
        holderRewardsBps: BN;
        holderRewards: BN;
        creatorFeeUnclaimed: BN;
      },
    };
  }

  it("decodes base_supply and the holder-reward fields from a current log", () => {
    const { name, data } = decodeLog(log);
    expect(name).to.equal("buyEvent");
    expect(data.baseAmountOut.toString()).to.equal("1");
    expect(data.virtualQuoteReserves.toString()).to.equal("-25");
    expect(data.baseSupply.toString()).to.equal("1000000000000000");
    expect(data.holderRewardsBps.toString()).to.equal("26");
    expect(data.holderRewards.toString()).to.equal("27");
    expect(data.creatorFeeUnclaimed.toString()).to.equal("28");
  });

  it("decodes a log emitted before creator_fee_unclaimed existed with it 0", () => {
    // One u64 shorter. @coral-xyz/borsh reads a u64 past the end of the buffer as 0 rather than
    // throwing, so older logs decode with the field at 0.
    const { data } = decodeLog(log.subarray(0, log.length - 8));
    expect(data.holderRewards.toString()).to.equal("27");
    expect(data.creatorFeeUnclaimed.toString()).to.equal("0");
  });

  it("decodes a log emitted before the holder-reward fields existed with both 0", () => {
    // Three u64 shorter (the holder-reward pair and creator_fee_unclaimed).
    const { data } = decodeLog(log.subarray(0, log.length - 24));
    expect(data.baseSupply.toString()).to.equal("1000000000000000");
    expect(data.holderRewardsBps.toString()).to.equal("0");
    expect(data.holderRewards.toString()).to.equal("0");
  });

  it("decodes a log emitted before base_supply existed with baseSupply 0", () => {
    // Four u64 shorter; the same past-the-end read applies, so consumers must treat 0 as "not
    // reported", never as a real supply.
    const { data } = decodeLog(log.subarray(0, log.length - 32));
    expect(data.baseAmountOut.toString()).to.equal("1");
    expect(data.virtualQuoteReserves.toString()).to.equal("-25");
    expect(data.baseSupply.toString()).to.equal("0");
  });
});
