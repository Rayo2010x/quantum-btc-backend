
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { pool } from "../db/index.js";
import { OpenNode } from "../services/opennode.js";

const WebhookSchema = z.object({
  id: z.string(),
  status: z.string(),
  hashed_order: z.string().optional(), // It seems OpenNode might send this inside data or top level? Assuming top level for MVP based on manual
  price: z.number().optional(), // Amount in BTC?
  fee: z.number().optional(),
  fiat_value: z.number().optional(),
});

import { withTx } from "../db/index.js";
import crypto from "node:crypto";

export async function webhookRoutes(app: FastifyInstance) {
  app.post("/v1/webhooks/opennode", async (req, reply) => {
    // 1. Verify HMAC
    const body = req.body as any;
    const { id, status, hashed_order } = body;
    console.log(`🪝 Webhook received for ID: ${id}, Status: ${status}`);

    // Optional: Real verification
    if (!OpenNode.verifySignature(id, hashed_order)) {
      console.warn(`❌ Invalid Webhook Signature: ${id}`);
      // Log what we have vs what we expected if possible? No, verifySignature hides it.
      return reply.status(400).send({ error: "Invalid Signature" });
    }
    console.log(`✅ Signature verified for ID: ${id}`);

    if (status !== 'paid') {
      return { ok: true, ignored: true };
    }

    try {
      await withTx(async (client) => {
        // 2. Find Associated Bet
        const betRes = await client.query("SELECT * FROM bets WHERE invoice_id = $1 FOR UPDATE", [id]);

        if ((betRes.rowCount || 0) === 0) {
          console.log(`ℹ️ No bet found for Invoice ID: ${id}. Checking transactions...`);
          // Might be a deposit/regular transaction, check 'transactions' (Legacy/Hybrid support)
          const res = await client.query("SELECT * FROM transactions WHERE provider_id = $1", [id]);
          if ((res.rowCount || 0) > 0) {
            await client.query("UPDATE transactions SET status = 'PAID' WHERE provider_id = $1", [id]);
            // Update session balance... (Legacy flow)
          }
          return { ok: true, type: "transaction" };
        }

        const bet = betRes.rows[0];
        console.log(`🎰 Bet found: ${bet.id}, Current Status: ${bet.status}`);

        if (bet.status !== 'WAITING_PAYMENT') {
          console.log(`⚠️ Bet already processed or invalid status: ${bet.status}`);
          return { ok: true, idempotent: true };
        }

        console.log(`🎲 Executing Game Logic for Bet: ${bet.id}...`);

        // 3. Execute Game Logic
        // Retrieve Entropy from Buffer (It was reserved/linked in bet.entropy_id)
        let entropyData = "";

        if (bet.entropy_id) {
          const entRes = await client.query("SELECT raw_hex_data FROM entropy_buffer WHERE id = $1", [bet.entropy_id]);
          if ((entRes.rowCount || 0) > 0) {
            entropyData = entRes.rows[0].raw_hex_data;
          }
        }
        if (!entropyData) {
          // Fallback (Should not happen if flow correct)
          entropyData = crypto.randomBytes(32).toString('hex');
        }

        // Server Reveal = entropyData
        // Calculate Outcome
        // Need: server_seed (entropy), client_seed

        // Re-implement calculateOutcome helper here or reuse
        const combined = crypto
          .createHash("sha256")
          .update(entropyData)
          .update(bet.client_seed)
          .digest("hex");
        const intValue = parseInt(combined.substring(0, 8), 16);
        const outcome = intValue % 37;

        // Check Win
        const betsList = bet.bet_details; // JSONB
        let totalPayout = 0n;

        // betsList is array of { number, amount }
        if (Array.isArray(betsList)) {
          for (const b of betsList) {
            if (b.number === outcome) {
              totalPayout += BigInt(b.amount) * 36n;
            }
          }
        }

        const isWin = totalPayout > 0n;
        const finalStatus = isWin ? 'WON' : 'LOST';

        // 4. If Won, Generate Withdrawal Token (LNURL)
        let withdrawalTokenId = null;
        if (isWin) {
          const importCrypto = await import("node:crypto");
          const k1 = importCrypto.randomBytes(32).toString('hex');

          const tokenRes = await client.query(
            `INSERT INTO withdrawal_tokens (session_id, k1, amount_sat, expires_at)
                     VALUES ($1, $2, $3, NOW() + INTERVAL '24 hours') RETURNING id`,
            [bet.session_id, k1, BigInt(totalPayout)]
          );
          withdrawalTokenId = tokenRes.rows[0].id;
        }

        // 5. Update Bet
        await client.query(
          `UPDATE bets 
                 SET status = $1, final_result = $2, payout_sat = $3, 
                     server_seed_reveal = $4, withdrawal_token_id = $5 
                 WHERE id = $6`,
          [finalStatus, outcome, BigInt(totalPayout), entropyData, withdrawalTokenId, bet.id]
        );

        console.log(`🏁 Game Finished. Result: ${finalStatus}, Outcome: ${outcome}, Payout: ${totalPayout}`);
        return { ok: true, betId: bet.id, result: finalStatus };
      });

      return { ok: true };

    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Processing failed" });
    }
  });
}
