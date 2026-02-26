// src/sdk/tokenIncentives.ts
import BN from "bn.js";
function totalUnclaimedTokens(globalVolumeAccumulator, userVolumeAccumulator, currentTimestamp = Date.now() / 1e3) {
  const { startTime, endTime, secondsInADay, totalTokenSupply, solVolumes } = globalVolumeAccumulator;
  const { totalUnclaimedTokens: totalUnclaimedTokens2, currentSolVolume, lastUpdateTimestamp } = userVolumeAccumulator;
  const result = totalUnclaimedTokens2;
  if (startTime.eqn(0) || endTime.eqn(0) || secondsInADay.eqn(0)) {
    return result;
  }
  let currentTimestampBn = new BN(currentTimestamp);
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
    return new BN(0);
  }
  let currentTimestampBn = new BN(currentTimestamp);
  if (currentTimestampBn.lt(startTime) || currentTimestampBn.gt(endTime)) {
    return new BN(0);
  }
  const currentDayIndex = currentTimestampBn.sub(startTime).div(secondsInADay).toNumber();
  if (lastUpdateTimestamp.lt(startTime)) {
    return new BN(0);
  }
  const lastUpdatedIndex = lastUpdateTimestamp.sub(startTime).div(secondsInADay).toNumber();
  if (endTime.lt(startTime)) {
    return new BN(0);
  }
  if (currentDayIndex !== lastUpdatedIndex) {
    return new BN(0);
  }
  const currentDayTokenSupply = totalTokenSupply[currentDayIndex];
  const currentDaySolVolume = solVolumes[currentDayIndex];
  if (currentDaySolVolume.eqn(0)) {
    return new BN(0);
  }
  return currentSolVolume.mul(currentDayTokenSupply).div(currentDaySolVolume);
}
export {
  currentDayTokens,
  totalUnclaimedTokens
};
