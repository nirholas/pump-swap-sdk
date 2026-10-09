/**
 * `PumpAmmSdk.createPoolInstructions` output captured from the builder before `create_pool` gained
 * its `creator_fee_bps` / `can_edit_creator_fee` arguments (`feat/quote-control-creator-fees`
 * @ 13b6dac). Keys are deterministic: creator = `Keypair.fromSeed(Buffer.alloc(32, 1))`, base
 * mint = `Keypair.fromSeed(Buffer.alloc(32, 2))`; existing token accounts are 165-byte SPL Token
 * accounts; `baseIn` = 1_000_000_000, `quoteIn` = 5_000_000. `creatorFee.spec.ts` asserts the
 * current builder emits exactly these instructions, except that `create_pool` data now carries the
 * 10 trailing bytes (8 for the u64, 1 for each of the two bools) older programs ignore.
 */
import { GoldenInstruction } from "./collectCoinCreatorFeeWsolGolden";

export const CREATE_POOL_GOLDEN: Record<string, GoldenInstruction[]> = {
  "usdc:index=1,poolAtasMissing,userAtasExist": [
    {
      programId: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
      keys: [
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", true, true],
        ["9KkgtMrY3FybAwXrzEjoRBZP1q76AhGy6jPzUhGxapkz", false, true],
        ["Cpz8F7ebMJErUQJs7ukibQWxNGC1acsY3QRo5o7T1Siw", false, false],
        ["9hSR6S7WPtxmTojgo6GG3k4yDPecgJY292j7xrsUGWBu", false, false],
        ["11111111111111111111111111111111", false, false],
        ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", false, false],
      ],
      data: "01",
    },
    {
      programId: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
      keys: [
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", true, true],
        ["3ibMqXG6pE63KHYrtMEpyj5Spj1FtuJ2wTkotuqwbGzH", false, true],
        ["Cpz8F7ebMJErUQJs7ukibQWxNGC1acsY3QRo5o7T1Siw", false, false],
        ["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", false, false],
        ["11111111111111111111111111111111", false, false],
        ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", false, false],
      ],
      data: "01",
    },
    {
      programId: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA",
      keys: [
        ["Cpz8F7ebMJErUQJs7ukibQWxNGC1acsY3QRo5o7T1Siw", false, true],
        ["ADyA8hdefvWN2dbGGWFotbzWxrAvLW83WG6QCVXvJKqw", false, false],
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", true, true],
        ["9hSR6S7WPtxmTojgo6GG3k4yDPecgJY292j7xrsUGWBu", false, false],
        ["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", false, false],
        ["3knmTQrUGq9uwZJUYMTCQ1b6rZWgUePQWsZBeKb75BKb", false, true],
        ["A2XhaCzf7YeQdxcYQvhHufAHnS6Ae8e9UWXMfawxrZHW", false, true],
        ["3wvJdyFnGvaMWpbq93NU91SggiVRveULUXL6iX5VZDGP", false, true],
        ["5dDLrUkkUoPtRL23KeejEq8WaqryhfdeEFKdrEZtPcgK", false, true],
        ["9KkgtMrY3FybAwXrzEjoRBZP1q76AhGy6jPzUhGxapkz", false, true],
        ["3ibMqXG6pE63KHYrtMEpyj5Spj1FtuJ2wTkotuqwbGzH", false, true],
        ["11111111111111111111111111111111", false, false],
        ["TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", false, false],
        ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", false, false],
        ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", false, false],
        ["ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL", false, false],
        ["GS4CU59F31iL7aR2Q8zVS8DRrcRnXX1yjQ66TqNVQnaR", false, false],
        ["pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA", false, false],
      ],
      data: "e992d18ecf6840bc010000ca9a3b00000000404b4c000000000000000000000000000000000000000000000000000000000000000000000000000000",
    },
  ],
  "wsol:index=0,poolAtasExist,userWsolMissing": [
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
      programId: "11111111111111111111111111111111",
      keys: [
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", true, true],
        ["7azMPufyz8EfKAif9WajHfBbFj5ic8C8rLfaTBfKdN1A", false, true],
      ],
      data: "02000000404b4c0000000000",
    },
    {
      programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      keys: [["7azMPufyz8EfKAif9WajHfBbFj5ic8C8rLfaTBfKdN1A", false, true]],
      data: "11",
    },
    {
      programId: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA",
      keys: [
        ["GDAAbkeLV1gaR1doonmKzupncGGUJbgWkZDkvgvJADhD", false, true],
        ["ADyA8hdefvWN2dbGGWFotbzWxrAvLW83WG6QCVXvJKqw", false, false],
        ["AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9", true, true],
        ["9hSR6S7WPtxmTojgo6GG3k4yDPecgJY292j7xrsUGWBu", false, false],
        ["So11111111111111111111111111111111111111112", false, false],
        ["3ZEHdCJhbbhcQxRrPA6teLm14ig8FNoVvd8nBoVEzBvV", false, true],
        ["A2XhaCzf7YeQdxcYQvhHufAHnS6Ae8e9UWXMfawxrZHW", false, true],
        ["7azMPufyz8EfKAif9WajHfBbFj5ic8C8rLfaTBfKdN1A", false, true],
        ["DjxynzuCqCnySm7MtnR9W55nUV4F9TyhEYm6rxR3HDzN", false, true],
        ["DjWsEVKFkDyDFTRpc3unbFfWVfbuJkH2dymDLk46yu8W", false, true],
        ["BW7ssqMaNJnWwuqEtGCZFdbMAEpfffw2J3ZDm6sLCsCk", false, true],
        ["11111111111111111111111111111111", false, false],
        ["TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", false, false],
        ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", false, false],
        ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", false, false],
        ["ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL", false, false],
        ["GS4CU59F31iL7aR2Q8zVS8DRrcRnXX1yjQ66TqNVQnaR", false, false],
        ["pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA", false, false],
      ],
      data: "e992d18ecf6840bc000000ca9a3b00000000404b4c000000000000000000000000000000000000000000000000000000000000000000000000000000",
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
};
