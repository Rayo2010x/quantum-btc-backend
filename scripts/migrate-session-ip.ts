
import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
    console.error("❌ Error: DATABASE_URL is missing in .env");
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

async function main() {
    console.log("🚀 Starting Migration...");

    const client = await pool.connect();
    try {
        console.log("⚡ Altering 'sessions' table...");

        await client.query("BEGIN");

        // 1. Remove updated_at
        console.log("   - Dropping 'updated_at'...");
        await client.query("ALTER TABLE sessions DROP COLUMN IF EXISTS updated_at;");

        // 2. Add ip_address
        console.log("   - Adding 'ip_address'...");
        await client.query("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ip_address INET;");

        await client.query("COMMIT");

        console.log("✅ Migration successful!");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("❌ Migration failed:", err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
