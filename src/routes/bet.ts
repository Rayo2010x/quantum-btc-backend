
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { pool, withTx } from "../db/index.js";
import crypto from "node:crypto";
import { env } from "../config/env.js";

import { getBankroll } from "../services/bankroll_worker.js";

const PlaceBetSchema = z.object({
  sessionId: z.string().uuid(),
  amountSat: z.number().int().positive(),
  betType: z.enum(["STRAIGHT"]), // MVP support only Straight for now
  selection: z.array(z.number().min(0).max(36)).length(1), // Array of 1 for Straight
  clientSeed: z.string().min(10) // User contribution
});

// Helper: Calculate Outcome
// SHA256(server_seed + client_seed + entropy + nonce) ...
// For MVP: We pop entropy, consume it.
// Outcome = (Hash(entropy + clientSeed)) mod 37
function calculateOutcome(serverEntropy: string, clientSeed: string): number {
  const combined = crypto
    .createHash("sha256")
    .update(serverEntropy)
    .update(clientSeed)
    .digest("hex");

  // Take first 8 chars (32 bits) as int -> mod 37
  // This is a simplified "Fair" algo. 
  // Real implementation: HMAC? 
  // Manual says: final_entropy = SHA256(server_seed || client_seed || ... )
  const intValue = parseInt(combined.substring(0, 8), 16);
  return intValue % 37;
}

import { OpenNode } from "../services/opennode.js";

export async function betRoutes(app: FastifyInstance) {
  app.post("/v1/game/bet", {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: "1 minute"
      }
    }
  }, async (req, reply) => {
    const MultiBetSchema = z.object({
      sessionId: z.string().uuid(), // Still keep session for grouping/history
      clientSeed: z.string().min(10),
      bets: z.array(z.object({
        number: z.number().min(0).max(36),
        amount: z.number().int().positive()
      })).min(1).max(37)
    });

    const { sessionId, bets, clientSeed } = MultiBetSchema.parse(req.body);
    const totalBetAmount = bets.reduce((sum, b) => sum + b.amount, 0);

    // Dynamic Bankroll Risk Management (Kelly Criterion)
    const currentBankroll = getBankroll();
    const effectiveBankroll = currentBankroll > 0 ? currentBankroll : env.BANKROLL_FLOOR_SATS;
    const maxPayoutAllowed = effectiveBankroll * env.CASINO_RISK_TOLERANCE_PERCENT;

    // Calculate total potential exposure
    let maxPotentialPayout = 0;
    bets.forEach(b => {
      maxPotentialPayout += b.amount * 36; // Straight (Pleno) multiplier is 36x
    });

    if (maxPotentialPayout > maxPayoutAllowed) {
      return reply.status(400).send({
        error: `Bet multiplier exposure exceeds casino liquidity safety limits. Max Payout allowed: ${Math.floor(maxPayoutAllowed)} Sats.`
      });
    }

    if (effectiveBankroll < 20000) {
      return reply.status(503).send({ error: "System Under Maintenance. Casino liquidity too low." });
    }

    try {
      // NON-CUSTODIAL FLOW:
      // 1. Create Invoice for the total amount
      const description = `QuantumBet Round [${bets.length} numbers]`;
      const charge = await OpenNode.createCharge(totalBetAmount, description);

      // 2. Commit Bet to DB as WAITING_PAYMENT
      // We do NOT fetch entropy yet. Entropy is fetched when Paid (Commit-Reveal).
      // OR we can commit Server Seed Hash now? 
      // Better: Commit Server Seed Hash NOW to prove fairness *before* payment?
      // Yes! "Provably Fair": Server commits to seed, User commits to bet (via payment).
      // Fetch 1 random seed, hash it, store hash. Reveal later.

      const result = await withTx(async (client) => {
        // Fetch Pre-Commit Entropy (just to hash it, not consume it yet?)
        // Actually, we must 'reserve' it or just grab one.
        // Let's grab it and mark it reserved? Or just grab it.
        // If user never pays, we "burn" this entropy. That's fine.
        const entRes = await client.query(
          `UPDATE entropy_buffer 
                 SET is_consumed = TRUE, consumed_by_bet_id = NULL 
                 WHERE id = (
                    SELECT id FROM entropy_buffer WHERE is_consumed = FALSE ORDER BY created_at ASC LIMIT 1
                 )
                 RETURNING id, raw_hex_data`
        );

        let entropyData = "";
        let entropyId = null;

        if (entRes.rowCount === 0) {
          entropyData = crypto.randomBytes(32).toString('hex');
        } else {
          entropyData = entRes.rows[0].raw_hex_data;
          entropyId = entRes.rows[0].id;
        }

        const serverSeedHash = crypto.createHash('sha256').update(entropyData).digest('hex');
        const selectedNumbers = bets.map(b => b.number);

        const insert = await client.query(
          `INSERT INTO bets (
                    session_id, amount_sat, payout_sat, selected_numbers, 
                    client_seed, server_seed_hash, server_seed_reveal, 
                    final_result, status, entropy_id, bet_details, invoice_id
                ) VALUES ($1, $2, 0, $3, $4, $5, NULL, NULL, 'WAITING_PAYMENT', $6, $7, $8) RETURNING id`,
          [
            sessionId, Number(totalBetAmount), selectedNumbers,
            clientSeed, serverSeedHash,
            entropyId, JSON.stringify(bets), charge.id
          ]
        );

        // Link entropy to this bet immediately?
        if (entropyId) {
          await client.query("UPDATE entropy_buffer SET consumed_by_bet_id = $1 WHERE id = $2", [insert.rows[0].id, entropyId]);
        }

        return {
          betId: insert.rows[0].id,
          paymentRequest: charge.lightning_invoice.payreq,
          chargeId: charge.id,
          amountSat: totalBetAmount,
          expiration: 600 // 10 mins
        };
      });

      return result;

    } catch (err: any) {
      req.log.error(err);
      return reply.status(500).send({ error: err.message || "Failed to create invoice" });
    }
  });
}
