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
            // Get the last 50 completed or waiting bets for a session
            const res = await pool.query(
                `SELECT 
                    id, 
                    amount_sat, 
                    payout_sat, 
                    status, 
                    final_result as outcome, 
                    created_at
                 FROM bets 
                 WHERE session_id = $1
                 ORDER BY created_at DESC 
                 LIMIT 50`,
                [sessionId]
            );

            // Format amounts to Numbers
            const history = res.rows.map(row => ({
                id: row.id,
                amountSat: Number(row.amount_sat),
                payoutSat: Number(row.payout_sat),
                status: row.status,
                outcome: row.outcome,
                createdAt: row.created_at
            }));

            return { history };
        } catch (err) {
            req.log.error(err);
            return reply.status(500).send({ error: "Error fetching history" });
        }
    });
}
