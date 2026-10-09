import { Program } from "@coral-xyz/anchor";
import BN from "bn.js";
import { PumpAmm } from "../types/pump_amm";
import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { GLOBAL_CONFIG_PDA, PUMP_MINT } from "./pda";
import { getPumpAmmProgram } from "./util";
import { PUMP_AMM_SDK } from "./offlinePumpAmm";
import { GlobalConfig } from "../types/sdk";

export class PumpAmmAdminSdk {
  private readonly connection: Connection;
  private readonly program: Program<PumpAmm>;

  constructor(connection: Connection) {
    this.connection = connection;
    this.program = getPumpAmmProgram(connection);
  }

  /**
   * Decoded through `PumpAmmSdk.decodeGlobalConfig`, which zero-pads shorter (pre-upgrade)
   * accounts: Anchor's own `fetch` throws on the live 940-byte account once the IDL carries the
   * creator-fee fields.
   */
  async fetchGlobalConfigAccount(): Promise<GlobalConfig> {
    const accountInfo = await this.connection.getAccountInfo(GLOBAL_CONFIG_PDA);
    if (accountInfo === null) {
      throw new Error("Global config account not found");
    }
    return PUMP_AMM_SDK.decodeGlobalConfig(accountInfo);
  }

  createConfig(
    lpFeeBasisPoints: BN,
    protocolFeeBasisPoints: BN,
    protocolFeeRecipients: PublicKey[],
    coinCreatorFeeBasisPoints: BN,
    admin: PublicKey,
    adminSetCoinCreatorAuthority: PublicKey,
  ): Promise<TransactionInstruction> {
    return this.program.methods
      .createConfig(
        lpFeeBasisPoints,
        protocolFeeBasisPoints,
        protocolFeeRecipients,
        coinCreatorFeeBasisPoints,
        adminSetCoinCreatorAuthority,
      )
      .accountsPartial({
        admin,
      })
      .instruction();
  }

  disable(
    disableCreatePool: boolean,
    disableDeposit: boolean,
    disableWithdraw: boolean,
    disableBuy: boolean,
    disableSell: boolean,
    admin: PublicKey,
  ): Promise<TransactionInstruction> {
    return this.program.methods
      .disable(
        disableCreatePool,
        disableDeposit,
        disableWithdraw,
        disableBuy,
        disableSell,
      )
      .accountsPartial({
        admin,
        globalConfig: GLOBAL_CONFIG_PDA,
      })
      .instruction();
  }

  updateAdmin(
    admin: PublicKey,
    newAdmin: PublicKey,
  ): Promise<TransactionInstruction> {
    return this.program.methods
      .updateAdmin()
      .accountsPartial({
        admin,
        newAdmin,
        globalConfig: GLOBAL_CONFIG_PDA,
      })
      .instruction();
  }

  updateFeeConfig(
    lpFeeBasisPoints: BN,
    protocolFeeBasisPoints: BN,
    protocolFeeRecipients: PublicKey[],
    coinCreatorFeeBasisPoints: BN,
    admin: PublicKey,
    adminSetCoinCreatorAuthority: PublicKey,
  ): Promise<TransactionInstruction> {
    return this.program.methods
      .updateFeeConfig(
        lpFeeBasisPoints,
        protocolFeeBasisPoints,
        protocolFeeRecipients,
        coinCreatorFeeBasisPoints,
        adminSetCoinCreatorAuthority,
      )
      .accountsPartial({
        admin,
        globalConfig: GLOBAL_CONFIG_PDA,
      })
      .instruction();
  }

  /**
   * Turns per-pool creator fees on or off and sets the ceiling a CTO (pump `admin_cto`, which
   * drives `admin_cto_pool`) accepts. Signed by `GlobalConfig.admin` (read from the account), who also pays the rent that
   * grows a pre-upgrade 940-byte GlobalConfig to `GLOBAL_CONFIG_SIZE` bytes, so it is the first
   * instruction to run after the program upgrade. While the gate is off, stored per-pool rates are
   * neither accepted by a CTO nor read by trades. The coin creator of a canonical pool changes only
   * through pump's `admin_cto`: pump-amm's `admin_cto_pool` accepts pump's pool-authority PDA as
   * its only caller, so this SDK has no builder for it.
   */
  async updateCreatorFeeConfig(
    creatorFeeConfigurable: boolean,
    maxConfigurableCreatorFeeBps: BN,
  ): Promise<TransactionInstruction> {
    const { admin } = await this.fetchGlobalConfigAccount();

    return this.program.methods
      .updateCreatorFeeConfig(
        creatorFeeConfigurable,
        maxConfigurableCreatorFeeBps,
      )
      .accountsPartial({
        admin,
        globalConfig: GLOBAL_CONFIG_PDA,
      })
      .instruction();
  }

  async adminUpdateTokenIncentives(
    startTime: BN,
    endTime: BN,
    dayNumber: BN,
    tokenSupplyPerDay: BN,
    secondsInADay: BN = new BN(86400),
    mint: PublicKey = PUMP_MINT,
    tokenProgram: PublicKey = TOKEN_2022_PROGRAM_ID,
  ): Promise<TransactionInstruction> {
    const { admin } = await this.fetchGlobalConfigAccount();

    return this.program.methods
      .adminUpdateTokenIncentives(
        startTime,
        endTime,
        secondsInADay,
        dayNumber,
        tokenSupplyPerDay,
      )
      .accountsPartial({
        admin,
        mint,
        tokenProgram,
      })
      .instruction();
  }
}
