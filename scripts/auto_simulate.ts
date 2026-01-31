
import axios from 'axios';
import crypto from 'node:crypto';
import "dotenv/config";

// Usage: npx tsx scripts/auto_simulate.ts

const api = axios.create({
    baseURL: "https://api.opennode.com/v1",
    headers: {
        Authorization: process.env.OPENNODE_API_KEY,
        "Content-Type": "application/json",
    },
});

async function autoSimulate() {
    console.log("🔍 Searching for recent OpenNode charges...");

    try {
        const { data } = await api.get("/charges");
        const charges = data.data;

        if (!charges || charges.length === 0) {
            console.log("❌ No charges found.");
            return;
        }

        // Find the most recent PAID charge
        const recentPaid = charges.find((c: any) => c.status === 'paid');

        if (!recentPaid) {
            console.log("❌ No PAID charges found in the recent list.");
            console.log("Most recent status:", charges[0]?.status);
            return;
        }

        const invoiceId = recentPaid.id;
        console.log(`✅ Found Paid Charge: ${invoiceId} | Amount: ${recentPaid.amount} BTC`);

        const secret = process.env.OPENNODE_HASHED_SECRET;
        if (!secret) {
            console.error("❌ Missing OPENNODE_HASHED_SECRET in .env");
            process.exit(1);
        }

        console.log(`🚀 Simulating Webhook for: ${invoiceId}`);

        const hashedOrder = crypto
            .createHmac("sha256", secret)
            .update(invoiceId)
            .digest("hex");

        const payload = {
            id: invoiceId,
            status: "paid",
            hashed_order: hashedOrder,
            price: recentPaid.price,
            fee: recentPaid.fee,
            fiat_value: recentPaid.fiat_value
        };

        const res = await axios.post("http://localhost:3000/v1/webhooks/opennode", payload);
        console.log("✅ Webhook sent successfully!");
        console.log("👉 CHECK YOUR BROWSER NOW! The game should complete.");

    } catch (err: any) {
        console.error("❌ Error:", err.message);
        if (err.response) {
            console.log("API Msg:", err.response.data);
        }
    }
}

autoSimulate();
