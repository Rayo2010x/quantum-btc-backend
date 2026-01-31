
import { pool } from "../src/db/index.js";
import "dotenv/config";

async function migrate() {
    try {
        console.log("Applying migration: Add bet_details to bets table...");
        await pool.query(`
            ALTER TABLE bets 
            ADD COLUMN IF NOT EXISTS bet_details JSONB;
        `);
        console.log("✅ Migration successful.");
    } catch (err) {
        console.error("❌ Migration failed:", err);
    } finally {
        await pool.end();
    }
}

migrate();
