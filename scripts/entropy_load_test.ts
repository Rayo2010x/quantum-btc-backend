import "dotenv/config";
import { pool, withTx } from "../src/db/index.js";
import crypto from "node:crypto";
import { fetchDrandLatest } from "../src/services/drand.js";

async function simulateWebhookResolution(betId: string) {
    try {
        // Fetch drand ahead of time to match production optimization
        const drandData = await fetchDrandLatest(1500);
        const drandRandomnessVal = drandData ? drandData.randomness : `DRAND_${Date.now()}`;

        await withTx(async (client) => {
            const betRes = await client.query("SELECT * FROM bets WHERE id = $1 FOR UPDATE", [betId]);
            if (betRes.rowCount === 0) return;
            const bet = betRes.rows[0];

            if (bet.status !== 'WAITING_PAYMENT') return;

            // Fetch entropy
            let entropyData = "";
            if (bet.entropy_id) {
                const entRes = await client.query("SELECT raw_hex_data FROM entropy_buffer WHERE id = $1", [bet.entropy_id]);
                if ((entRes.rowCount || 0) > 0) {
                    entropyData = entRes.rows[0].raw_hex_data;
                }
            }

            // Drand public randomness (pre-fetched outside TX)

            const combined = crypto
                .createHash("sha256")
                .update(entropyData || crypto.randomBytes(32).toString('hex'))
                .update(bet.client_seed)
                .update(drandRandomnessVal)
                .digest("hex");
            const intValue = parseInt(combined.substring(0, 8), 16);
            const outcome = intValue % 37;

            // Update Bet correctly
            await client.query(
                `UPDATE bets SET status = $1, final_result = $2, drand_randomness = $3 WHERE id = $4`,
                ['WON', outcome, drandRandomnessVal, betId]
            );
        });
        return { success: true, betId };
    } catch (err: any) {
        return { success: false, betId, error: err.message };
    }
}

async function runTest() {
    console.log("🚀 Starting Entropy Load Test...");
    const TEST_SIZE = 50;

    // Create a dummy session
    const sessionRes = await pool.query("INSERT INTO sessions (ip_address) VALUES ('127.0.0.1') RETURNING id");
    const sessionId = sessionRes.rows[0].id;

    console.log(`Creating ${TEST_SIZE} dummy bets...`);
    const betIds = [];

    for (let i = 0; i < TEST_SIZE; i++) {
        // Sequentially emulate placement of bets to drain the buffer naturally, 
        // triggering the entropy_worker via DB changes asynchronously.
        const entRes = await pool.query(`
            UPDATE entropy_buffer 
            SET is_consumed = TRUE, consumed_by_bet_id = NULL 
            WHERE id = (SELECT id FROM entropy_buffer WHERE is_consumed = FALSE ORDER BY created_at ASC LIMIT 1)
            RETURNING id, raw_hex_data
        `);

        let entropyId = (entRes.rowCount || 0) > 0 ? entRes.rows[0].id : null;
        let entropyData = (entRes.rowCount || 0) > 0 ? entRes.rows[0].raw_hex_data : crypto.randomBytes(32).toString('hex');
        const serverSeedHash = crypto.createHash('sha256').update(entropyData).digest('hex');

        const res = await pool.query(`
            INSERT INTO bets (session_id, amount_sat, payout_sat, selected_numbers, client_seed, status, entropy_id, invoice_id, server_seed_hash) 
            VALUES ($1, 1000, 0, '{1}', 'load_test_seed', 'WAITING_PAYMENT', $2, $3, $4) RETURNING id
        `, [sessionId, entropyId, `load_invoice_${Date.now()}_${i}`, serverSeedHash]);

        const betId = res.rows[0].id;
        betIds.push(betId);

        if (entropyId) {
            await pool.query("UPDATE entropy_buffer SET consumed_by_bet_id = $1 WHERE id = $2", [betId, entropyId]);
        }
    }

    console.log(`✅ ${TEST_SIZE} bets created. Initiating concurrent resolutions...`);

    const startTime = Date.now();

    // FIRE! (Bombardment)
    const results = await Promise.all(betIds.map(id => simulateWebhookResolution(id)));

    const endTime = Date.now();

    const successes = results.filter(r => r.success).length;
    const failures = results.filter(r => !r.success);

    console.log(`⏱ Execution Time: ${(endTime - startTime) / 1000} seconds`);
    console.log(`📊 Success Rate: ${successes}/${TEST_SIZE}`);

    if (failures.length > 0) {
        console.log("❌ Log of failures:");
        failures.forEach(f => console.log(f.error));
    } else {
        console.log("🎉 Test Passed: No deadlocks detected and resolution fully parallelized.");
        console.log("⏳ Note: Ensure `ts-node src/server.ts` or the entropy_worker is running in another terminal to watch the buffer refill live.");
    }

    process.exit(0);
}

runTest().catch(console.error);
