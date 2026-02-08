
import "dotenv/config";
import fs from "fs";
import path from "path";
import pg from "pg";
import { fileURLToPath } from "url";

// Fix __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    console.log("🚀 Running Migrations...");

    const client = await pool.connect();
    try {
        const migrationsDir = path.join(__dirname, "../src/db/migrations");
        
        if (!fs.existsSync(migrationsDir)) {
            console.log("No migrations directory found.");
            return;
        }

        const files = fs.readdirSync(migrationsDir).sort();
        
        for (const file of files) {
            if (file.endsWith(".sql")) {
                console.log(`Running migration: ${file}`);
                const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
                try {
                     await client.query("BEGIN");
                     await client.query(sql);
                     await client.query("COMMIT");
                     console.log(`✅ Applied ${file}`);
                } catch (e) {
                    await client.query("ROLLBACK");
                    console.error(`❌ Failed to apply ${file}:`, e);
                    throw e;
                }
            }
        }

        console.log("✅ All migrations processed.");
    } catch (err) {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
