
import "dotenv/config";
import pg from "pg";
const { Pool } = pg;

async function smokeTest() {
    console.log("🔥 Starting Database Smoke Test (Fixing SSL)...");

    // 1. Clean the connection string
    let url = process.env.DATABASE_URL;
    if (url && url.includes("?")) {
        // Strip query params like sslmode=require that force validation
        url = url.split("?")[0];
        console.log("Deleted query params from connection string for manual SSL config.");
    }

    // 2. Configure pool explicitly
    const pool = new Pool({
        connectionString: url,
        ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();

    try {
        // 3. Insert a test session
        console.log("📝 Attempting to insert test session...");
        const resInsert = await client.query(`
            INSERT INTO sessions (current_balance_sat) 
            VALUES ($1) 
            RETURNING id, created_at
        `, [1337]);

        const newSession = resInsert.rows[0];
        console.log("✅ Session inserted:", newSession);

        // 4. Read it back
        console.log("🔍 Verifying persistence...");
        const resRead = await client.query(`
            SELECT * FROM sessions WHERE id = $1
        `, [newSession.id]);

        if (resRead.rows.length === 1 && resRead.rows[0].current_balance_sat === "1337") {
            console.log("✅ Verification SUCCESS: Data persisted correctly in 'sessions' table.");
        } else {
            console.error("❌ Verification FAILED: Data mismatch.");
            console.error("Read result:", resRead.rows);
        }

    } catch (err) {
        console.error("❌ Smoke Test FAILED with error:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

smokeTest();
