import BN from 'bn.js';
import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { G as GlobalConfig } from '../sdk-CtXcjwA6.js';
import '@solana/spl-token';

declare class PumpAmmAdminSdk {
    private readonly connection;
    private readonly program;
    constructor(connection: Connection);
    /**
     * Decoded through `PumpAmmSdk.decodeGlobalConfig`, which zero-pads shorter (pre-upgrade)
     * accounts: Anchor's own `fetch` throws on the live 940-byte account once the IDL carries the
     * creator-fee fields.
     */
    fetchGlobalConfigAccount(): Promise<GlobalConfig>;
    createConfig(lpFeeBasisPoints: BN, protocolFeeBasisPoints: BN, protocolFeeRecipients: PublicKey[], coinCreatorFeeBasisPoints: BN, admin: PublicKey, adminSetCoinCreatorAuthority: PublicKey): Promise<TransactionInstruction>;
    disable(disableCreatePool: boolean, disableDeposit: boolean, disableWithdraw: boolean, disableBuy: boolean, disableSell: boolean, admin: PublicKey): Promise<TransactionInstruction>;
    updateAdmin(admin: PublicKey, newAdmin: PublicKey): Promise<TransactionInstruction>;
    updateFeeConfig(lpFeeBasisPoints: BN, protocolFeeBasisPoints: BN, protocolFeeRecipients: PublicKey[], coinCreatorFeeBasisPoints: BN, admin: PublicKey, adminSetCoinCreatorAuthority: PublicKey): Promise<TransactionInstruction>;
    /**
     * Turns per-pool creator fees on or off and sets the ceiling a CTO (pump `admin_cto`, which
     * drives `admin_cto_pool`) accepts. Signed by `GlobalConfig.admin` (read from the account), who also pays the rent that
     * grows a pre-upgrade 940-byte GlobalConfig to `GLOBAL_CONFIG_SIZE` bytes, so it is the first
     * instruction to run after the program upgrade. While the gate is off, stored per-pool rates are
     * neither accepted by a CTO nor read by trades. The coin creator of a canonical pool changes only
     * through pump's `admin_cto`: pump-amm's `admin_cto_pool` accepts pump's pool-authority PDA as
     * its only caller, so this SDK has no builder for it.
     */
    updateCreatorFeeConfig(creatorFeeConfigurable: boolean, maxConfigurableCreatorFeeBps: BN): Promise<TransactionInstruction>;
    adminUpdateTokenIncentives(startTime: BN, endTime: BN, dayNumber: BN, tokenSupplyPerDay: BN, secondsInADay?: BN, mint?: PublicKey, tokenProgram?: PublicKey): Promise<TransactionInstruction>;
}

export { PumpAmmAdminSdk };
