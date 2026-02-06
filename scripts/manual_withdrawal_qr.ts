
import { pool } from "../src/db/index.js";
import { env } from "../src/config/env.js";
// @ts-ignore
import lnurl from "lnurl";
import crypto from "crypto";

async function main() {
    console.log("🚀 Generating Manual Withdrawal QR...");

    // 1. Create a Token
    const k1 = crypto.randomBytes(32).toString("hex");
    const amountSat = 100; // 100 sats test

    console.log(`Connecting to DB: ${env.DATABASE_URL?.split("@")[1]}`); // Hide password

    try {
        // 1. Get a valid session
        const sessionRes = await pool.query("SELECT id FROM sessions ORDER BY created_at DESC LIMIT 1");
        if (sessionRes.rowCount === 0) {
            throw new Error("No active sessions found. Please play a game first!");
        }
        const sessionId = sessionRes.rows[0].id;

        await pool.query(
            "INSERT INTO withdrawal_tokens (k1, amount_sat, is_used, expires_at, session_id) VALUES ($1, $2, FALSE, NOW() + INTERVAL '1 hour', $3)",
            [k1, amountSat, sessionId]
        );

        // 2. Encode to LNURL
        // Ensure NO trailing slash in base
        const baseUrl = "https://quantum-btc-backend-production.up.railway.app";
        const url = `${baseUrl}/v1/lnurl/withdraw?k1=${k1}`;
        const encoded = lnurl.encode(url).toUpperCase();

        console.log("\n✅ Token Created!");
        console.log(`Amount: ${amountSat} sats`);
        console.log(`K1: ${k1}`);
        console.log(`Target URL: ${url}`);
        console.log("\n👇 SCAN THIS LNURL STRING (Copy and paste into a QR generator or Wallet) 👇\n");
        console.log(encoded);
        console.log("\n👆 --------------------------------------------------------------------- 👆");

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await pool.end();
    }
}

main();
