import pg from "pg";

const { Pool } = pg;

import { env } from "../config/env.js";

export const pool = new Pool({
  // Strip query params (like ?sslmode=require) to allow explicit ssl config to work
  connectionString: env.DATABASE_URL.split('?')[0],
  ssl: { rejectUnauthorized: false }, // MVP
  connectionTimeoutMillis: 5000, // 5s timeout
  idleTimeoutMillis: 10000 // 10s idle timeout
});

export async function withTx<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const out = await fn(client);
    await client.query("commit");
    return out;
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}
