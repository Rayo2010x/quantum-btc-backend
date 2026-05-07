import { FastifyInstance } from "fastify";
import { pool } from "../db/index.js";
import { z } from "zod";

const HistoryQuerySchema = z.object({
    sessionId: z.string().uuid()
});

export async function historyRoutes(app: FastifyInstance) {
    app.get("/v1/game/history", async (req, reply) => {
        let sessionId: string;
        try {
            const parsed = HistoryQuerySchema.parse(req.query);
            sessionId = parsed.sessionId;
        } catch (e: any) {
            return reply.status(400).send({ error: e.errors || "Invalid sessionId" });
        }

        try {
            // Check if the session is registered to a reward address
            const regCheck = await pool.query(
                "SELECT reward_address FROM reward_registrations WHERE session_id = $1",
                [sessionId]
            );

            let betsRes;

            if (regCheck.rowCount && regCheck.rowCount > 0) {
                // Unified History: Get the last 20 bets across ALL sessions tied to this reward_address
                const rewardAddress = regCheck.rows[0].reward_address;
                betsRes = await pool.query(
                    `SELECT 
                        id, 
                        amount_sat, 
                        payout_sat, 
                        status, 
                        final_result as outcome, 
                        game_type,
                        created_at
                     FROM bets 
                     WHERE session_id IN (
                        SELECT session_id FROM reward_registrations WHERE reward_address = $1
                     )
                     ORDER BY created_at DESC 
                     LIMIT 20`,
                    [rewardAddress]
                );
            } else {
                // Standard History: Get the last 50 bets for this specific session
                betsRes = await pool.query(
                    `SELECT 
                        id, 
                        amount_sat, 
                        payout_sat, 
                        status, 
                        final_result as outcome, 
                        game_type,
                        created_at
                     FROM bets 
                     WHERE session_id = $1
                     ORDER BY created_at DESC 
                     LIMIT 50`,
                    [sessionId]
                );
            }

            // Format amounts to Numbers
            const history = betsRes.rows.map(row => ({
                id: row.id,
                amountSat: Number(row.amount_sat),
                payoutSat: Number(row.payout_sat),
                status: row.status,
                outcome: row.outcome,
                gameType: row.game_type,
                createdAt: row.created_at
            }));

            return { history };
        } catch (err) {
            req.log.error(err);
            return reply.status(500).send({ error: "Error fetching history" });
        }
    });
}
