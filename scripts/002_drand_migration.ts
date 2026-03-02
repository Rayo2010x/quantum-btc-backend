import { pool } from "../src/db/index.js";

async function runMigration() {
    console.log("Running Drand Migration (002)...");

    try {
        await pool.query(`
      ALTER TABLE bets 
      ADD COLUMN IF NOT EXISTS drand_round BIGINT,
      ADD COLUMN IF NOT EXISTS drand_randomness VARCHAR(255),
      ADD COLUMN IF NOT EXISTS drand_signature VARCHAR(512);
    `);

        console.log("✅ Migration successful: Added drand fields to bets table.");
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
