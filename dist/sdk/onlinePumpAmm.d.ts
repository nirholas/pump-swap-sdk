import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { G as GlobalConfig, F as FeeConfig, P as Pool, k as GlobalVolumeAccumulator, U as UserVolumeAccumulator, c as CreatePoolSolanaState, o as SwapSolanaState, l as LiquiditySolanaState, C as CollectCoinCreatorFeeSolanaState } from '../sdk-CtXcjwA6.js';
import BN from 'bn.js';
import { MultiHopPoolQuoteHop } from './multiHop.js';
import '@solana/spl-token';

declare class OnlinePumpAmmSdk {
    readonly connection: Connection;
    private readonly program;
    constructor(connection: Connection);
    fetchGlobalConfigAccount(): Promise<GlobalConfig>;
    fetchFeeConfigAccount(): Promise<FeeConfig>;
    fetchPool(pool: PublicKey): Promise<Pool>;
    fetchGlobalVolumeAccumulator(): Promise<GlobalVolumeAccumulator>;
    fetchUserVolumeAccumulator(user: PublicKey): Promise<UserVolumeAccumulator | null>;
    createPoolSolanaState(index: number, creator: PublicKey, baseMint: PublicKey, quoteMint: PublicKey, userBaseTokenAccount?: PublicKey | undefined, userQuoteTokenAccount?: PublicKey | undefined): Promise<CreatePoolSolanaState>;
    swapSolanaState(poolKey: PublicKey, user: PublicKey, userBaseTokenAccount?: PublicKey | undefined, userQuoteTokenAccount?: PublicKey | undefined): Promise<SwapSolanaState>;
    swapSolanaStateNoPool(poolKey: PublicKey, user: PublicKey, userBaseTokenAccount?: PublicKey | undefined, userQuoteTokenAccount?: PublicKey | undefined): Promise<SwapSolanaState>;
    liquiditySolanaState(poolKey: PublicKey, user: PublicKey, userBaseTokenAccount?: PublicKey | undefined, userQuoteTokenAccount?: PublicKey | undefined, userPoolTokenAccount?: PublicKey | undefined): Promise<LiquiditySolanaState>;
    /**
     * The quote mint a creator vault is keyed by and the token program owning it. A bonding
     * curve's zero key (a SOL coin's `quote_mint`) is normalized to legacy WSOL, as
     * `canonicalPumpPoolPda` does. The program is `quoteTokenProgram` when given, SPL Token for
     * WSOL (no fetch), otherwise the mint account's owner, which must be SPL Token or Token-2022
     * (what the on-chain `quote_token_program` interface accepts), so an existing non-mint account
     * such as a wallet or the System Program can never be mistaken for a token program.
     */
    private resolveQuote;
    /**
     * Everything `PumpAmmSdk.collectCoinCreatorFee` needs to pay out the creator's AMM fees quoted
     * in `quoteMint` (WSOL by default; a bonding curve's zero key is accepted for SOL coins).
     * `quoteTokenProgram` is resolved from the mint when omitted. `coinCreatorTokenAccount`
     * defaults to the creator's ATA for the quote, the only destination the builder creates when
     * it is missing; any other destination must already exist.
     */
    collectCoinCreatorFeeSolanaState(coinCreator: PublicKey, coinCreatorTokenAccount?: PublicKey | undefined, quoteMint?: PublicKey, quoteTokenProgram?: PublicKey | undefined): Promise<CollectCoinCreatorFeeSolanaState>;
    /**
     * The creator's uncollected AMM fees quoted in `quoteMint` (WSOL by default; a bonding curve's
     * zero key is accepted for SOL coins): the balance of the creator vault ATA, or zero when it
     * does not exist. `quoteTokenProgram` is resolved from the mint when omitted.
     */
    getCoinCreatorVaultBalance(coinCreator: PublicKey, quoteMint?: PublicKey, quoteTokenProgram?: PublicKey | undefined): Promise<BN>;
    /**
     * The creator's uncollected AMM fees for every quote in `quotes`, keyed by the quote mint
     * (base58), in one account fetch per 100 quotes. Callers enumerating every quote mint a vault
     * may hold (the Global whitelist plus the QuoteControl list, plus WSOL) pass each mint with its
     * owner token program; a missing vault ATA reads as zero. Mints are used as given (no zero-key
     * normalization), so every entry lands under its own key.
     */
    getCoinCreatorVaultBalances(coinCreator: PublicKey, quotes: {
        mint: PublicKey;
        tokenProgram: PublicKey;
    }[]): Promise<Map<string, BN>>;
    /**
     * Token balance of a fetched vault ATA; zero when the account does not exist. `unpackAccount`
     * accepts the extension-bearing (170-182 byte) accounts Token-2022 quotes produce.
     */
    private vaultAtaBalance;
    /**
     * `PumpAmmSdk.transferCreatorFeesToPumpV2Instruction` with the quote token program resolved
     * from the mint account's owner; a bonding curve's zero key is accepted for SOL coins.
     */
    transferCreatorFeesToPumpV2Instruction(payer: PublicKey, coinCreator: PublicKey, quoteMint: PublicKey): Promise<TransactionInstruction>;
    /**
     * `PumpAmmSdk.setCoinCreator` for `poolKey`, with `metadata` and `bonding_curve` derived from
     * the pool's base mint (read with `decodePool`, so a pre-upgrade 261-byte pool works) and
     * preceded by `extend_account` (rent paid by `payer`) when the pool is shorter than
     * `POOL_ACCOUNT_NEW_SIZE`: the program writes the whole `Pool` back, which fails on an
     * un-grown account.
     */
    setCoinCreatorInstructions(poolKey: PublicKey, payer: PublicKey): Promise<TransactionInstruction[]>;
    /**
     * `PumpAmmSdk.sweepCreatorFeeInstruction` for `poolKey`, with the pool and its quote token
     * program read from chain: what a CTO, a fee-sharing config creation or an `update_fee_shares`
     * for the pool's coin must carry before it, in the same transaction.
     */
    sweepCreatorFeeInstruction(poolKey: PublicKey, payer: PublicKey): Promise<TransactionInstruction>;
    /**
     * Canonical pools as `multi_hop_swap` hops, in `poolKeys` order, with the state
     * `multiHopSwapQuote` prices them from (the pool, its mints' token programs, its vault balances,
     * the base mint supply) and the GlobalConfig / FeeConfig it needs. Two RPC round trips for any
     * route length; each hop is usable as a `PumpAmmSdk.multiHopSwapInstructions` venue as is.
     */
    multiHopPoolHops(poolKeys: PublicKey[]): Promise<{
        globalConfig: GlobalConfig;
        feeConfig: FeeConfig | null;
        hops: MultiHopPoolQuoteHop[];
    }>;
    boostBuyAndBurnInstruction(poolKey: PublicKey, authority: PublicKey, quoteAmountIn: BN, minBaseAmountBurned: BN): Promise<TransactionInstruction>;
    claimTokenIncentives(user: PublicKey, payer: PublicKey): Promise<TransactionInstruction[]>;
    getTotalUnclaimedTokens(user: PublicKey): Promise<BN>;
    getCurrentDayTokens(user: PublicKey): Promise<BN>;
}

export { OnlinePumpAmmSdk };
