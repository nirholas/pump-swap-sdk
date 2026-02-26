import { i as GlobalVolumeAccumulator, U as UserVolumeAccumulator } from '../sdk-DrGrVjGc.mjs';
import BN from 'bn.js';
import '@solana/web3.js';
import '@solana/spl-token';

declare function totalUnclaimedTokens(globalVolumeAccumulator: GlobalVolumeAccumulator, userVolumeAccumulator: UserVolumeAccumulator, currentTimestamp?: number): BN;
declare function currentDayTokens(globalVolumeAccumulator: GlobalVolumeAccumulator, userVolumeAccumulator: UserVolumeAccumulator, currentTimestamp?: number): BN;

export { currentDayTokens, totalUnclaimedTokens };
