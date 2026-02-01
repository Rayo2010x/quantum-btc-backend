
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    // Server Config
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

    // Database (CRITICAL)
    DATABASE_URL: z.string().startsWith("postgres"),

    // OpenNode (CRITICAL for payments)
    OPENNODE_INVOICE_KEY: z.string().min(10, "OpenNode Invoice Key missing"),
    OPENNODE_WITHDRAWAL_KEY: z.string().min(10, "OpenNode Withdrawal Key missing"),
    OPENNODE_HASHED_SECRET: z.string().min(10, "Webhook Secret missing"),

    // ANU Quantum RNG (Low risk, optional for local dev maybe, but required by manual)
    ANU_API_KEY: z.string().optional(), // Marked optional for now to allow local dev without it if needed, but manual says LOW security

    // Game Logic
    BANKROLL_FLOOR_SATS: z.coerce.number().default(400000),

    // Security
    SESSION_SECRET: z.string().min(32, "Session Secret must be at least 32 chars"),

    // CORS
    FRONTEND_URL: z.string().optional(),
});

// Validate and export. Checks process.env immediately.
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error("❌ Invalid environment variables:", _env.error.format());
    process.exit(1);
}

export const env = _env.data;
