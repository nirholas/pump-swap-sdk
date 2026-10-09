# Getting started with pump-swap-sdk

TypeScript SDK for the Pump Swap AMM program (`pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA`). This
repository mirrors the published `@pump-fun/pump-swap-sdk` 2.1.0, which targets the October 2026
program: `buy_v2` / `sell_v2` / `buy_exact_quote_in_v2`, `multi_hop_swap`, `sweep_protocol_fee` /
`sweep_creator_fee`, and signed `virtual_quote_reserves`.

## Install

```bash
npm install @pump-fun/pump-swap-sdk
```

## First trade

```typescript
import { Connection, PublicKey } from "@solana/web3.js";
import { OnlinePumpAmmSdk, PUMP_AMM_SDK } from "@pump-fun/pump-swap-sdk";

const onlineSdk = new OnlinePumpAmmSdk(new Connection("https://api.mainnet-beta.solana.com"));
const state = await onlineSdk.swapSolanaState(new PublicKey("<pool>"), new PublicKey("<wallet>"));

// Spend a quote amount, 1% slippage, v2 where the pool supports it
const instructions = await PUMP_AMM_SDK.buyQuoteInput(state, quoteAmount, 1, { v2: true });
```

Sign and send `instructions` with your wallet. [Examples](./examples.md) covers sells, explicit
v2 limits, fee sweeps, multi-hop routes and quoting.

## Verify the install

Clone the repository and run its checks:

```bash
git clone https://github.com/nirholas/pump-swap-sdk.git
cd pump-swap-sdk
npm install
npm run typecheck
npm test
```

| Command | Runs |
|---|---|
| `npm run test` | `jest` over `src/__tests__` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `eslint src --ext .ts` |

Three upstream specs need the network and fail offline: the two "debug quote errors" cases in
`buy.spec.ts` read the live devnet fee config, and `buyQuoteSimulation.spec.ts` needs a local
validator on `127.0.0.1:8899`. `dist/` is the published build copied from the npm tarball;
there is no tsup config, so `npm run build` does not regenerate it.

## Next steps

- [Examples](./examples.md) shows runnable snippets.
- The [README](https://github.com/nirholas/pump-swap-sdk#readme) is the complete reference.
- Found a problem? [Open an issue](https://github.com/nirholas/pump-swap-sdk/issues).
