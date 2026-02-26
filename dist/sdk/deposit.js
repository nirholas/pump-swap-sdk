"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/sdk/deposit.ts
var deposit_exports = {};
__export(deposit_exports, {
  depositLpToken: () => depositLpToken,
  depositToken0: () => depositToken0
});
module.exports = __toCommonJS(deposit_exports);
var import_bn = __toESM(require("bn.js"));
function depositToken0(token0, slippage, token0Reserve, token1Reserve, totalLpTokens) {
  if (slippage < 0 || slippage > 100) {
    throw new Error("Slippage must be between 0 and 100 (0% to 100%)");
  }
  const token1 = token0.mul(token1Reserve).div(token0Reserve);
  const slippageFactor = new import_bn.default((1 + slippage / 100) * 1e9);
  const maxToken0 = token0.mul(slippageFactor).div(new import_bn.default(1e9));
  const maxToken1 = token1.mul(slippageFactor).div(new import_bn.default(1e9));
  const lpToken = token0.mul(totalLpTokens).div(token0Reserve);
  return {
    token1,
    lpToken,
    maxToken0,
    maxToken1
  };
}
function ceilDiv(numerator, denominator) {
  return numerator.add(denominator).sub(new import_bn.default(1)).div(denominator);
}
function depositLpToken(lpToken, slippage, baseReserve, quoteReserve, totalLpTokens) {
  if (totalLpTokens.isZero()) {
    throw new Error("Division by zero: totalLpTokens cannot be zero");
  }
  const baseAmountIn = ceilDiv(baseReserve.mul(lpToken), totalLpTokens);
  const quoteAmountIn = ceilDiv(quoteReserve.mul(lpToken), totalLpTokens);
  const slippageFactor = new import_bn.default((1 + slippage / 100) * 1e9);
  const slippageDenominator = new import_bn.default(1e9);
  const maxBase = baseAmountIn.mul(slippageFactor).div(slippageDenominator);
  const maxQuote = quoteAmountIn.mul(slippageFactor).div(slippageDenominator);
  return {
    maxBase,
    maxQuote
  };
}
