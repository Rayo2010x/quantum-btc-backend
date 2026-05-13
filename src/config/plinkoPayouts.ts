export type RiskLevel = 'low' | 'medium' | 'high';

export const PLINKO_PAYOUTS: Record<number, Record<RiskLevel, number[]>> = {
  8: {
    low:    [5.6, 2.0, 1.1, 1.0, 0.5, 1.0, 1.1, 2.0, 5.6],
    medium: [14, 3, 1.2, 0.7, 0.4, 0.7, 1.2, 3, 14],
    high:   [29, 5.8, 1.1, 0.2, 0.2, 0.2, 1.1, 5.8, 29]
  },
  12: {
    low:    [10, 3, 1.6, 1.4, 1.1, 1.0, 0.45, 1.0, 1.1, 1.4, 1.6, 3, 10],
    medium: [33, 12, 4.0, 2.0, 1.0, 0.6, 0.3, 0.6, 1.0, 2.0, 4.0, 12, 33],
    high:   [170, 23, 7.8, 2.0, 0.7, 0.2, 0.2, 0.2, 0.7, 2.0, 7.8, 23, 170]
  },
  16: {
    // Adjusted to ~97.5% Expected Return (RTP) to be slightly better than Roulette
    low:    [16, 9, 2, 1.5, 1.2, 1.0, 1.0, 0.9, 0.95, 0.9, 1.0, 1.0, 1.2, 1.5, 2, 9, 16],
    medium: [110, 41, 10, 5, 3, 1.4, 1, 0.5, 0.3, 0.5, 1, 1.4, 3, 5, 10, 41, 110],
    high:   [1000, 130, 26, 9, 4, 1.9, 0.2, 0.2, 0.2, 0.2, 0.2, 1.9, 4, 9, 26, 130, 1000]
  }
};

/**
 * Validates if the provided risk level is supported.
 */
export const isValidRiskLevel = (risk: string): risk is RiskLevel => {
  return ['low', 'medium', 'high'].includes(risk);
};
