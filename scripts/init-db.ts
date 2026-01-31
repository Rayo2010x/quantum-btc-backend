
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
    console.log("🚀 Initializing Database...");

    const client = await pool.connect();
    try {
        const schemaPath = path.join(__dirname, "../src/db/schema.sql");
        console.log(`📖 Reading schema from: ${schemaPath}`);

        const schemaSql = fs.readFileSync(schemaPath, "utf-8");

        console.log("⚡ Executing Schema...");
        await client.query("BEGIN");
        await client.query(schemaSql);
        await client.query("COMMIT");

        console.log("✅ Database initialized successfully!");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("❌ Error initializing database:", err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
