/**
 * `PumpAmmSdk.collectCoinCreatorFee` output for a legacy-WSOL state, captured from the builder
 * before it became quote-mint aware (`feat/quote-control-fees` @ abdcc29), for every combination
 * of vault ATA missing/present, creator ATA missing/present and payer = creator / third party.
 * Keys are deterministic: coin creator = `Keypair.fromSeed(Buffer.alloc(32, 1))`, third-party
 * payer = `Keypair.fromSeed(Buffer.alloc(32, 2))`; existing accounts are 165-byte SPL Token
 * accounts. `creatorFees.spec.ts` asserts the current builder still emits exactly these
 * instructions, so the wSOL path stays byte-identical through refactors.
 */
export interface GoldenInstruction {
  programId: string;
  /** [pubkey, isSigner, isWritable] */
  keys: [string, boolean, boolean][];
  data: string;
}

export const COLLECT_COIN_CREATOR_FEE_WSOL_GOLDEN: Record<
  string,
  GoldenInstruction[]
> = {
  "vault=false,creator=false,payerIsCreator=true": [
    {
      programId: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
      keys: [
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", true, true],
        ["65quAQBHRnB3tEtVcGRzB7a28jCSH4kSXi3boAbbFXz4", false, true],
        ["F14sdFGsctybAyM3rxDV4Jkxx782gXUrUsq1XjQrVAaz", false, false],
        ["So11111111111111111111111111111111111111112", false, false],
        ["11111111111111111111111111111111", false, false],
        ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", false, false],
      ],
      data: "01",
    },
    {
      programId: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
      keys: [
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", true, true],
        ["7azMPufyz8EfKAif9WajHfBbFj5ic8C8rLfaTBfKdN1A", false, true],
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", false, false],
        ["So11111111111111111111111111111111111111112", false, false],
        ["11111111111111111111111111111111", false, false],
        ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", false, false],
      ],
      data: "01",
    },
    {
      programId: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA",
      keys: [
        ["So11111111111111111111111111111111111111112", false, false],
        ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", false, false],
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", false, false],
        ["F14sdFGsctybAyM3rxDV4Jkxx782gXUrUsq1XjQrVAaz", false, false],
        ["65quAQBHRnB3tEtVcGRzB7a28jCSH4kSXi3boAbbFXz4", false, true],
        ["7azMPufyz8EfKAif9WajHfBbFj5ic8C8rLfaTBfKdN1A", false, true],
        ["GS4CU59F31iL7aR2Q8zVS8DRrcRnXX1yjQ66TqNVQnaR", false, false],
        ["pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA", false, false],
      ],
      data: "a039592ab58b2b42",
    },
    {
      programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      keys: [
        ["7azMPufyz8EfKAif9WajHfBbFj5ic8C8rLfaTBfKdN1A", false, true],
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", false, true],
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", true, false],
      ],
      data: "09",
    },
  ],
  "vault=false,creator=false,payerIsCreator=false": [
    {
      programId: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
      keys: [
        ["9hSR6S7WPtxmTojgo6GG3k4yDPecgJY292j7xrsUGWBu", true, true],
        ["65quAQBHRnB3tEtVcGRzB7a28jCSH4kSXi3boAbbFXz4", false, true],
        ["F14sdFGsctybAyM3rxDV4Jkxx782gXUrUsq1XjQrVAaz", false, false],
        ["So11111111111111111111111111111111111111112", false, false],
        ["11111111111111111111111111111111", false, false],
        ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", false, false],
      ],
      data: "01",
    },
    {
      programId: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
      keys: [
        ["9hSR6S7WPtxmTojgo6GG3k4yDPecgJY292j7xrsUGWBu", true, true],
        ["7azMPufyz8EfKAif9WajHfBbFj5ic8C8rLfaTBfKdN1A", false, true],
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", false, false],
        ["So11111111111111111111111111111111111111112", false, false],
        ["11111111111111111111111111111111", false, false],
        ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", false, false],
      ],
      data: "01",
    },
    {
      programId: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA",
      keys: [
        ["So11111111111111111111111111111111111111112", false, false],
        ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", false, false],
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", false, false],
        ["F14sdFGsctybAyM3rxDV4Jkxx782gXUrUsq1XjQrVAaz", false, false],
        ["65quAQBHRnB3tEtVcGRzB7a28jCSH4kSXi3boAbbFXz4", false, true],
        ["7azMPufyz8EfKAif9WajHfBbFj5ic8C8rLfaTBfKdN1A", false, true],
        ["GS4CU59F31iL7aR2Q8zVS8DRrcRnXX1yjQ66TqNVQnaR", false, false],
        ["pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA", false, false],
      ],
      data: "a039592ab58b2b42",
    },
  ],
  "vault=false,creator=true,payerIsCreator=true": [
    {
      programId: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
      keys: [
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", true, true],
        ["65quAQBHRnB3tEtVcGRzB7a28jCSH4kSXi3boAbbFXz4", false, true],
        ["F14sdFGsctybAyM3rxDV4Jkxx782gXUrUsq1XjQrVAaz", false, false],
        ["So11111111111111111111111111111111111111112", false, false],
        ["11111111111111111111111111111111", false, false],
        ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", false, false],
      ],
      data: "01",
    },
    {
      programId: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA",
      keys: [
        ["So11111111111111111111111111111111111111112", false, false],
        ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", false, false],
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", false, false],
        ["F14sdFGsctybAyM3rxDV4Jkxx782gXUrUsq1XjQrVAaz", false, false],
        ["65quAQBHRnB3tEtVcGRzB7a28jCSH4kSXi3boAbbFXz4", false, true],
        ["7azMPufyz8EfKAif9WajHfBbFj5ic8C8rLfaTBfKdN1A", false, true],
        ["GS4CU59F31iL7aR2Q8zVS8DRrcRnXX1yjQ66TqNVQnaR", false, false],
        ["pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA", false, false],
      ],
      data: "a039592ab58b2b42",
    },
    {
      programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      keys: [
        ["7azMPufyz8EfKAif9WajHfBbFj5ic8C8rLfaTBfKdN1A", false, true],
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", false, true],
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", true, false],
      ],
      data: "09",
    },
  ],
  "vault=false,creator=true,payerIsCreator=false": [
    {
      programId: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
      keys: [
        ["9hSR6S7WPtxmTojgo6GG3k4yDPecgJY292j7xrsUGWBu", true, true],
        ["65quAQBHRnB3tEtVcGRzB7a28jCSH4kSXi3boAbbFXz4", false, true],
        ["F14sdFGsctybAyM3rxDV4Jkxx782gXUrUsq1XjQrVAaz", false, false],
        ["So11111111111111111111111111111111111111112", false, false],
        ["11111111111111111111111111111111", false, false],
        ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", false, false],
      ],
      data: "01",
    },
    {
      programId: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA",
      keys: [
        ["So11111111111111111111111111111111111111112", false, false],
        ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", false, false],
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", false, false],
        ["F14sdFGsctybAyM3rxDV4Jkxx782gXUrUsq1XjQrVAaz", false, false],
        ["65quAQBHRnB3tEtVcGRzB7a28jCSH4kSXi3boAbbFXz4", false, true],
        ["7azMPufyz8EfKAif9WajHfBbFj5ic8C8rLfaTBfKdN1A", false, true],
        ["GS4CU59F31iL7aR2Q8zVS8DRrcRnXX1yjQ66TqNVQnaR", false, false],
        ["pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA", false, false],
      ],
      data: "a039592ab58b2b42",
    },
  ],
  "vault=true,creator=false,payerIsCreator=true": [
    {
      programId: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
      keys: [
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", true, true],
        ["7azMPufyz8EfKAif9WajHfBbFj5ic8C8rLfaTBfKdN1A", false, true],
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", false, false],
        ["So11111111111111111111111111111111111111112", false, false],
        ["11111111111111111111111111111111", false, false],
        ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", false, false],
      ],
      data: "01",
    },
    {
      programId: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA",
      keys: [
        ["So11111111111111111111111111111111111111112", false, false],
        ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", false, false],
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", false, false],
        ["F14sdFGsctybAyM3rxDV4Jkxx782gXUrUsq1XjQrVAaz", false, false],
        ["65quAQBHRnB3tEtVcGRzB7a28jCSH4kSXi3boAbbFXz4", false, true],
        ["7azMPufyz8EfKAif9WajHfBbFj5ic8C8rLfaTBfKdN1A", false, true],
        ["GS4CU59F31iL7aR2Q8zVS8DRrcRnXX1yjQ66TqNVQnaR", false, false],
        ["pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA", false, false],
      ],
      data: "a039592ab58b2b42",
    },
    {
      programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      keys: [
        ["7azMPufyz8EfKAif9WajHfBbFj5ic8C8rLfaTBfKdN1A", false, true],
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", false, true],
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", true, false],
      ],
      data: "09",
    },
  ],
  "vault=true,creator=false,payerIsCreator=false": [
    {
      programId: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
      keys: [
        ["9hSR6S7WPtxmTojgo6GG3k4yDPecgJY292j7xrsUGWBu", true, true],
        ["7azMPufyz8EfKAif9WajHfBbFj5ic8C8rLfaTBfKdN1A", false, true],
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", false, false],
        ["So11111111111111111111111111111111111111112", false, false],
        ["11111111111111111111111111111111", false, false],
        ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", false, false],
      ],
      data: "01",
    },
    {
      programId: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA",
      keys: [
        ["So11111111111111111111111111111111111111112", false, false],
        ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", false, false],
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", false, false],
        ["F14sdFGsctybAyM3rxDV4Jkxx782gXUrUsq1XjQrVAaz", false, false],
        ["65quAQBHRnB3tEtVcGRzB7a28jCSH4kSXi3boAbbFXz4", false, true],
        ["7azMPufyz8EfKAif9WajHfBbFj5ic8C8rLfaTBfKdN1A", false, true],
        ["GS4CU59F31iL7aR2Q8zVS8DRrcRnXX1yjQ66TqNVQnaR", false, false],
        ["pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA", false, false],
      ],
      data: "a039592ab58b2b42",
    },
  ],
  "vault=true,creator=true,payerIsCreator=true": [
    {
      programId: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA",
      keys: [
        ["So11111111111111111111111111111111111111112", false, false],
        ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", false, false],
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", false, false],
        ["F14sdFGsctybAyM3rxDV4Jkxx782gXUrUsq1XjQrVAaz", false, false],
        ["65quAQBHRnB3tEtVcGRzB7a28jCSH4kSXi3boAbbFXz4", false, true],
        ["7azMPufyz8EfKAif9WajHfBbFj5ic8C8rLfaTBfKdN1A", false, true],
        ["GS4CU59F31iL7aR2Q8zVS8DRrcRnXX1yjQ66TqNVQnaR", false, false],
        ["pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA", false, false],
      ],
      data: "a039592ab58b2b42",
    },
    {
      programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      keys: [
        ["7azMPufyz8EfKAif9WajHfBbFj5ic8C8rLfaTBfKdN1A", false, true],
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", false, true],
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", true, false],
      ],
      data: "09",
    },
  ],
  "vault=true,creator=true,payerIsCreator=false": [
    {
      programId: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA",
      keys: [
        ["So11111111111111111111111111111111111111112", false, false],
        ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", false, false],
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", false, false],
        ["F14sdFGsctybAyM3rxDV4Jkxx782gXUrUsq1XjQrVAaz", false, false],
        ["65quAQBHRnB3tEtVcGRzB7a28jCSH4kSXi3boAbbFXz4", false, true],
        ["7azMPufyz8EfKAif9WajHfBbFj5ic8C8rLfaTBfKdN1A", false, true],
        ["GS4CU59F31iL7aR2Q8zVS8DRrcRnXX1yjQ66TqNVQnaR", false, false],
        ["pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA", false, false],
      ],
      data: "a039592ab58b2b42",
    },
  ],
};
