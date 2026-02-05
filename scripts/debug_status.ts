
import "dotenv/config";
import { pool } from "../src/db/index.js";

async function check() {
    try {
        const res = await pool.query("SELECT COUNT(*) as count FROM entropy_buffer WHERE is_consumed = FALSE");
        const initialCount = parseInt(res.rows[0].count, 10);
        console.log(`Current Buffer Count: ${initialCount}`);

        console.log("Waiting 2 seconds to see if it changes...");
        await new Promise(r => setTimeout(r, 2000));

        const res2 = await pool.query("SELECT COUNT(*) as count FROM entropy_buffer WHERE is_consumed = FALSE");
        const finalCount = parseInt(res2.rows[0].count, 10);
        console.log(`Buffer Count after 2s: ${finalCount}`);

        if (finalCount > initialCount) {
            console.log("STATUS: Buffer is FILLING (Process is likely active).");
        } else if (finalCount < initialCount) {
            console.log("STATUS: Buffer is DRAINING (Game is consuming?).");
        } else {
            console.log("STATUS: Buffer is STATIC (Process is likely stuck or finished).");
        }
    } catch (err) {
        console.error("ERROR checking DB:", err);
    } finally {
        await pool.end();
    }
}

check();
