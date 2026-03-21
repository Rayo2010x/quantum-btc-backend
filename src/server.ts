
import "dotenv/config";
import Fastify from "fastify";

import { env } from "./config/env.js";
import { pool } from "./db/index.js";

// Routes
import { betRoutes } from "./routes/bet.js";
import { webhookRoutes } from "./routes/webhook.js";
import { lnurlRoutes } from "./routes/lnurl.js";
import { startEntropyWorker } from "./services/entropy_worker.js";
import { startBankrollWorker } from "./services/bankroll_worker.js";
import { sessionRoutes } from "./routes/session.js";
import { campaignRoutes } from "./routes/campaign.js";
import { gameStatusRoutes } from "./routes/game_status.js";
import { historyRoutes } from "./routes/history.js";
import { statisticsRoutes } from "./routes/statistics.js";
import { donationRoutes } from "./routes/donations.js";
import cors from "@fastify/cors";
import formbody from "@fastify/formbody";
import websocket from "@fastify/websocket";
import rateLimit from "@fastify/rate-limit";
import { handleWebsocketConnection } from "./services/websocket.js";

const app = Fastify({
  logger: true,
  ignoreTrailingSlash: true, // Handle /callback/ vs /callback
  trustProxy: true // Fix for obtaining real IP behind proxy (Railway/Vercel)
});

const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
if (env.FRONTEND_URL) allowedOrigins.push(env.FRONTEND_URL);

// Content Type Parser (Form Body) - MUST be registered early
await app.register(formbody);

// CORS
await app.register(cors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
});

// Geo-Block Middleware
// Applied as preHandler to ensure CORS headers are set and OPTIONS preflight succeeds.
import { geoBlockMiddleware } from "./middleware/geoBlock.js";
app.addHook("preHandler", geoBlockMiddleware);

// Websocket Support
await app.register(websocket);

// Rate Limiting (Global)
await app.register(rateLimit, {
  global: true,
  max: 100,
  timeWindow: "1 minute",
  errorResponseBuilder: function (request, context) {
    return {
      statusCode: 429,
      error: "Too Many Requests",
      message: `Rate limit exceeded, retry in ${context.after}`
    };
  }
});

app.get("/ws", { websocket: true }, (connection, req) => {
  handleWebsocketConnection(connection, req);
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
app.register(historyRoutes);     // /v1/game/history
app.register(statisticsRoutes);  // /v1/game/statistics
app.register(sessionRoutes);     // /v1/session/init
app.register(campaignRoutes);    // /v1/campaign
app.register(webhookRoutes);     // /v1/webhooks
app.register(lnurlRoutes);       // /v1/lnurl
app.register(donationRoutes);    // /v1/donations

// Start
const port = env.PORT;
try {
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`🚀 Quantum BTC Backend running on port ${port}`);

  // Start Background Workers
  startEntropyWorker();
  startBankrollWorker();
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
