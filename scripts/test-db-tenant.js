
import pg from 'pg';
const { Client } = pg;

// Connection details
const PROJECT_ID = 'pwmjzqgfkgrzfqbsxube';
const USERS = ['postgres', `postgres.${PROJECT_ID}`];
const IP = '52.45.94.125';
const PORT = 6543;
// Your encoded password
const PASS = 'kfiruy364jsuq8%2F%25Ghd93jHT%25OUyt%24R4G';

async function test(username) {
    const connectionString = `postgresql://${username}:${PASS}@${IP}:${PORT}/postgres`;

    console.log(`\n🧪 Testing Username: ${username}`);
    console.log(`   URL: postgresql://${username}:***@${IP}:${PORT}/postgres`);

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('   ✅ SUCCESS! Connected.');
        const res = await client.query('SELECT current_database() as db');
        console.log(`   📂 Database: ${res.rows[0].db}`);
        await client.end();
        return true;
    } catch (err) {
        console.log('   ❌ FAILED:', err.message);
        await client.end();
        return false;
    }
}

async function run() {
    console.log('--- DIAGNOSING TENANT ID ISSUE ---');

    // 1. Test original user (Expected to fail)
    await test('postgres');

    // 2. Test project-scoped user (Expected to work)
    const success = await test(`postgres.${PROJECT_ID}`);

    if (success) {
        console.log('\n✨ SOLUTION FOUND: You must use the project-scoped username!');
        console.log(`Update your Railway DATABASE_URL to use user: postgres.${PROJECT_ID}`);
    }
}

run();
