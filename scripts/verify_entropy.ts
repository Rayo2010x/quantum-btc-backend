
import "dotenv/config";
import { startEntropyWorker } from "../src/services/entropy_worker.js";
import { pool } from "../src/db/index.js";

async function verify() {
    console.log("🧪 Starting Verification...");

    // Clear buffer to be sure
    await pool.query("DELETE FROM entropy_buffer WHERE is_consumed = FALSE");
    console.log("🧹 Cleared existing buffer.");

    // Start Worker
    startEntropyWorker();

    // Wait for a few seconds to let it fetch
    console.log("⏳ Waiting for worker to fetch...");
    await new Promise(r => setTimeout(r, 5000));

    // Check count
    const res = await pool.query("SELECT COUNT(*) as count FROM entropy_buffer WHERE is_consumed = FALSE");
    const count = parseInt(res.rows[0].count, 10);

    console.log(`📊 Current Buffer Count: ${count}`);

    if (count > 0) {
        console.log("✅ SUCCESS: Entropy buffer is being populated!");
    } else {
        console.error("❌ FAILURE: Entropy buffer is empty.");
        process.exit(1);
    }

    process.exit(0);
}

verify();
