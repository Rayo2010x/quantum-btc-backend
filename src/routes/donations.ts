import { FastifyInstance } from "fastify";
import { z } from "zod";
import { pool } from "../db/index.js";
import { OpenNode } from "../services/opennode.js";

const CreateDonationSchema = z.object({
  amountSat: z.number().int().positive().min(100),
  address: z.string().optional()
});

export async function donationRoutes(app: FastifyInstance) {
  app.post("/v1/donations/create", {
    config: {
      rateLimit: {
        max: 20,
        timeWindow: "1 minute"
      }
    }
  }, async (req, reply) => {
    try {
      const { amountSat, address } = CreateDonationSchema.parse(req.body);

      // 1. Create Invoice via OpenNode
      const description = `Quantum BTC Donation`;
      const charge = await OpenNode.createCharge(amountSat, description);

      // 2. Insert into donations table
      const res = await pool.query(
        `INSERT INTO donations (charge_id, amount_sat, address, status)
         VALUES ($1, $2, $3, 'pending') RETURNING id`,
        [charge.id, amountSat, address || null]
      );

      return {
        id: res.rows[0].id,
        paymentRequest: charge.lightning_invoice.payreq,
        chargeId: charge.id
      };
    } catch (err: any) {
      req.log.error(err);
      return reply.status(500).send({ error: err.message || "Failed to create donation invoice" });
    }
  });

  app.get("/v1/donations/:id/status", async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const res = await pool.query("SELECT status FROM donations WHERE id = $1", [id]);
      if ((res.rowCount || 0) === 0) {
        return reply.status(404).send({ error: "Donation not found" });
      }
      return { status: res.rows[0].status };
    } catch (err) {
      req.log.error(err);
      return reply.status(500).send({ error: "Database error" });
    }
  });
}
