
import { FastifyInstance } from "fastify";
import { pool } from "../db/index.js";
import { OpenNode } from "../services/opennode.js";
import { env } from "../config/env.js";

export async function lnurlRoutes(app: FastifyInstance) {

    // Step 1: Wallet requests URL details
    // GET /v1/lnurl/withdraw?k1=...
    app.get("/v1/lnurl/withdraw", async (req, reply) => {
        const { k1 } = req.query as { k1: string };

        if (!k1) return reply.status(400).send({ status: "ERROR", reason: "Missing k1" });

        // Validate Token
        const res = await pool.query(
            "SELECT * FROM withdrawal_tokens WHERE k1 = $1 AND is_used = FALSE AND expires_at > NOW()",
            [k1]
        );

        if (res.rowCount === 0) {
            return reply.status(400).send({ status: "ERROR", reason: "Token invalid or expired" });
        }

        const token = res.rows[0];

        console.log(`⚡ LNURL-Withdraw Step 1: k1=${k1}`);
        const baseUrl = env.PUBLIC_URL.replace(/\/$/, "");
        return {
            tag: "withdrawRequest",
            callback: `${baseUrl}/v1/lnurl/callback`,
            k1: k1,
            defaultDescription: "Quantum BTC Winnings",
            minWithdrawable: Number(token.amount_sat) * 1000, // millisats
            maxWithdrawable: Number(token.amount_sat) * 1000  // Exact amount
        };
    });

    // Step 2: Wallet sends Invoice
    // GET /v1/lnurl/callback?k1=...&pr=...
    app.get("/v1/lnurl/callback", async (req, reply) => {
        const { k1, pr } = req.query as { k1: string, pr: string };
        console.log(`⚡ LNURL-Withdraw Step 2: k1=${k1}, pr=${pr}`);

        if (!k1 || !pr) return reply.status(400).send({ status: "ERROR", reason: "Missing params" });

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Re-check lock
            const res = await client.query(
                "SELECT * FROM withdrawal_tokens WHERE k1 = $1 AND is_used = FALSE FOR UPDATE",
                [k1]
            );

            if (res.rowCount === 0) {
                await client.query("ROLLBACK");
                return reply.send({ status: "ERROR", reason: "Token used or invalid" });
            }

            // Mark used
            await client.query("UPDATE withdrawal_tokens SET is_used = TRUE WHERE id = $1", [res.rows[0].id]);

            // Call OpenNode to Pay
            // Note: If OpenNode fails, we "burned" the token. 
            // Better: Keep 'PENDING' state in db? For MVP, we presume success or manual fix.
            await OpenNode.payInvoice(pr);

            await client.query("COMMIT");
            return { status: "OK" };

        } catch (err: any) {
            await client.query("ROLLBACK");
            app.log.error(err);
            return reply.send({ status: "ERROR", reason: err.message || "Payment Failed" });
        } finally {
            client.release();
        }
    });
}
