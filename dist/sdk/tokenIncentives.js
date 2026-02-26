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

// src/sdk/tokenIncentives.ts
var tokenIncentives_exports = {};
__export(tokenIncentives_exports, {
  currentDayTokens: () => currentDayTokens,
  totalUnclaimedTokens: () => totalUnclaimedTokens
});
module.exports = __toCommonJS(tokenIncentives_exports);
var import_bn = __toESM(require("bn.js"));
function totalUnclaimedTokens(globalVolumeAccumulator, userVolumeAccumulator, currentTimestamp = Date.now() / 1e3) {
  const { startTime, endTime, secondsInADay, totalTokenSupply, solVolumes } = globalVolumeAccumulator;
  const { totalUnclaimedTokens: totalUnclaimedTokens2, currentSolVolume, lastUpdateTimestamp } = userVolumeAccumulator;
  const result = totalUnclaimedTokens2;
  if (startTime.eqn(0) || endTime.eqn(0) || secondsInADay.eqn(0)) {
    return result;
  }
  let currentTimestampBn = new import_bn.default(currentTimestamp);
  if (currentTimestampBn.lt(startTime)) {
    return result;
  }
  const currentDayIndex = currentTimestampBn.sub(startTime).div(secondsInADay).toNumber();
  if (lastUpdateTimestamp.lt(startTime)) {
    return result;
  }
  const lastUpdatedIndex = lastUpdateTimestamp.sub(startTime).div(secondsInADay).toNumber();
  if (endTime.lt(startTime)) {
    return result;
  }
  const endDayIndex = endTime.sub(startTime).div(secondsInADay).toNumber();
  if (currentDayIndex > lastUpdatedIndex && lastUpdatedIndex <= endDayIndex) {
    const lastUpdatedDayTokenSupply = totalTokenSupply[lastUpdatedIndex];
    const lastUpdatedDaySolVolume = solVolumes[lastUpdatedIndex];
    if (lastUpdatedDaySolVolume.eqn(0)) {
      return result;
    }
    return result.add(
      currentSolVolume.mul(lastUpdatedDayTokenSupply).div(lastUpdatedDaySolVolume)
    );
  }
  return result;
}
function currentDayTokens(globalVolumeAccumulator, userVolumeAccumulator, currentTimestamp = Date.now() / 1e3) {
  const { startTime, endTime, secondsInADay, totalTokenSupply, solVolumes } = globalVolumeAccumulator;
  const { currentSolVolume, lastUpdateTimestamp } = userVolumeAccumulator;
  if (startTime.eqn(0) || endTime.eqn(0) || secondsInADay.eqn(0)) {
    return new import_bn.default(0);
  }
  let currentTimestampBn = new import_bn.default(currentTimestamp);
  if (currentTimestampBn.lt(startTime) || currentTimestampBn.gt(endTime)) {
    return new import_bn.default(0);
  }
  const currentDayIndex = currentTimestampBn.sub(startTime).div(secondsInADay).toNumber();
  if (lastUpdateTimestamp.lt(startTime)) {
    return new import_bn.default(0);
  }
  const lastUpdatedIndex = lastUpdateTimestamp.sub(startTime).div(secondsInADay).toNumber();
  if (endTime.lt(startTime)) {
    return new import_bn.default(0);
  }
  if (currentDayIndex !== lastUpdatedIndex) {
    return new import_bn.default(0);
  }
  const currentDayTokenSupply = totalTokenSupply[currentDayIndex];
  const currentDaySolVolume = solVolumes[currentDayIndex];
  if (currentDaySolVolume.eqn(0)) {
    return new import_bn.default(0);
  }
  return currentSolVolume.mul(currentDayTokenSupply).div(currentDaySolVolume);
}
