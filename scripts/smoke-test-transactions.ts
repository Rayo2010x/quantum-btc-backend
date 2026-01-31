
import "dotenv/config";
import pg from "pg";
import crypto from "node:crypto";
import { pool } from "../src/db/index.js";

// Helper to generate a SHA256 hash
function sha256(text: string): string {
    return crypto.createHash("sha256").update(text).digest("hex");
}

async function smokeTestTransactions() {
    console.log("💰 Starting Transaction Smoke Test...");
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 1. Setup: Create Session
        const startBalance = 0;
        const resSession = await client.query(`
            INSERT INTO sessions (current_balance_sat) VALUES ($1) RETURNING id
        `, [startBalance]);
        const sessionId = resSession.rows[0].id;
        console.log(`\n1️⃣  Session Created: ${sessionId}`);
        console.log(`    Start Balance: ${startBalance} sats`);

        // 2. Simulate User Deposit Request
        // In the real app, this calls OpenNode api, gets a charge ID, and saves to DB.
        const depositAmount = 5000;
        const mockProviderId = `charge_${crypto.randomBytes(8).toString('hex')}`; // e.g. OpenNode ID

        console.log(`\n2️⃣  Simulating Deposit Request...`);
        console.log(`    Amount: ${depositAmount} sats`);
        console.log(`    Provider ID: ${mockProviderId}`);

        const resTx = await client.query(`
            INSERT INTO transactions (session_id, type, amount_sat, provider_id, status)
            VALUES ($1, 'DEPOSIT', $2, $3, 'PENDING')
            RETURNING id
        `, [sessionId, depositAmount, mockProviderId]);
        const txId = resTx.rows[0].id;

        console.log(`    ✅ Transaction Created (ID: ${txId}) - Status: PENDING`);

        // 3. Simulate Webhook (Payment Confirmed)
        console.log(`\n3️⃣  Simulating Webhook (Payment Confirmed)...`);

        // Update Transaction
        await client.query(`
            UPDATE transactions SET status = 'PAID', updated_at = NOW() WHERE id = $1
        `, [txId]);

        // Credit Session
        await client.query(`
            UPDATE sessions SET current_balance_sat = current_balance_sat + $1 WHERE id = $2
        `, [depositAmount, sessionId]);

        console.log(`    ✅ Transaction Updated: PAID`);
        console.log(`    ✅ Session Credited: +${depositAmount} sats`);

        // Verify Balance
        const resBalanceAfterDeposit = await client.query(`SELECT current_balance_sat FROM sessions WHERE id = $1`, [sessionId]);
        const balanceAfterDeposit = Number(resBalanceAfterDeposit.rows[0].current_balance_sat);

        if (balanceAfterDeposit === 5000) {
            console.log(`    ✅ Verification SUCCESS: Balance is 5000 sats.`);
        } else {
            console.error(`    ❌ Verification FAILED: Balance is ${balanceAfterDeposit}.`);
        }

        // 4. Simulate Withdrawal Request
        const withdrawAmount = 2000;
        console.log(`\n4️⃣  Simulating Withdrawal Request...`);
        console.log(`    Amount: ${withdrawAmount} sats`);

        // Check sufficient funds (omitted here as we know we have 5000)

        // Deduct Balance
        await client.query(`
            UPDATE sessions SET current_balance_sat = current_balance_sat - $1 WHERE id = $2
        `, [withdrawAmount, sessionId]);

        // Create Token
        const k1 = crypto.randomBytes(32).toString('hex');
        const resToken = await client.query(`
            INSERT INTO withdrawal_tokens (session_id, k1, amount_sat, expires_at)
            VALUES ($1, $2, $3, NOW() + INTERVAL '24 hours')
            RETURNING id
        `, [sessionId, k1, withdrawAmount]);

        console.log(`    ✅ Balance Deducted: -${withdrawAmount} sats`);
        console.log(`    ✅ Withdrawal Token Created (ID: ${resToken.rows[0].id})`);

        // Verify Final Balance
        const resBalanceFinal = await client.query(`SELECT current_balance_sat FROM sessions WHERE id = $1`, [sessionId]);
        const finalBalance = Number(resBalanceFinal.rows[0].current_balance_sat);

        if (finalBalance === 3000) {
            console.log(`    ✅ Final Verification SUCCESS: Balance is 3000 sats (5000 - 2000).`);
        } else {
            console.error(`    ❌ Final Verification FAILED: Balance is ${finalBalance}.`);
        }

        await client.query("COMMIT");
        console.log("\n✅ TRANSACTION SMOKE TEST COMPLETE");

    } catch (err) {
        await client.query("ROLLBACK");
        console.error("\n❌ Smoke Test Failed:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

smokeTestTransactions();
