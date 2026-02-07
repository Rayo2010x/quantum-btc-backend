
import { FastifyInstance } from "fastify";
import { pool } from "../db/index.js";

export async function sessionRoutes(app: FastifyInstance) {
    // POST /v1/session/init
    // Create a new session OR validate existing one against IP
    app.post("/v1/session/init", async (req, reply) => {
        try {
            // Fastify 'req.ip' is reliable when trustProxy: true
            const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

            // Ensure we handle array or comma-separated strings if we fell back to headers
            let finalIp = Array.isArray(ipAddress) ? ipAddress[0] : ipAddress;
            if (typeof finalIp === 'string' && finalIp.includes(',')) {
                finalIp = finalIp.split(',')[0].trim();
            }

            // Check if client claims an existing session
            const body = req.body as { sessionId?: string };
            const existingId = body?.sessionId;

            if (existingId) {
                const check = await pool.query(
                    "SELECT id, ip_address FROM sessions WHERE id = $1",
                    [existingId]
                );

                if ((check.rowCount ?? 0) > 0) {
                    const session = check.rows[0];
                    // STRICT IP CHECK:
                    // If the stored IP matches the current IP, we return the same ID.
                    // If not, we fall through to create a new one.
                    if (session.ip_address === finalIp) {
                        return {
                            sessionId: session.id,
                            message: "Session Verified (IP Match)"
                        };
                    } else {
                        req.log.info({
                            msg: "Session IP Mismatch - Rotating ID",
                            oldIp: session.ip_address,
                            newIp: finalIp,
                            sessionId: existingId
                        });
                    }
                }
            }

            // Create NEW session (Default fall-through)
            const res = await pool.query(
                "INSERT INTO sessions (ip_address) VALUES ($1) RETURNING id",
                [finalIp]
            );

            const session = res.rows[0];

            return {
                sessionId: session.id,
                message: "New Session Initialized (Non-Custodial)"
            };
        } catch (err: any) {
            req.log.error(err);
            return reply.status(500).send({ error: "Failed to init session" });
        }
    });
}
