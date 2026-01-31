
import { FastifyInstance } from "fastify";
import { pool } from "../db/index.js";

export async function sessionRoutes(app: FastifyInstance) {
    // POST /v1/session/init
    // Create a new session, optionally with demo balance for testing
    app.post("/v1/session/init", async (req, reply) => {
        try {
            const res = await pool.query(
                "INSERT INTO sessions DEFAULT VALUES RETURNING id"
            );

            const session = res.rows[0];

            return {
                sessionId: session.id,
                message: "Session initialized (Non-Custodial)"
            };
        } catch (err: any) {
            req.log.error(err);
            return reply.status(500).send({ error: "Failed to init session" });
        }
    });
}
