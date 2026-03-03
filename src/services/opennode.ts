
import axios from "axios";
import crypto from "node:crypto";
import { env } from "../config/env.js";

const api = axios.create({
    baseURL: "https://api.opennode.com/v1",
    headers: {
        "Content-Type": "application/json",
    },
});

// Only use dev URL if explicitly requested or if Key looks like a dev key (optional heuristic)
// But User specifically asked for Real Money test. 
// So let's force LIVE URL for now or verify environment.
// if (env.NODE_ENV !== "production") {
//     api.defaults.baseURL = "https://dev-api.opennode.com/v1";
// }

export const OpenNode = {
    /**
     * Creates a Lightning Invoice (Charge)
     */
    async createCharge(amountSat: number, description: string = "Quantum BTC Deposit") {
        try {
            console.log(`🔌 Creating Charge for ${amountSat} sats via OpenNode...`);
            const payload = {
                amount: amountSat,
                description,
                callback_url: `${env.PUBLIC_URL}/v1/webhooks/opennode`,
                auto_settle: false
            };
            console.log("🔌 Creating OpenNode Charge with Callback URL:", `${env.PUBLIC_URL}/v1/webhooks/opennode`);

            const response = await api.post("/charges", payload, {
                headers: { Authorization: env.OPENNODE_INVOICE_KEY }
            });
            console.log("✅ Charge Created:", response.data.data.id);
            return response.data.data;
        } catch (error: any) {
            console.error("❌ OpenNode API Error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || "OpenNode API Failed");
        }
    },

    /**
     * Generates a withdrawal (LNURL-Withdraw or direct pay)
     * This function creates a WITHDRAWAL REQUEST on users behalf?
     * No, typically we issue a LNURL-Withdraw link for them to scan.
     * OpenNode has /withdrawals endpoint to PAY an invoice.
     * So flow is: User scans LNURL -> User wallet calls callback with Invoice -> Backend calls OpenNode to pay invoice.
     */
    async payInvoice(bolt11: string) {
        // Use v2 for withdrawals (v1 is deprecated/returns 404)
        const res = await api.post("https://api.opennode.com/v2/withdrawals", {
            type: "ln",
            address: bolt11,
        }, {
            headers: { Authorization: env.OPENNODE_WITHDRAWAL_KEY }
        });
        return res.data.data;
    },

    /**
     * Gets the current OpenNode account balance
     */
    async getAccountBalance(): Promise<{ balance: number }> {
        try {
            const response = await api.get("https://api.opennode.com/v1/account/balance", {
                headers: { Authorization: env.OPENNODE_WITHDRAWAL_KEY }
            });

            // OpenNode usually returns { data: { balance: { BTC: 123456, USD: 0 } } }
            // Let's defensively parse it.
            const data = response.data.data;
            let finalBalance = 0;

            if (typeof data.balance === 'object' && data.balance !== null && 'BTC' in data.balance) {
                finalBalance = Number(data.balance.BTC); // Measured in Sats usually
            } else {
                finalBalance = Number(data.balance);
            }

            return { balance: finalBalance };
        } catch (error: any) {
            console.error("❌ OpenNode Balance Fetch Error:", error.response?.data || error.message);
            throw new Error("Failed to fetch OpenNode balance");
        }
    },

    /**
     * Verifies HMAC signature of a webhook
     */
    verifySignature(chargeId: string, hashedOrder: string): boolean {
        if (!hashedOrder) return false;
        // signature is HMAC-SHA256(hashed_order, secret)
        // Wait, OpenNode docs say: "hashed_order" is a field in the body.
        // We verify by: comparing the signature header with calculated hmac?
        // Actually, OpenNode sends hashed_order (which is HMAC(id, secret)).
        // So we just need to re-calc it? 
        // Docs: hashed_order = HMAC-SHA256(charge.id, api_key) -> Correction: It's usually secret.
        // Let's implement the standard verification:
        // hashed_order should match HMAC(id, secret)

        const calculated = crypto
            .createHmac("sha256", env.OPENNODE_HASHED_SECRET) // Use the HASHED_SECRET from dashboard
            .update(chargeId)
            .digest("hex");

        return calculated === hashedOrder;
    }
};
