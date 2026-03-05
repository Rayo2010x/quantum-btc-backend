import { FastifyInstance } from "fastify";
import { pool } from "../db/index.js";

export async function statisticsRoutes(app: FastifyInstance) {
    app.get("/v1/game/statistics", async (req, reply) => {
        try {
            // Get total completed bets
            const totalRes = await pool.query(
                `SELECT COUNT(*) as total_bets FROM bets WHERE final_result IS NOT NULL`
            );
            const totalBets = parseInt(totalRes.rows[0].total_bets, 10);

            // Get frequencies per number
            const freqRes = await pool.query(
                `SELECT final_result, COUNT(*) as count
                 FROM bets
                 WHERE final_result IS NOT NULL
                 GROUP BY final_result
                 ORDER BY final_result ASC`
            );

            // Default frequencies object from 0 to 36
            const frequencies: Record<number, number> = {};
            for (let i = 0; i <= 36; i++) {
                frequencies[i] = 0;
            }

            // Populate from DB results
            for (const row of freqRes.rows) {
                frequencies[row.final_result] = parseInt(row.count, 10);
            }

            return {
                totalBets,
                frequencies
            };
        } catch (err) {
            req.log.error(err);
            return reply.status(500).send({ error: "Error fetching statistics" });
        }
    });
}
