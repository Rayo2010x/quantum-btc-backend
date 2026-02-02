
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const { Client } = pg;

// USAGE: node scripts/test-db-connection.js [YOUR_CONNECTION_STRING]
// Si no se proporciona argumento, usa DATABASE_URL de .env
const connectionString = process.argv[2] || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: No se encontró una cadena de conexión.');
  console.error('   -> Asegúrate de que DATABASE_URL esté definida en .env');
  console.error('   -> O proporciona la URL como argumento: node scripts/test-db-connection.js "postgresql://..."');
  process.exit(1);
}

console.log(`ℹ️  Usando cadena de conexión: ${connectionString.replace(/:[^:@]+@/, ':***@')}`); // Ocultar contraseña en logs

const client = new Client({
  connectionString: connectionString.split('?')[0],
  ssl: { rejectUnauthorized: false }, // Necessary for Supabase
});

async function testConnection() {
  console.log('🔄 Intentando conectar...');
  try {
    await client.connect();
    console.log('✅ Conexión establecida exitosamente!');

    const res = await client.query('SELECT NOW() as time, current_database() as db_name');
    console.log(`🎉 Éxito! Conectado a la base de datos: ${res.rows[0].db_name}`);
    console.log(`⏰ Hora del servidor: ${res.rows[0].time}`);

    // Check for tables
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    console.log('\n📋 Tablas encontradas:');
    if (tableRes.rows.length === 0) {
      console.warn('⚠️  No se encontraron tablas en el esquema público.');
    } else {
      tableRes.rows.forEach(row => console.log(` - ${row.table_name}`));
    }

  } catch (err) {
    console.error('❌ Fallo de conexión:', err.message);
    if (err.message.includes('password')) {
      console.error('   -> Pista: Verifica tu contraseña en .env.');
    } else if (err.message.includes('addr info') || err.message.includes('timeout')) {
      console.error('   -> Pista: El hostname puede estar mal o ser inalcanzable.');
    }
  } finally {
    await client.end();
  }
}

testConnection();
