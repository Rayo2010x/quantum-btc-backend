import { FastifyInstance } from "fastify";
import { pool } from "../db/index.js";

export async function statisticsRoutes(app: FastifyInstance) {
    app.get<{ Querystring: { limit?: string } }>("/v1/game/statistics", async (req, reply) => {
        try {
            const limitParam = req.query.limit;
            let limitQuery = "";
            let queryParams: any[] = [];

            if (limitParam && limitParam.toLowerCase() !== 'all') {
                const limitNum = parseInt(limitParam, 10);
                if (!isNaN(limitNum) && limitNum > 0) {
                    limitQuery = "ORDER BY created_at DESC LIMIT $1";
                    queryParams.push(limitNum);
                }
            }

            // CTE to get the required set of bets
            const cte = `
                WITH recent_bets AS (
                    SELECT final_result
                    FROM bets
                    WHERE final_result IS NOT NULL
                    ${limitQuery}
                )
            `;

            // Get total completed bets based on the filtered set
            const totalRes = await pool.query(
                `${cte} SELECT COUNT(*) as total_bets FROM recent_bets`,
                queryParams
            );
            const totalBets = parseInt(totalRes.rows[0].total_bets, 10);

            // Get frequencies per number from the filtered set
            const freqRes = await pool.query(
                `${cte} 
                 SELECT final_result, COUNT(*) as count
                 FROM recent_bets
                 GROUP BY final_result
                 ORDER BY final_result ASC`,
                queryParams
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
