import { FastifyInstance } from "fastify";
import { pool } from "../db/index.js";

export async function campaignRoutes(app: FastifyInstance) {
    // POST /v1/campaign/register
    app.post("/v1/campaign/register", async (req, reply) => {
        try {
            const { sessionId, rewardAddress } = req.body as { sessionId?: string, rewardAddress?: string };

            if (!sessionId || !rewardAddress) {
                return reply.status(400).send({ error: "Missing sessionId or rewardAddress" });
            }

            // Basic Address Validation (BTC L1 or Lightning Address)
            // RegEx for LN Address (user@domain.com) or BTC address (bc1...)
            const isLnAddress = /^[a-zA-Z0-9-._]+@[a-zA-Z0-9-.]+\.[a-zA-Z]{2,}$/.test(rewardAddress);
            const isBtcAddress = /^(bc1|[13])[a-zA-HJ-NP-Za-km-z1-9]{25,90}$/.test(rewardAddress);

            if (!isLnAddress && !isBtcAddress) {
                return reply.status(400).send({ error: "Invalid reward address format" });
            }

            // Check if session exists
            const sessionCheck = await pool.query("SELECT id FROM sessions WHERE id = $1", [sessionId]);
            if (sessionCheck.rowCount === 0) {
                return reply.status(404).send({ error: "Session not found" });
            }

            // Insert registration
            const res = await pool.query(
                "INSERT INTO reward_registrations (session_id, reward_address) VALUES ($1, $2) RETURNING id",
                [sessionId, rewardAddress]
            );

            return reply.send({
                message: "Registration successful",
                registrationId: res.rows[0].id
            });
        } catch (err: any) {
            req.log.error(err);
            if (err.code === '23505') { // Unique constraint violation
                return reply.status(409).send({ error: "Session already registered" });
            }
            return reply.status(500).send({ error: "Failed to register campaign" });
        }
    });

    // GET /v1/campaign/check?sessionId=...
    app.get("/v1/campaign/check", async (req, reply) => {
        try {
            const { sessionId } = req.query as { sessionId?: string };
            if (!sessionId) {
                return reply.status(400).send({ error: "Missing sessionId" });
            }

            // 1. Check if registered
            const regCheck = await pool.query(
                "SELECT reward_address FROM reward_registrations WHERE session_id = $1",
                [sessionId]
            );

            if (regCheck.rowCount === 0) {
                return reply.send({
                    registered: false,
                    totalContributed: 0
                });
            }

            const rewardAddress = regCheck.rows[0].reward_address;

            // 2. Aggregate STV (Total Contributed) for this rewardAddress
            // The logic: sum amount_sat from bets where session_id matches ANY session_id registered with the same reward_address
            const stvQuery = `
                SELECT COALESCE(SUM(amount_sat), 0) AS total_contributed
                FROM bets
                WHERE status IN ('WON', 'LOST')
                  AND session_id IN (
                    SELECT session_id 
                    FROM reward_registrations 
                    WHERE reward_address = $1
                  )
            `;
            const stvRes = await pool.query(stvQuery, [rewardAddress]);

            return reply.send({
                registered: true,
                rewardAddress: rewardAddress,
                totalContributed: parseInt(stvRes.rows[0].total_contributed, 10)
            });

        } catch (err: any) {
            req.log.error(err);
            return reply.status(500).send({ error: "Failed to check campaign status" });
        }
    });
}
