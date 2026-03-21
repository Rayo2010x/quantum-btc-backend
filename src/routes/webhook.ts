
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
import { broadcastGameResult } from "../services/websocket.js";
import { fetchDrandLatest } from "../services/drand.js";
import { syncBankrollBalance } from "../services/bankroll_worker.js";

export async function webhookRoutes(app: FastifyInstance) {
  app.post("/v1/webhooks/opennode", {
    config: {
      rateLimit: {
        max: 20,
        timeWindow: "1 minute"
      }
    }
  }, async (req, reply) => {
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
      // Fetch Drand Public Randomness BEFORE acquiring DB lock (Prevent PG Pool Exhaustion)
      const drandData = await fetchDrandLatest(1500);
      let drandRandomnessVal = drandData ? drandData.randomness : `DRAND_UNAVAILABLE_${Date.now()}`;

      await withTx(async (client) => {
        // 1.5 Check if it's a Donation
        const donationRes = await client.query("SELECT * FROM donations WHERE charge_id = $1 FOR UPDATE", [id]);
        if ((donationRes.rowCount || 0) > 0) {
          const donation = donationRes.rows[0];
          if (donation.status === 'pending') {
            console.log(`💖 Donation ${donation.id} paid!`);
            await client.query("UPDATE donations SET status = 'paid' WHERE id = $1", [donation.id]);
          } else {
            console.log(`ℹ️ Donation ${donation.id} already paid.`);
          }
          return { ok: true, type: "donation" };
        }

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

        // Drand Public Randomness already fetched outside of transaction


        // Server Reveal = entropyData
        // Calculate Outcome
        // Need: server_seed (entropy), client_seed, drand_randomness

        // Re-implement calculateOutcome helper here or reuse
        const combined = crypto
          .createHash("sha256")
          .update(entropyData)
          .update(bet.client_seed)
          .update(drandRandomnessVal)
          .digest("hex");
        const intValue = parseInt(combined.substring(0, 8), 16);
        const outcome = intValue % 37;

        // Check Win
        const betsList = bet.bet_details; // JSONB
        let totalPayout = 0n;

        // betsList is array of { numbers: number[], amount: number }
        if (Array.isArray(betsList)) {
          for (const b of betsList) {
            // Because MVP originally used `number: number`, handle both for backwards compatibility
            // if legacy records exist, though DB was wiped/migrated ideally.
            const targetNumbers: number[] = b.numbers || (b.number !== undefined ? [b.number] : []);

            if (targetNumbers.includes(outcome)) {
              // Calculate dynamic multiplier based on the spread of numbers
              // e.g., Straight (1 number) = 36x, Red (18 numbers) = 2x, Dozen (12 numbers) = 3x
              const multiplier = BigInt(Math.floor(36 / targetNumbers.length));
              totalPayout += BigInt(b.amount) * multiplier;
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
                     server_seed_reveal = $4, withdrawal_token_id = $5,
                     drand_round = $6, drand_randomness = $7, drand_signature = $8
                 WHERE id = $9`,
          [
            finalStatus, outcome, BigInt(totalPayout), entropyData, withdrawalTokenId,
            drandData?.round || null, drandData?.randomness || null, drandData?.signature || null,
            bet.id
          ]
        );

        console.log(`🏁 Game Finished. Result: ${finalStatus}, Outcome: ${outcome}, Payout: ${totalPayout}`);
        console.log(`🏁 Game Finished. Result: ${finalStatus}, Outcome: ${outcome}, Payout: ${totalPayout}`);

        // Broadcast Result via Websocket!
        broadcastGameResult(bet.id, {
          status: finalStatus,
          outcome,
          payoutSat: totalPayout.toString(),
          serverSeedReveal: entropyData,
          withdrawalTokenId: withdrawalTokenId,
          drandRound: drandData?.round || null,
          drandRandomness: drandData?.randomness || null,
          drandSignature: drandData?.signature || null
        });

        return { ok: true, betId: bet.id, result: finalStatus };
      });

      // Asynchronously trigger Bankroll Sync after successful deposit + game resolution
      syncBankrollBalance().catch(err => app.log.error("Bankroll Sync Error:", err));

      return { ok: true };

    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Processing failed" });
    }
  });
}
