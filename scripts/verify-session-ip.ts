
import axios from 'axios';
import { pool } from '../src/db/index.js';

async function main() {
    try {
        console.log("🚀 Starting Session IP Verification...");

        // 1. Create a Session via API
        console.log("👉 Requesting POST /v1/session/init...");
        const response = await axios.post('http://localhost:3000/v1/session/init', {});

        if (response.status !== 200) {
            throw new Error(`API returned status ${response.status}`);
        }

        const { sessionId } = response.data;
        console.log(`✅ Session Created: ${sessionId}`);

        // 2. Checking Database
        console.log(`🔍 Querying database for Session ID: ${sessionId}...`);
        const res = await pool.query("SELECT * FROM sessions WHERE id = $1", [sessionId]);

        if (res.rows.length === 0) {
            throw new Error("Session not found in DB!");
        }

        const session = res.rows[0];
        console.log("📄 DB Record:", session);

        // 3. Validation
        if (!session.ip_address) {
            throw new Error("❌ FAIL: ip_address is NULL or missing!");
        }

        // Check if updated_at is gone (it should be undefined in the row if we select *)
        // Wait, SELECT * will return what is in the DB. If column is gone, it won't be there.
        if ('updated_at' in session) {
            throw new Error("❌ FAIL: updated_at column still exists!");
        }

        console.log(`✅ PASS: ip_address found: ${session.ip_address}`);
        console.log("✅ PASS: updated_at is correctly removed.");

    } catch (err) {
        console.error("❌ Verification Failed:", err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
