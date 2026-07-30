# Getting started with pump-swap-sdk

Official SDK for interacting with Pump Swap AMM protocol on Solana

## Install

```bash
npm install @pump-fun/pump-swap-sdk
```

## Verify the install

Clone the repository and run its checks to confirm everything works on your machine:

```bash
git clone https://github.com/nirholas/pump-swap-sdk.git
cd pump-swap-sdk
```

Available commands:

| Command | Runs |
|---|---|
| `npm run build` | `tsup --clean --dts` |
| `npm run test` | `jest` |
| `npm run lint` | `eslint src --ext .ts` |
| `npm run typecheck` | `tsc --noEmit` |

## Next steps

- [Examples](./examples.md) shows runnable snippets.
- The [README](https://github.com/nirholas/pump-swap-sdk#readme) is the complete reference.
- Found a problem? [Open an issue](https://github.com/nirholas/pump-swap-sdk/issues).
