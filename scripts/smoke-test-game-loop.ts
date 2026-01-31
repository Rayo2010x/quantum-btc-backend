
import "dotenv/config";
import crypto from "node:crypto";
import pg from "pg";
import { pool } from "../src/db/index.js";

// Helper to generate a SHA256 hash
function sha256(text: string): string {
    return crypto.createHash("sha256").update(text).digest("hex");
}

async function simulateGameLoop() {
    console.log("🎲 Starting Full Game Loop Simulation...");
    const client = await pool.connect();

    try {
        await client.query("BEGIN"); // Use transaction for atomicity

        // 1. Setup: Create Session
        const startBalance = 10000;
        const resSession = await client.query(`
            INSERT INTO sessions (current_balance_sat) VALUES ($1) RETURNING id
        `, [startBalance]);
        const sessionId = resSession.rows[0].id;
        console.log(`\n1️⃣  Session Created: ${sessionId}`);
        console.log(`    Start Balance: ${startBalance} sats`);

        // 2. Setup: Mock Entropy (Simulate Worker)
        // We'll put some "Quantum" data in the buffer
        const mockEntropyHex = crypto.randomBytes(32).toString('hex');
        const resEntropy = await client.query(`
            INSERT INTO entropy_buffer (raw_hex_data) VALUES ($1) RETURNING id
        `, [mockEntropyHex]);
        const entropyId = resEntropy.rows[0].id;
        console.log(`\n2️⃣  Entropy Buffered (Mock ANU): ${entropyId}`);
        console.log(`    Raw Hex: ${mockEntropyHex.substring(0, 16)}...`);

        // 3. User Places Bet
        // Inputs
        const betAmount = 100;
        const selectedNumber = 17; // A risky single number bet
        const clientSeed = "client_random_seed_123";

        // Server generates a seed and commits to it
        const serverSeed = crypto.randomBytes(32).toString('hex');
        const serverSeedHash = sha256(serverSeed);

        console.log(`\n3️⃣  Placing Bet...`);
        console.log(`    Wager: ${betAmount} sats on Number ${selectedNumber}`);
        console.log(`    Client Seed: ${clientSeed}`);
        console.log(`    Server Seed Hash (Committed): ${serverSeedHash}`);

        // Deduct Balance
        await client.query(`
            UPDATE sessions SET current_balance_sat = current_balance_sat - $1 WHERE id = $2
        `, [betAmount, sessionId]);

        // Insert Bet
        const resBet = await client.query(`
            INSERT INTO bets (
                session_id, amount_sat, selected_numbers, client_seed, 
                server_seed_hash, status, entropy_id
            ) VALUES ($1, $2, $3, $4, $5, 'PENDING', $6)
            RETURNING id
        `, [sessionId, betAmount, [selectedNumber], clientSeed, serverSeedHash, entropyId]);
        const betId = resBet.rows[0].id;
        console.log(`    ✅ Bet Placed (ID: ${betId}) - Status: PENDING`);

        // 4. Server Resolves Bet
        console.log(`\n4️⃣  Resolving Bet...`);

        // Fetch Entropy + Bet Data
        const betRow = (await client.query(`SELECT * FROM bets WHERE id = $1`, [betId])).rows[0];
        const entropyRow = (await client.query(`SELECT * FROM entropy_buffer WHERE id = $1`, [entropyId])).rows[0];

        // Combine Seeds + Entropy for Final Result
        // Logic: HMAC(server_seed, client_seed + entropy) -> Hex -> Int
        // Simplified Logic for Demo: (server_seed + client_seed + entropy) hash mod 37
        // IMPORTANT: We must use the REAL Provably Fair logic if possible, or a consistent simulation.
        // For auditability demo, we show the components.

        const combinedString = `${serverSeed}:${clientSeed}:${entropyRow.raw_hex_data}`;
        const finalHash = sha256(combinedString);

        // Convert first 8 chars of hash to int for modulo
        const resultNumber = parseInt(finalHash.substring(0, 8), 16) % 37;

        console.log(`    Revealing Server Seed: ${serverSeed}`);
        console.log(`    Using Entropy: ${entropyRow.raw_hex_data.substring(0, 16)}...`);
        console.log(`    Result Calculation: SHA256(${serverSeed}:${clientSeed}:Entropy) % 37`);
        console.log(`    🎰 Final Result: ${resultNumber}`);

        // Determine Win/Loss
        const isWin = resultNumber === selectedNumber;
        let payout = 0;
        let status = 'LOST';

        if (isWin) {
            payout = betAmount * 35; // 35:1 for single number
            status = 'WON';
            // Credit User
            await client.query(`
                UPDATE sessions SET current_balance_sat = current_balance_sat + $1 WHERE id = $2
            `, [payout, sessionId]);
        }

        // Update Bet
        await client.query(`
            UPDATE bets SET 
                status = $1, 
                payout_sat = $2, 
                server_seed_reveal = $3, 
                final_result = $4 
            WHERE id = $5
        `, [status, payout, serverSeed, resultNumber, betId]);

        // Mark entropy consumed
        await client.query(`UPDATE entropy_buffer SET is_consumed = true WHERE id = $1`, [entropyId]);

        await client.query("COMMIT");
        console.log(`    ✅ Bet Settled: ${status} (Payout: ${payout} sats)`);

        // 5. Verification / Audit
        console.log(`\n5️⃣  AUDIT TRAIL (What the user sees):`);
        console.log(`    --------------------------------------------------`);
        console.log(`    1. Server Seed Hash (Pre-commitment): ${serverSeedHash}`);
        console.log(`    2. Server Seed Reveal (Post-game):    ${serverSeed}`);
        console.log(`    --------------------------------------------------`);

        const independentHash = sha256(serverSeed);
        if (independentHash === serverSeedHash) {
            console.log(`    ✅ VERIFIED: Hash matches the committed seed.`);
        } else {
            console.log(`    ❌ FAILED: Hash mismatch! System is cheating.`);
        }

    } catch (err) {
        await client.query("ROLLBACK");
        console.error("\n❌ Simulation Failed:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

simulateGameLoop();
