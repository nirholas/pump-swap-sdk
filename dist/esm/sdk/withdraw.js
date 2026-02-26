// src/sdk/withdraw.ts
import BN from "bn.js";
function withdraw(lpAmount, slippage, baseReserve, quoteReserve, totalLpTokens) {
  if (lpAmount.isZero() || totalLpTokens.isZero()) {
    throw new Error("LP amount or total LP tokens cannot be zero.");
  }
  const base = baseReserve.mul(lpAmount).div(totalLpTokens);
  const quote = quoteReserve.mul(lpAmount).div(totalLpTokens);
  const scaleFactor = new BN(1e9);
  const slippageFactor = new BN((1 - slippage / 100) * 1e9);
  const minBase = base.mul(slippageFactor).div(scaleFactor);
  const minQuote = quote.mul(slippageFactor).div(scaleFactor);
  return {
    base,
    quote,
    minBase,
    minQuote
  };
}
export {
  withdraw
};
