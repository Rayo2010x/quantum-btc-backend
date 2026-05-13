
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
import { calculatePlinkoOutcome } from "../services/plinkoService.js";

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


        let outcome = 0;
        let totalPayout = 0n;
        const runsCount: number = bet.runs_count || 1;
        const runResults: any[] = [];

        if (runsCount === 1) {
          // === SINGLE-RUN PATH (backward compatible — no nonce appended) ===
          if (bet.game_type === 'plinko') {
            const b = bet.bet_details[0];
            const plinkoRes = calculatePlinkoOutcome(entropyData, bet.client_seed + drandRandomnessVal, b.rows, b.risk);
            outcome = plinkoRes.slot;
            totalPayout = BigInt(Math.floor(b.amount * plinkoRes.multiplier));
            runResults.push({
              run: 0,
              outcome: plinkoRes.slot,
              multiplier: plinkoRes.multiplier,
              path: plinkoRes.path,
              payout_sat: Number(totalPayout)
            });
          } else {
            // Roulette — single run (no nonce, preserves existing hash)
            const combined = crypto
              .createHash("sha256")
              .update(entropyData)
              .update(bet.client_seed)
              .update(drandRandomnessVal)
              .digest("hex");
            const intValue = parseInt(combined.substring(0, 8), 16);
            outcome = intValue % 37;

            const betsList = bet.bet_details; // JSONB
            if (Array.isArray(betsList)) {
              for (const b of betsList) {
                const targetNumbers: number[] = b.numbers || (b.number !== undefined ? [b.number] : []);
                if (targetNumbers.includes(outcome)) {
                  const multiplier = BigInt(Math.floor(36 / targetNumbers.length));
                  totalPayout += BigInt(b.amount) * multiplier;
                }
              }
            }
            runResults.push({
              run: 0,
              outcome,
              payout_sat: Number(totalPayout)
            });
          }
        } else {
          // === MULTI-RUN PATH (nonce-based entropy derivation) ===
          for (let i = 0; i < runsCount; i++) {
            if (bet.game_type === 'plinko') {
              const b = bet.bet_details[0];
              const amountPerRun = Number(bet.amount_sat) / runsCount;
              // Append nonce i to the clientSeed component
              const plinkoRes = calculatePlinkoOutcome(
                entropyData,
                bet.client_seed + drandRandomnessVal + i.toString(),
                b.rows, b.risk
              );
              const runPayout = amountPerRun * plinkoRes.multiplier; // Precise — no rounding per run
              runResults.push({
                run: i,
                outcome: plinkoRes.slot,
                multiplier: plinkoRes.multiplier,
                path: plinkoRes.path,
                payout_sat: runPayout // Precise float; total is floored once at the end
              });
            } else {
              // Roulette — nonce-based entropy per run
              const combined = crypto
                .createHash("sha256")
                .update(entropyData)
                .update(bet.client_seed)
                .update(drandRandomnessVal)
                .update(i.toString())  // <-- Nonce for this run
                .digest("hex");
              const intValue = parseInt(combined.substring(0, 8), 16);
              const runOutcome = intValue % 37;

              let runPayout = 0;
              const betsList = bet.bet_details;
              if (Array.isArray(betsList)) {
                for (const b of betsList) {
                  const amountPerRun = b.amount / runsCount;
                  const targetNumbers: number[] = b.numbers || (b.number !== undefined ? [b.number] : []);
                  if (targetNumbers.includes(runOutcome)) {
                    const multiplier = 36 / targetNumbers.length;
                    runPayout += amountPerRun * multiplier;
                  }
                }
              }
              runResults.push({
                run: i,
                outcome: runOutcome,
                payout_sat: runPayout
              });
            }
          }

          // Single floor on the aggregate — no per-run rounding error
          const preciseTotal = runResults.reduce((sum: number, r: any) => sum + r.payout_sat, 0);
          totalPayout = BigInt(Math.floor(preciseTotal));
          outcome = runResults[0].outcome; // Primary outcome for final_result column
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

        // 5. Update Bet (includes run_results JSONB)
        const runResultsJson = runsCount > 1 ? JSON.stringify({ runs: runResults }) : null;
        await client.query(
          `UPDATE bets 
                 SET status = $1, final_result = $2, payout_sat = $3, 
                     server_seed_reveal = $4, withdrawal_token_id = $5,
                     drand_round = $6, drand_randomness = $7, drand_signature = $8,
                     run_results = $9
                 WHERE id = $10`,
          [
            finalStatus, outcome, BigInt(totalPayout), entropyData, withdrawalTokenId,
            drandData?.round || null, drandData?.randomness || null, drandData?.signature || null,
            runResultsJson,
            bet.id
          ]
        );

        console.log(`🏁 Game Finished. Result: ${finalStatus}, Outcome: ${outcome}, Payout: ${totalPayout}, Runs: ${runsCount}`);

        // Broadcast Result via Websocket!
        broadcastGameResult(bet.id, {
          status: finalStatus,
          outcome,
          payoutSat: totalPayout.toString(),
          serverSeedReveal: entropyData,
          withdrawalTokenId: withdrawalTokenId,
          drandRound: drandData?.round || null,
          drandRandomness: drandData?.randomness || null,
          drandSignature: drandData?.signature || null,
          runsCount,
          runResults
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
