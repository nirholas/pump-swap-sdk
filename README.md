# Pump Swap SDK 

The SDK is structured as follows:

- `PumpAmmSdk` is the high level SDK, useful for UI integrations.
- `PumpAmmInternalSdk` is the low level SDK, useful for programmatic integrations, allowing full customization of instructions.
- `PumpAmmAdminSdk` is the SDK which allows access to admin-protected instructions.

## Installation

```bash
npm install @pump-fun/pump-swap-sdk
```

## Usage

```typescript
import { PumpAmmSdk } from "@pump-fun/pump-swap-sdk";

// Initialize SDK
const pumpAmmSdk = new PumpAmmSdk();
```

## Create pool

```typescript
// Create a (base, quote) pool instructions
const createPoolSolanaState = await this.pumpAmmSdk.createPoolSolanaState(
  index,
  creator,
  baseMint,
  quoteMint,
);

const createPoolInstructions = await pumpAmmSdk.createPoolInstructions(
  createPoolSolanaState,
  baseIn,
  quoteIn,
);

// Get initial pool price for UI
const initialPoolPrice = pumpAmmSdk.createAutocompleteInitialPoolPrice(
  initialBase,
  initialQuote,
);
```

## Deposit

For depositing into a (quote, base) pool:

```typescript
// When base input changes
const liquiditySolanaState = await this.pumpAmmSdk.liquiditySolanaState(
  poolKey,
  user,
);

const { quote, lpToken } =
  await pumpAmmSdk.depositAutocompleteQuoteAndLpTokenFromBase(
    liquiditySolanaState,
    base,
    slippage,
  );

const { base, lpToken } =
  await pumpAmmSdk.depositAutocompleteBaseAndLpTokenFromQuote(
    liquiditySolanaState,
    quote,
    slippage,
  );

// Deposit instructions
const depositInstructions = await pumpAmmSdk.depositInstructions(
  liquiditySolanaState,
  lpToken,
  slippage,
);
```

## Swap

The SDK supports bi-directional swaps:

```typescript
const swapSolanaState = await this.pumpAmmlSdk.swapSolanaState(poolKey, user);

const { globalConfig, pool, poolBaseAmount, poolQuoteAmount } = swapSolanaState;

const baseReserve = poolBaseAmount;
const quoteReserve = poolQuoteAmount;

const { uiQuote } = buyBaseInputInternal(
  baseAmount,
  slippage,
  baseReserve,
  quoteReserve,
  globalConfig,
  pool.creator,
);

const { base } = buyQuoteInputInternal(
  quoteAmount,
  slippage,
  baseReserve,
  quoteReserve,
  globalConfig,
  pool.creator,
);

const { uiQuote } = sellBaseInputInternal(
  baseAmount,
  slippage,
  baseReserve,
  quoteReserve,
  globalConfig,
  pool.creator,
);

const { base } = sellQuoteInputInternal(
  quoteAmount,
  slippage,
  baseReserve,
  quoteReserve,
  globalConfig,
  pool.creator,
);

// Swap instructions
await pumpAmmInternalSdk.buyBaseInput(swapSolanaState, baseAmount, slippage);

await pumpAmmInternalSdk.sellBaseInput(swapSolanaState, baseAmount, slippage);

await pumpAmmInternalSdk.buyQuoteInput(swapSolanaState, quoteAmount, slippage);

await pumpAmmInternalSdk.sellQuoteInput(swapSolanaState, quoteAmount, slippage);
```

## Withdraw

```typescript
const liquiditySolanaState = await this.pumpAmmSdk.liquiditySolanaState(
  poolKey,
  user,
);

const { base, quote } = pumpAmmSdk.withdrawAutocompleteBaseAndQuoteFromLpToken(
  liquiditySolanaState,
  lpAmount,
  slippage,
);

// Withdraw instructions
const withdrawInstructions = await pumpAmmSdk.withdrawInstructions(
  liquiditySolanaState,
  lpToken,
  slippage,
);
```

## License

All rights reserved. See [LICENSE](LICENSE).

## Links

- [Website](https://pump.fun)
