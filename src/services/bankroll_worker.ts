import { OpenNode } from "./opennode.js";
import { env } from "../config/env.js";

// Global Cache for the Bankroll
let currentBankroll = env.BANKROLL_FLOOR_SATS;
let pollingInterval: NodeJS.Timeout | null = null;

export const getBankroll = () => currentBankroll;

export const triggerAlert = async (type: "YELLOW" | "RED", balance: number) => {
    const msg = `🚨 QUANTUM BTC ${type} ALERT 🚨\nOpenNode Liquidity dropped to: ${balance} Sats.\nSystem is operating at risk!`;
    console.error(msg);

    if (env.ADMIN_ALERT_WEBHOOK) {
        try {
            await fetch(env.ADMIN_ALERT_WEBHOOK, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: msg })
            });
        } catch (e) {
            console.error("Failed to send webhook alert", e);
        }
    }
}

export const syncBankrollBalance = async () => {
    try {
        const { balance } = await OpenNode.getAccountBalance();
        // The balance API usually returns the value in Sats, but could be strings.
        const parsedBalance = Number(balance);
        if (!isNaN(parsedBalance)) {
            currentBankroll = parsedBalance;
            console.log(`🏦 Bankroll Synced: ${currentBankroll} Sats`);

            if (currentBankroll < 20000) {
                await triggerAlert("RED", currentBankroll);
            } else if (currentBankroll < 100000) {
                await triggerAlert("YELLOW", currentBankroll);
            }
        }
    } catch (err: any) {
        console.error("⚠️ Failed to sync bankroll:", err.message);
    }
};

export const startBankrollWorker = () => {
    // Initial sync
    syncBankrollBalance();

    // Poll every 10 minutes
    const TEN_MINUTES = 10 * 60 * 1000;
    pollingInterval = setInterval(syncBankrollBalance, TEN_MINUTES);
    console.log("🏦 Bankroll Worker started (Polling 10m)");
};

export const stopBankrollWorker = () => {
    if (pollingInterval) clearInterval(pollingInterval);
};
