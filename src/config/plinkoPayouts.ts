export type RiskLevel = 'low' | 'medium' | 'high';

export const PLINKO_PAYOUTS: Record<RiskLevel, number[]> = {
  // 17 slots for 16 rows Plinko
  // Adjusted to ~97.5% Expected Return (RTP) to be slightly better than Roulette
  low:    [16, 9, 2, 1.5, 1.2, 1.0, 1.0, 0.9, 0.95, 0.9, 1.0, 1.0, 1.2, 1.5, 2, 9, 16],
  medium: [110, 41, 10, 5, 3, 1.4, 1, 0.5, 0.3, 0.5, 1, 1.4, 3, 5, 10, 41, 110],
  high:   [1000, 130, 26, 9, 4, 1.9, 0.2, 0.2, 0.2, 0.2, 0.2, 1.9, 4, 9, 26, 130, 1000]
};

/**
 * Validates if the provided risk level is supported.
 */
export const isValidRiskLevel = (risk: string): risk is RiskLevel => {
  return ['low', 'medium', 'high'].includes(risk);
};
