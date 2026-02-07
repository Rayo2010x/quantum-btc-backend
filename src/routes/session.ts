
import { FastifyInstance } from "fastify";
import { pool } from "../db/index.js";

export async function sessionRoutes(app: FastifyInstance) {
    // POST /v1/session/init
    // Create a new session, optionally with demo balance for testing
    app.post("/v1/session/init", async (req, reply) => {
        try {
            // Fastify 'req.ip' is reliable when trustProxy: true
            const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

            req.log.info({
                msg: "Session Init IP Debug",
                reqIp: req.ip,
                xForwardedFor: req.headers['x-forwarded-for'],
                remoteAddress: req.socket.remoteAddress,
                resolvedIp: ipAddress
            });

            // Ensure we handle array or comma-separated strings if we fell back to headers
            let finalIp = Array.isArray(ipAddress) ? ipAddress[0] : ipAddress;
            if (typeof finalIp === 'string' && finalIp.includes(',')) {
                finalIp = finalIp.split(',')[0].trim();
            }

            const res = await pool.query(
                "INSERT INTO sessions (ip_address) VALUES ($1) RETURNING id",
                [finalIp]
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
