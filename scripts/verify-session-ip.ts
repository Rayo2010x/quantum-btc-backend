
import axios from 'axios';

const API_URL = 'http://localhost:3000/v1/session/init';
axios.defaults.timeout = 5000; // 5s timeout

async function verify() {
    console.log("Starting Session IP Verification...");

    // 1. Create Initial Session (User A)
    // No headers, uses local IP (likely ::1 or 127.0.0.1)
    console.log("\n[Step 1] Creating initial session...");
    const res1 = await axios.post(API_URL, {});
    const sessionA = res1.data.sessionId;
    console.log(`Session A Created: ${sessionA}`);

    if (!sessionA) throw new Error("Failed to create session A");

    // 2. Reuse Session with SAME IP
    console.log("\n[Step 2] Reusing Session A with SAME IP...");
    const res2 = await axios.post(API_URL, { sessionId: sessionA });
    const sessionA_Reuse = res2.data.sessionId;
    console.log(`Result: ${sessionA_Reuse}`);

    if (sessionA === sessionA_Reuse) {
        console.log("✅ PASS: Session ID persisted with same IP.");
    } else {
        console.error("❌ FAIL: Session ID changed unexpectedly!");
        process.exit(1);
    }

    // 3. Reuse Session with DIFFERENT IP (Simulated via X-Forwarded-For)
    console.log("\n[Step 3] Reusing Session A with DIFFERENT IP (1.2.3.4)...");
    const res3 = await axios.post(API_URL, { sessionId: sessionA }, {
        headers: {
            'X-Forwarded-For': '1.2.3.4'
        }
    });
    const sessionB = res3.data.sessionId;
    console.log(`Result: ${sessionB}`);

    if (sessionA !== sessionB) {
        console.log("✅ PASS: Session ID rotated successfully on IP change.");
    } else {
        console.error(`❌ FAIL: Session ID same for different IP! (${sessionA})`);
        process.exit(1);
    }

    console.log("\nAll tests passed!");
}

verify().catch(console.error);
