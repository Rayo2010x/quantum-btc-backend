
import { FastifyInstance } from "fastify";
import { pool } from "../db/index.js";
import { z } from "zod";
import lnurl from "lnurl";
import { env } from "../config/env.js";

export async function gameStatusRoutes(app: FastifyInstance) {
    app.get("/v1/game/bet/:betId/status", async (req, reply) => {
        const { betId } = req.params as { betId: string };

        try {
            const res = await pool.query(
                `SELECT b.status, b.final_result, b.payout_sat, b.server_seed_reveal, b.bet_details,
                        b.client_seed, b.drand_round, b.drand_randomness, b.drand_signature,
                        wt.k1 
                 FROM bets b
                 LEFT JOIN withdrawal_tokens wt ON b.withdrawal_token_id = wt.id
                 WHERE b.id = $1`,
                [betId]
            );

            if (res.rowCount === 0) {
                return reply.status(404).send({ error: "Bet not found" });
            }

            const bet = res.rows[0];

            // If still waiting, valid response, just status is WAITING
            if (bet.status === 'WAITING_PAYMENT') {
                return { status: 'WAITING_PAYMENT' };
            }

            // If finished
            let lnurlWithdraw = null;
            if (bet.status === 'WON' && bet.k1) {
                // Construct LNURL
                // Actually return the k1/url directly so frontend renders QR
                const rawUrl = `${env.PUBLIC_URL}/v1/lnurl/withdraw?k1=${bet.k1}`;
                lnurlWithdraw = lnurl.encode(rawUrl).toUpperCase();
            }

            return {
                status: bet.status,
                outcome: bet.final_result,
                payoutSat: Number(bet.payout_sat),
                serverSeedReveal: bet.server_seed_reveal,
                clientSeed: bet.client_seed,
                drandRound: bet.drand_round,
                drandRandomness: bet.drand_randomness,
                drandSignature: bet.drand_signature,
                lnurlWithdraw,
                k1: bet.k1
            };

        } catch (err) {
            req.log.error(err);
            return reply.status(500).send({ error: "Error checking status" });
        }
    });
}
