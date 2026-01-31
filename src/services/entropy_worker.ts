
import { pool } from "../db/index.js";
import { fetchQuantumEntropy } from "./anu.js";

const BUFFER_TARGET_SIZE = 100; // Keep 100 items buffered
const BATCH_SIZE = 25; // Fetch 25 at a time (25 * 32 bytes = 800 < 1024 limit)
const POLL_INTERVAL_MS = 5000; // Check every 5 seconds. ANU allows high concurrency on paid/new API?
// The user has a key, so we can poll faster than 60s probably. Let's try 5s.
// Note: If we have an API Key, we could lower this, but 60s is safe for public.

let isRunning = false;

export function startEntropyWorker() {
    if (isRunning) return;
    isRunning = true;
    console.log("atom ⚛️ Entropy Worker started");

    runWorkerLoop();
}

async function runWorkerLoop() {
    if (!isRunning) return;

    try {
        await checkAndRefillBuffer();
    } catch (err) {
        console.error("Entropy Worker Error:", err);
    }

    setTimeout(runWorkerLoop, POLL_INTERVAL_MS);
}

async function checkAndRefillBuffer() {
    // 1. Check current count
    const res = await pool.query(`SELECT COUNT(*) as count FROM entropy_buffer WHERE is_consumed = FALSE`);
    const count = parseInt(res.rows[0].count, 10);

    if (count >= BUFFER_TARGET_SIZE) {
        return; // Buffer healthy
    }

    const needed = BUFFER_TARGET_SIZE - count;
    // console.log(`Entropy Buffer low (${count}/${BUFFER_TARGET_SIZE}). Fetching more...`);

    // 2. Fetch from ANU
    // Don't fetch everything at once if a gap is huge, just fetch a batch
    const fetchCount = Math.min(needed, BATCH_SIZE);

    const hexDataArray = await fetchQuantumEntropy(fetchCount);

    if (hexDataArray.length === 0) {
        // Log warning but don't crash, will retry next loop
        // console.warn("No entropy received from ANU.");
        return;
    }

    // 3. Insert into DB
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        for (const hex of hexDataArray) {
            await client.query(
                `INSERT INTO entropy_buffer (raw_hex_data) VALUES ($1)`,
                [hex]
            );
        }

        await client.query("COMMIT");
        console.log(`⚛️ Added ${hexDataArray.length} quantum items to buffer. Total: ${count + hexDataArray.length}`);
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}
