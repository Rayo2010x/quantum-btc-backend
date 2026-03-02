
import { FastifyInstance } from "fastify";
import { pool } from "../db/index.js";
import { OpenNode } from "../services/opennode.js";
import { env } from "../config/env.js";
import { decode } from "light-bolt11-decoder";

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
    // GET or POST /v1/lnurl/callback?k1=...&pr=...
    app.route({
        method: ['GET', 'POST'],
        url: '/v1/lnurl/callback',
        handler: async (req, reply) => {
            // Support params in query (standard) or body (fallback)
            const query = req.query as { k1?: string, pr?: string };
            const body = req.body as { k1?: string, pr?: string } | undefined;

            const k1 = query.k1 || body?.k1;
            const pr = query.pr || body?.pr;

            if (!k1 || !pr) return reply.status(400).send({ status: "ERROR", reason: "Missing params" });

            // Validate Invoice Amount
            let invoiceAmountMsat = 0;
            try {
                const decoded = decode(pr);
                const amountSection = decoded.sections.find((s: any) => s.name === 'amount');
                if (amountSection && (amountSection as any).value) {
                    invoiceAmountMsat = parseInt((amountSection as any).value, 10);
                }
            } catch (err) {
                app.log.error({ msg: "Failed to decode PR", pr, err });
                return reply.send({ status: "ERROR", reason: "Invalid invoice" });
            }

            const client = await pool.connect();
            try {
                await client.query("BEGIN");

                // Re-check lock & Expiration
                const res = await client.query(
                    "SELECT * FROM withdrawal_tokens WHERE k1 = $1 AND is_used = FALSE AND expires_at > NOW() FOR UPDATE",
                    [k1]
                );

                if (res.rowCount === 0) {
                    await client.query("ROLLBACK");
                    return reply.send({ status: "ERROR", reason: "Token used, invalid, or expired" });
                }

                const token = res.rows[0];
                const maxWithdrawableMsat = BigInt(token.amount_sat) * 1000n;

                // Amount Check
                // We allow a small buffer? No, strict check. 
                // Invoice amount must be <= token amount.
                // Usually user scans exact amount. 
                // LUD-03 says: "The amount in the invoice must be less than or equal to maxWithdrawable"
                if (BigInt(invoiceAmountMsat) > maxWithdrawableMsat) {
                    await client.query("ROLLBACK");
                    app.log.warn({
                        msg: "LNURL Amount Mismatch",
                        invoice: invoiceAmountMsat,
                        max: maxWithdrawableMsat,
                        k1
                    });
                    return reply.send({ status: "ERROR", reason: "Invoice amount exceeds withdrawable limit" });
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
        },
    });
}
