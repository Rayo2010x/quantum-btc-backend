import crypto from "node:crypto";
import { PLINKO_PAYOUTS, RiskLevel } from "../config/plinkoPayouts.js";

/**
 * Calculates the outcome of a Plinko bet based on the final entropy.
 * Returns the multiplier and the path (0s and 1s) the ball took.
 */
export function calculatePlinkoOutcome(
  serverEntropy: string,
  clientSeed: string,
  rows: number,
  risk: RiskLevel
): { multiplier: number, path: number[], slot: number } {
  // Generate the SHA256 hash using the combined entropy
  const combined = crypto
    .createHash("sha256")
    .update(serverEntropy)
    .update(clientSeed)
    .digest("hex");

  // A Plinko game with N rows needs N binary decisions.
  // The SHA256 hash gives us 64 hex characters, which is 256 bits.
  // We can easily use the first N characters as 16-bit choices, or just use the first N bits.
  
  let slot = 0;
  const path: number[] = [];

  for (let i = 0; i < rows; i++) {
    // Take the i-th hex character and convert to integer (0-15)
    // If it's even (0, 2, 4, 8, A, C, E), go left (0)
    // If it's odd (1, 3, 5, 7, 9, B, D, F), go right (1)
    const hexChar = combined.charAt(i);
    const intVal = parseInt(hexChar, 16);
    
    const direction = intVal % 2; // 0 = Left, 1 = Right
    path.push(direction);
    slot += direction;
  }

  // The final slot corresponds to the sum of all 'Rights'
  // Fetch the multiplier for this slot based on the risk configuration
  const multipliers = PLINKO_PAYOUTS[risk];
  
  if (!multipliers || slot >= multipliers.length) {
    throw new Error(`Invalid Plinko configuration or math error. Risk: ${risk}, Rows: ${rows}, Slot: ${slot}`);
  }

  const multiplier = multipliers[slot];

  return { multiplier, path, slot };
}
