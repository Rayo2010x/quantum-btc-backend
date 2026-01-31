
import { pool } from "../src/db/index.js";
import "dotenv/config";

async function migrate() {
    try {
        console.log("Applying migration: Add non-custodial columns to bets...");
        await pool.query(`
            ALTER TABLE bets 
            ADD COLUMN IF NOT EXISTS invoice_id VARCHAR(255),
            ADD COLUMN IF NOT EXISTS withdrawal_token_id UUID;
            
            ALTER TABLE bets 
            ALTER COLUMN status TYPE VARCHAR(50); 
            -- We might need to unrestrict the check constraint on status:
            ALTER TABLE bets DROP CONSTRAINT IF EXISTS bets_status_check;
            ALTER TABLE bets ADD CONSTRAINT bets_status_check CHECK (status IN ('PENDING', 'WAITING_PAYMENT', 'PAID', 'PROCESSING', 'WON', 'LOST'));
        `);
        console.log("✅ Migration successful.");
    } catch (err) {
        console.error("❌ Migration failed:", err);
    } finally {
        await pool.end();
    }
}

migrate();
