import { pool } from '../src/db/index.js';

async function main() {
    try {
        const res = await pool.query('SELECT * FROM geo_block_logs');
        console.log("LOGS:", res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
