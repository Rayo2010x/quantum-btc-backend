
import "dotenv/config";
import Fastify from "fastify";

import { env } from "./config/env.js";
import { pool } from "./db/index.js";

// Routes
import { betRoutes } from "./routes/bet.js";
import { webhookRoutes } from "./routes/webhook.js";
import { lnurlRoutes } from "./routes/lnurl.js";
import { startEntropyWorker } from "./services/entropy_worker.js";
import { sessionRoutes } from "./routes/session.js";
import { gameStatusRoutes } from "./routes/game_status.js";
import cors from "@fastify/cors";

const app = Fastify({ logger: true });

const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
if (env.FRONTEND_URL) allowedOrigins.push(env.FRONTEND_URL);

// CORS
await app.register(cors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
});


app.get("/health", async () => ({ ok: true }));

// DB ping
app.get("/db-ping", async (_req, reply) => {
  try {
    const { rows } = await pool.query("select now() as now");
    return reply.send({ ok: true, now: rows[0]?.now });
  } catch (err: any) {
    return reply.status(500).send({
      ok: false,
      error: String(err?.message ?? err),
    });
  }
});

// Register Routes
app.register(betRoutes);         // /v1/game/bet
app.register(gameStatusRoutes);  // /v1/game/bet/:id/status
app.register(sessionRoutes);     // /v1/session/init
app.register(webhookRoutes);     // /v1/webhooks
app.register(lnurlRoutes);       // /v1/lnurl

// Start
const port = env.PORT;
try {
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`🚀 Quantum BTC Backend running on port ${port}`);

  // Start Background Workers
  startEntropyWorker();
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
