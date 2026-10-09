import BN from "bn.js";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import pumpAmmIdl from "../idl/pump_amm.json";
import { PumpAmm } from "../types/pump_amm";
import { pumpPoolAuthorityPda } from "./pda";
import { Pool } from "../types/sdk";

export function ceilDiv(a: BN, b: BN): BN {
  if (b.isZero()) {
    throw new Error("Cannot divide by zero.");
  }
  return a.add(b).subn(1).div(b);
}

export function fee(amount: BN, basisPoints: BN): BN {
  return ceilDiv(amount.mul(basisPoints), new BN(10_000));
}

export function getPumpAmmProgram(connection: Connection): Program<PumpAmm> {
  return new Program(
    pumpAmmIdl as PumpAmm,
    new AnchorProvider(connection, null as any, {}),
  );
}

export function isPumpPool(
  baseMint: PublicKey,
  poolCreator: PublicKey,
): boolean {
  return pumpPoolAuthorityPda(baseMint).equals(poolCreator);
}

/**
 * Whether `buy_v2` / `buy_exact_quote_in_v2` / `sell_v2` accept `pool`: every pool but a cashback
 * coin's, whose creator fee is the buyer's cashback, which v2 never pays (it keeps trading
 * through v1).
 *
 * rust reference: pump-amm check_pool_supported()
 */
export function supportsTradeV2(pool: Pool): boolean {
  return !pool.isCashbackCoin;
}

/**
 * pump-amm `TOTAL_TOKEN_SUPPLY`: the circulating supply the program uses as the market-cap basis
 * for mayhem-mode pools instead of the live base mint supply (`Pool::market_cap`).
 */
export const PUMP_AMM_TOTAL_TOKEN_SUPPLY = new BN("1000000000000000");

/// rust reference: pump-amm Pool::market_cap()
export function poolMarketCap({
  baseMintSupply,
  baseReserve,
  quoteReserve,
  isMayhemMode = false,
}: {
  baseMintSupply: BN;
  baseReserve: BN;
  quoteReserve: BN;
  isMayhemMode?: boolean;
}): BN {
  if (baseReserve.isZero()) {
    throw new Error(
      "Division by zero: pool base token reserves cannot be zero",
    );
  }
  const circulatingSupply = isMayhemMode
    ? PUMP_AMM_TOTAL_TOKEN_SUPPLY
    : baseMintSupply;
  return quoteReserve.mul(circulatingSupply).div(baseReserve);
}
