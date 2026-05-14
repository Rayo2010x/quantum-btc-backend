import { FastifyInstance } from "fastify";
import { pool } from "../db/index.js";

export async function statisticsRoutes(app: FastifyInstance) {
    app.get<{ Querystring: { limit?: string; gameType?: string } }>("/v1/game/statistics", async (req, reply) => {
        try {
            const limitParam = req.query.limit;
            const gameType = req.query.gameType || 'roulette';
            
            let limitQuery = "";
            let queryParams: any[] = [gameType];
            let paramCounter = 2;

            if (limitParam && limitParam.toLowerCase() !== 'all') {
                const limitNum = parseInt(limitParam, 10);
                if (!isNaN(limitNum) && limitNum > 0) {
                    limitQuery = `ORDER BY created_at DESC LIMIT $${paramCounter}`;
                    queryParams.push(limitNum);
                    paramCounter++;
                }
            }

            // CTE to get the required set of bets
            const cte = `
                WITH recent_bets AS (
                    SELECT final_result, runs_count, run_results, bet_details
                    FROM bets
                    WHERE status IN ('WON', 'LOST')
                    AND game_type = $1
                    ${limitQuery}
                )
            `;

            // Get total completed bets based on the filtered set
            const totalRes = await pool.query(
                `${cte} SELECT COUNT(*) as total_bets, COALESCE(SUM(runs_count), 0) as total_runs FROM recent_bets`,
                queryParams
            );
            const totalBets = parseInt(totalRes.rows[0].total_bets, 10);
            const totalRuns = parseInt(totalRes.rows[0].total_runs, 10);

            // Get frequencies per number from the filtered set
            const freqRes = await pool.query(
                `${cte},
                 unpacked_runs AS (
                     SELECT 
                         final_result as outcome,
                         COALESCE((bet_details->0->>'rows')::int, 16) as rows
                     FROM recent_bets WHERE run_results IS NULL
                     UNION ALL
                     SELECT 
                         (r->>'outcome')::int as outcome,
                         COALESCE((bet_details->0->>'rows')::int, 16) as rows
                     FROM recent_bets, jsonb_array_elements(run_results->'runs') as r 
                     WHERE run_results IS NOT NULL
                 )
                 SELECT outcome as final_result, rows, COUNT(*) as count
                 FROM unpacked_runs
                 WHERE outcome IS NOT NULL
                 GROUP BY rows, outcome
                 ORDER BY rows ASC, outcome ASC`,
                queryParams
            );

            // Default frequencies object depending on game type
            const frequencies: Record<number, number> = {};
            const plinkoFrequencies: Record<number, Record<number, number>> = {
                8: {}, 12: {}, 16: {}
            };

            if (gameType === 'plinko') {
                for (let r of [8, 12, 16]) {
                    for (let i = 0; i <= r; i++) {
                        plinkoFrequencies[r][i] = 0;
                    }
                }
                for (const row of freqRes.rows) {
                    const r = parseInt(row.rows, 10);
                    if (plinkoFrequencies[r]) {
                        plinkoFrequencies[r][row.final_result] = parseInt(row.count, 10);
                    }
                }
            } else {
                for (let i = 0; i <= 36; i++) {
                    frequencies[i] = 0;
                }
                for (const row of freqRes.rows) {
                    frequencies[row.final_result] = parseInt(row.count, 10);
                }
            }

            return {
                totalBets,
                totalRuns,
                frequencies,
                ...(gameType === 'plinko' && { plinkoFrequencies })
            };
        } catch (err) {
            req.log.error(err);
            return reply.status(500).send({ error: "Error fetching statistics" });
        }
    });
}
