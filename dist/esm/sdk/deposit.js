// src/sdk/deposit.ts
import BN from "bn.js";
function depositToken0(token0, slippage, token0Reserve, token1Reserve, totalLpTokens) {
  if (slippage < 0 || slippage > 100) {
    throw new Error("Slippage must be between 0 and 100 (0% to 100%)");
  }
  const token1 = token0.mul(token1Reserve).div(token0Reserve);
  const slippageFactor = new BN((1 + slippage / 100) * 1e9);
  const maxToken0 = token0.mul(slippageFactor).div(new BN(1e9));
  const maxToken1 = token1.mul(slippageFactor).div(new BN(1e9));
  const lpToken = token0.mul(totalLpTokens).div(token0Reserve);
  return {
    token1,
    lpToken,
    maxToken0,
    maxToken1
  };
}
function ceilDiv(numerator, denominator) {
  return numerator.add(denominator).sub(new BN(1)).div(denominator);
}
function depositLpToken(lpToken, slippage, baseReserve, quoteReserve, totalLpTokens) {
  if (totalLpTokens.isZero()) {
    throw new Error("Division by zero: totalLpTokens cannot be zero");
  }
  const baseAmountIn = ceilDiv(baseReserve.mul(lpToken), totalLpTokens);
  const quoteAmountIn = ceilDiv(quoteReserve.mul(lpToken), totalLpTokens);
  const slippageFactor = new BN((1 + slippage / 100) * 1e9);
  const slippageDenominator = new BN(1e9);
  const maxBase = baseAmountIn.mul(slippageFactor).div(slippageDenominator);
  const maxQuote = quoteAmountIn.mul(slippageFactor).div(slippageDenominator);
  return {
    maxBase,
    maxQuote
  };
}
export {
  depositLpToken,
  depositToken0
};
