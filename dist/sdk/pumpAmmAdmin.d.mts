import BN from 'bn.js';
import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';

declare class PumpAmmAdminSdk {
    private readonly program;
    constructor(connection: Connection);
    fetchGlobalConfigAccount(): Promise<{
        admin: PublicKey;
        lpFeeBasisPoints: BN;
        protocolFeeBasisPoints: BN;
        disableFlags: number;
        protocolFeeRecipients: PublicKey[];
        coinCreatorFeeBasisPoints: BN;
        adminSetCoinCreatorAuthority: PublicKey;
        whitelistPda: PublicKey;
        reservedFeeRecipient: PublicKey;
        mayhemModeEnabled: boolean;
        reservedFeeRecipients: PublicKey[];
        isCashbackEnabled: boolean;
    }>;
    createConfig(lpFeeBasisPoints: BN, protocolFeeBasisPoints: BN, protocolFeeRecipients: PublicKey[], coinCreatorFeeBasisPoints: BN, admin: PublicKey, adminSetCoinCreatorAuthority: PublicKey): Promise<TransactionInstruction>;
    disable(disableCreatePool: boolean, disableDeposit: boolean, disableWithdraw: boolean, disableBuy: boolean, disableSell: boolean, admin: PublicKey): Promise<TransactionInstruction>;
    updateAdmin(admin: PublicKey, newAdmin: PublicKey): Promise<TransactionInstruction>;
    updateFeeConfig(lpFeeBasisPoints: BN, protocolFeeBasisPoints: BN, protocolFeeRecipients: PublicKey[], coinCreatorFeeBasisPoints: BN, admin: PublicKey, adminSetCoinCreatorAuthority: PublicKey): Promise<TransactionInstruction>;
    adminSetCoinCreator(mint: PublicKey, newCoinCreator: PublicKey): Promise<TransactionInstruction>;
    adminUpdateTokenIncentives(startTime: BN, endTime: BN, dayNumber: BN, tokenSupplyPerDay: BN, secondsInADay?: BN, mint?: PublicKey, tokenProgram?: PublicKey): Promise<TransactionInstruction>;
}

export { PumpAmmAdminSdk };
