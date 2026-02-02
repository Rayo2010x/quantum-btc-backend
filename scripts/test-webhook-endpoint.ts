
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
    console.log("🔗 Starting Webhook Endpoint Test (Bet Flow)...");
    const client = await pool.connect();

    try {
        // 1. Create a mock Session
        const resSession = await client.query(`
            INSERT INTO sessions DEFAULT VALUES RETURNING id
        `);
        const sessionId = resSession.rows[0].id;
        console.log(`    ✅ Created Mock Session: ${sessionId}`);

        const mockChargeId = `test_charge_${crypto.randomBytes(4).toString("hex")}`;
        const amountSat = 100;

        // Mock Client Seed
        const clientSeed = "test-client-seed";
        const serverSeedHash = crypto.createHash('sha256').update("test-entropy").digest('hex');

        // 2. Insert Mock BET (WAITING_PAYMENT)
        await client.query(`
            INSERT INTO bets (
                session_id, amount_sat, payout_sat, selected_numbers, 
                client_seed, server_seed_hash, final_result, status, bet_details, invoice_id
            ) VALUES ($1, $2, 0, $3, $4, $5, NULL, 'WAITING_PAYMENT', $6, $7)
        `, [
            sessionId,
            amountSat,
            [1], // Selected numbers (Array literal for PG)
            clientSeed,
            serverSeedHash,
            JSON.stringify([{ number: 1, amount: 100 }]), // bet_details
            mockChargeId
        ]);

        console.log(`    ✅ Created Mock Bet (WAITING_PAYMENT): ${mockChargeId}`);

        // 3. Generate Signature
        const hashedOrder = crypto
            .createHmac("sha256", SECRET!)
            .update(mockChargeId)
            .digest("hex");

        console.log(`    🔑 Generated Signature (hashed_order): ${hashedOrder}`);

        // 4. Send Webhook Request
        const targetUrl = process.argv[2] || "http://localhost:3000";
        console.log(`    🚀 Sending Webhook Request to ${targetUrl}/v1/webhooks/opennode...`);

        try {
            const response = await axios.post(`${targetUrl}/v1/webhooks/opennode`, {
                id: mockChargeId,
                status: "paid",
                hashed_order: hashedOrder
            }, {
                headers: { "Content-Type": "application/json" }
            });

            if (response.status === 200) {
                console.log("    ✅ Server responded with 200 OK");
                if (response.data.ignored) {
                    console.warn("    ⚠️  Server IGNORED the webhook (check logic).");
                }
            } else {
                console.error(`    ❌ Server responded with ${response.status}:`, response.data);
            }

        } catch (err: any) {
            console.error("    ❌ Webhook POST Failed:", err.message);
            if (err.response) {
                console.error("       Data:", err.response.data);
            }
            throw err;
        }

        // 5. Verify DB Update
        // Wait a bit? Webhook processing might be sync though.
        const resBet = await client.query(`
            SELECT status, final_result FROM bets WHERE invoice_id = $1
        `, [mockChargeId]);

        const bet = resBet.rows[0];
        console.log(`    🔍 DB Bet Status: ${bet?.status}, Result: ${bet?.final_result}`);

        if (bet?.status === "WON" || bet?.status === "LOST") {
            console.log(`    ✅ Bet processed! Outcome: ${bet.final_result}`);
            console.log("\n✅ WEBHOOK TEST PASSED");
        } else {
            console.error("    ❌ Bet was NOT updated (Still WAITING_PAYMENT?).");
        }

    } catch (err) {
        console.error("\n❌ Test Failed:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

testWebhook();
