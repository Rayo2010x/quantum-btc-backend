
import "dotenv/config";
import axios from "axios";
import crypto from "node:crypto";
import { pool } from "../src/db/index.js";

// Load secret from env
const SECRET = process.env.OPENNODE_HASHED_SECRET;
if (!SECRET) {
    console.error("❌ Missing OPENNODE_HASHED_SECRET in .env");
    process.exit(1);
}

async function testWebhook() {
    console.log("🔗 Starting Webhook Endpoint Test...");
    const client = await pool.connect();

    try {
        // 1. Create a mock Pending Transaction
        // We need a session first or use existing? Let's create one.
        const resSession = await client.query(`
            INSERT INTO sessions (current_balance_sat) VALUES (0) RETURNING id
        `);
        const sessionId = resSession.rows[0].id;
        console.log(`    ✅ Created Mock Session: ${sessionId}`);

        const mockChargeId = `test_charge_${crypto.randomBytes(4).toString("hex")}`;
        const amountSat = 1000;

        await client.query(`
            INSERT INTO transactions (session_id, type, amount_sat, provider_id, status)
            VALUES ($1, 'DEPOSIT', $2, $3, 'PENDING')
        `, [sessionId, amountSat, mockChargeId]);
        console.log(`    ✅ Created Mock Transaction (PENDING): ${mockChargeId}`);

        // 2. Generate Signature
        // Signature = HMAC-SHA256(id, secret)
        const hashedOrder = crypto
            .createHmac("sha256", SECRET!)
            .update(mockChargeId)
            .digest("hex");

        console.log(`    🔑 Generated Signature (hashed_order): ${hashedOrder}`);

        // 3. Send Webhook Request
        console.log("    🚀 Sending Webhook Request to localhost:3000...");

        try {
            const response = await axios.post("http://localhost:3000/v1/webhooks/opennode", {
                id: mockChargeId,
                status: "paid",
                hashed_order: hashedOrder
            }, {
                headers: { "Content-Type": "application/json" }
            });

            if (response.status === 200) {
                console.log("    ✅ Server responded with 200 OK");
            } else {
                console.error(`    ❌ Server responded with ${response.status}:`, response.data);
            }

        } catch (err: any) {
            console.error("    ❌ Failed to assert webhook request. Is the server running?");
            console.error("       Error:", err.message);
            if (err.code === "ECONNREFUSED") {
                console.log("       ⚠️  HINT: Run 'npm run dev' in a separate terminal.");
            }
            throw err;
        }

        // 4. Verify DB Update
        const resTx = await client.query(`
            SELECT status FROM transactions WHERE provider_id = $1
        `, [mockChargeId]);

        const txStatus = resTx.rows[0]?.status;
        console.log(`    🔍 DB Transaction Status: ${txStatus}`);

        if (txStatus === "PAID") {
            const resBal = await client.query(`SELECT current_balance_sat FROM sessions WHERE id = $1`, [sessionId]);
            const balance = resBal.rows[0].current_balance_sat;
            if (Number(balance) === 1000) {
                console.log(`    ✅ Balance Credited: ${balance}`);
                console.log("\n✅ WEBHOOK TEST PASSED");
            } else {
                console.error(`    ❌ Balance Mismatch: Expected 1000, got ${balance}`);
            }
        } else {
            console.error("    ❌ Transaction was NOT updated to PAID.");
        }

    } catch (err) {
        console.error("\n❌ Test Failed:", err);
    } finally {
        // Cleanup? Optional. Keeping data for inspection is good.
        client.release();
        await pool.end();
    }
}

testWebhook();
