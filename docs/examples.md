# pump-swap-sdk examples

Copy-paste snippets for `@pump-fun/pump-swap-sdk` 2.1.0 and the October 2026 PumpSwap program.
Every method named here is exported by the 2.1.0 package; the [README](../README.md) has the full
reference and the migration notes.

## Setup

```typescript
import { Connection, PublicKey } from "@solana/web3.js";
import {
  OnlinePumpAmmSdk,
  PUMP_AMM_SDK,
  supportsTradeV2,
} from "@pump-fun/pump-swap-sdk";

const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
const onlineSdk = new OnlinePumpAmmSdk(connection);

const poolKey = new PublicKey("<pool address>");
const user = new PublicKey("<wallet address>");
const swapSolanaState = await onlineSdk.swapSolanaState(poolKey, user);
```

## Buy and sell, preferring v2

`{ v2: true }` builds `buy_v2` / `sell_v2` when the pool supports them (every pool but a cashback
coin's) and the v1 instruction otherwise. Pricing and slippage are identical.

```typescript
const slippage = 1; // percent

const buy = await PUMP_AMM_SDK.buyQuoteInput(swapSolanaState, quoteToSpend, slippage, {
  v2: true,
});
const sell = await PUMP_AMM_SDK.sellBaseInput(swapSolanaState, baseToSell, slippage, {
  v2: true,
});

const usesV2 = supportsTradeV2(swapSolanaState.pool);
```

## v2 with explicit limits

```typescript
await PUMP_AMM_SDK.buyV2Instructions(swapSolanaState, baseOut, maxQuoteIn);
await PUMP_AMM_SDK.buyExactQuoteInV2Instructions(swapSolanaState, spendableQuoteIn, minBaseOut);
await PUMP_AMM_SDK.sellV2Instructions(swapSolanaState, baseIn, minQuoteOut);
```

All three take the same 17 accounts. The only fee account is the buyback recipient's quote ATA;
the protocol and creator fees stay in the pool until they are swept.

## Sweep, then claim creator fees

v2 creator fees sit in `Pool.creatorFees` until `sweep_creator_fee` moves them to the coin-creator
vault. Put the sweep first in the same transaction as the claim (and before any CTO or fee-share
change, which the program refuses with `CreatorFeesNotSwept` while the bucket is nonzero).

```typescript
import { Transaction } from "@solana/web3.js";

const sweep = await onlineSdk.sweepCreatorFeeInstruction(poolKey, coinCreator);
const collectState = await onlineSdk.collectCoinCreatorFeeSolanaState(
  coinCreator,
  undefined,
  swapSolanaState.pool.quoteMint,
);
const claim = await PUMP_AMM_SDK.collectCoinCreatorFee(collectState, coinCreator);

const tx = new Transaction().add(sweep, ...claim);
```

The protocol bucket is swept the same way with
`PUMP_AMM_SDK.sweepProtocolFeeInstruction({ payer, poolKey, pool, quoteTokenProgram, globalConfig })`.
Both sweeps are permissionless and a no-op on an empty bucket.

## Multi-hop route across pools

```typescript
import { multiHopSwapQuote } from "@pump-fun/pump-swap-sdk";

const { globalConfig, feeConfig, hops } = await onlineSdk.multiHopPoolHops([poolAB, poolBC]);
const { minAmountOut } = multiHopSwapQuote({
  inMint,
  hops,
  amountIn,
  slippage,
  globalConfig,
  feeConfig,
});
const instructions = await PUMP_AMM_SDK.multiHopSwapInstructions({
  user,
  inMint,
  venues: hops,
  amountIn,
  minAmountOut,
  globalConfig,
});
```

Budget about 50k compute units per hop. Routes are capped at `MULTI_HOP_MAX_HOPS` (6).

## Quote a pool with negative virtual reserves

```typescript
import { buyBaseInput } from "@pump-fun/pump-swap-sdk";

const { pool, poolBaseAmount, poolQuoteAmount, globalConfig, feeConfig, baseMint, baseMintAccount } =
  swapSolanaState;

const { uiQuote, maxQuote } = buyBaseInput({
  base,
  slippage,
  baseReserve: poolBaseAmount,
  quoteReserve: poolQuoteAmount,
  virtualQuoteReserves: pool.virtualQuoteReserves, // signed i128, often negative after v2 trades
  globalConfig,
  feeConfig,
  baseMint,
  baseMintAccount,
  coinCreator: pool.coinCreator,
  creator: pool.creator,
  quoteMint: pool.quoteMint,
  isMayhemMode: pool.isMayhemMode,
  creatorFeeBps: pool.creatorFeeBps,
});
```

The pool prices at `vault + virtualQuoteReserves`; pass the signed value as is.
