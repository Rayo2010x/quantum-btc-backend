
import axios from 'axios';
import crypto from 'node:crypto';
import "dotenv/config";

// Usage: npx tsx scripts/simulate_webhook.ts <invoice_id>

async function simulate() {
    const invoiceId = process.argv[2];
    if (!invoiceId) {
        console.error("❌ Usage: npx tsx scripts/simulate_webhook.ts <invoice_id>");
        process.exit(1);
    }

    const secret = process.env.OPENNODE_HASHED_SECRET;
    if (!secret) {
        console.error("❌ Missing OPENNODE_HASHED_SECRET in .env");
        process.exit(1);
    }

    console.log(`🚀 Simulating Payment for Invoice: ${invoiceId}`);

    // Calculate Signature (HMAC-SHA256 of charge.id matching OpenNode behavior)
    // Note: In real OpenNode, they send 'hashed_order' which is HMAC(id, secret).
    // Our backend verifies this in OpenNode.verifySignature.

    const hashedOrder = crypto
        .createHmac("sha256", secret)
        .update(invoiceId)
        .digest("hex");

    const payload = {
        id: invoiceId,
        status: "paid",
        hashed_order: hashedOrder,
        price: 1000,
        fee: 0,
        fiat_value: 0
    };

    try {
        const res = await axios.post("http://localhost:3000/v1/webhooks/opennode", payload);
        console.log("✅ Webhook sent successfully!");
        console.log("Response:", res.data);
    } catch (err: any) {
        console.error("❌ Failed to send webhook:", err.message);
        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Data:", err.response.data);
        }
    }
}

simulate();
