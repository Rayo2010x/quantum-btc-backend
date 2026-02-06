
import axios from "axios";
import { env } from "../src/config/env.js";

const api = axios.create({
    baseURL: "https://api.opennode.com/v1",
    headers: {
        "Content-Type": "application/json",
        "Authorization": env.OPENNODE_WITHDRAWAL_KEY
    },
});

async function main() {
    console.log("🔍 Debugging OpenNode API Connectivity...");
    console.log(`Key Prefix: ${env.OPENNODE_WITHDRAWAL_KEY?.substring(0, 4)}...`);

    try {
        console.log("👉 Testing GET /withdrawals (List Withdrawals)...");
        const res = await api.get("/withdrawals");
        console.log("✅ GET /withdrawals Success!", res.status);
        console.log("Data sample:", res.data.data?.slice(0, 1));
    } catch (err: any) {
        console.error("❌ GET /withdrawals Failed:", err.message);
        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Body:", err.response.data);
        }
    }

    try {
        console.log("\n👉 Testing POST /withdrawals (Dry Run / Dummy)...");
        // Sending invalid invoice to trigger 400 instead of 404
        const res = await api.post("/withdrawals", {
            type: "ln",
            address: "lnbc1...invalid...",
        });
        console.log("❓ POST /withdrawals returned:", res.status); // Should not happen with invalid invoice
    } catch (err: any) {
        console.log("👉 POST /withdrawals Result:");
        if (err.response) {
            console.log(`Status: ${err.response.status} (Expected 400 for invalid invoice)`);
            console.log("Body:", err.response.data);
            if (err.response.status === 404) {
                console.error("🚨 MAJOR ISSUE: Endpoint returning 404!");
            }
        } else {
            console.error("❌ Network Error:", err.message);
        }
    }

    const endpoints = [
        { method: "POST", url: "/withdrawals", version: "v1" },
        { method: "POST", url: "/withdrawals", version: "v2" },
        { method: "POST", url: "/payouts", version: "v1" }, // Some docs mention payouts
        { method: "POST", url: "/transfers/withdrawal", version: "v1" }, // Check transfers
    ];

    for (const ep of endpoints) {
        try {
            console.log(`\n👉 Testing ${ep.method} ${ep.url} (${ep.version})...`);
            const baseURL = `https://api.opennode.com/${ep.version}`;
            const res = await axios.post(baseURL + ep.url, {
                type: "ln",
                address: "lnbc1...invalid...", // Dummy bolt11
            }, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": env.OPENNODE_WITHDRAWAL_KEY
                }
            });
            console.log(`✅ ${ep.version} ${ep.url} Response: ${res.status}`);
        } catch (err: any) {
            if (err.response) {
                console.log(`❌ ${ep.version} ${ep.url} Failed: ${err.response.status} (${err.response.data?.error || err.response.statusText})`);
            } else {
                console.log(`❌ ${ep.version} ${ep.url} Network Error: ${err.message}`);
            }
        }
    }
}

main();
