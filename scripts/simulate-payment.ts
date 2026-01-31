
import "dotenv/config";
import pg from "pg";
import crypto from "node:crypto";
import axios from "axios";

const { Pool } = pg;

async function main() {
    console.log("🚀 Simulating Payment...");

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for many cloud DB connections from local
    });

    try {
        // 1. Find the pending bet
        const res = await pool.query(
            "SELECT * FROM bets WHERE status = 'WAITING_PAYMENT' ORDER BY created_at DESC LIMIT 1"
        );

        if (res.rowCount === 0) {
            console.error("❌ No pending bets found!");
            process.exit(1);
        }

        const bet = res.rows[0];
        const invoiceId = bet.invoice_id;
        console.log(`✅ Found pending bet: ${bet.id} with Invoice: ${invoiceId}`);

        // 2. Generate Signature
        const secret = process.env.OPENNODE_HASHED_SECRET;
        if (!secret) throw new Error("Missing OPENNODE_HASHED_SECRET");

        const hashedOrder = crypto
            .createHmac("sha256", secret)
            .update(invoiceId)
            .digest("hex");

        console.log(`🔐 Generated Signature: ${hashedOrder}`);

        // 3. Send Webhook
        const webhookUrl = `http://localhost:${process.env.PORT || 3000}/v1/webhooks/opennode`;
        console.log(`📡 Sending webhook to ${webhookUrl}...`);

        try {
            const response = await axios.post(webhookUrl, {
                id: invoiceId,
                status: 'paid',
                hashed_order: hashedOrder
            });
            console.log("✅ Webhook Success:", response.data);
        } catch (err: any) {
            console.error("❌ Webhook Failed:", err.response?.data || err.message);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

main();
