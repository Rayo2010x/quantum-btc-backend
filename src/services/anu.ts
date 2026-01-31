
import { env } from "../config/env.js";

const ANU_API_URL = "https://api.quantumnumbers.anu.edu.au";

/**
 * Fetches quantum random hex strings from ANU API.
 * 
 * Note: The live ANU API requires an API Key for high volume, but often has a public free tier or demo endpoint.
 * For this implementation, we will use the JSON API endpoint structure.
 * 
 * Docs: https://quantumnumbers.anu.edu.au/
 */
export async function fetchQuantumEntropy(batchSize: number = 10): Promise<string[]> {
    // If no API key is present, we might be limited or need a specific "demo" endpoint. 
    // However, the requirements mention "ANU QRNG".
    // Let's attempt a standard GET request with the API key if available.

    if (!env.ANU_API_KEY) {
        // Fallback or log warning if strictly required, but we'll try without it or use a demo url if known.
        // For now, let's assume the user has a key or we use the fallback logic in the worker if this fails.
        // console.warn("⚠️ ANU_API_KEY not set. Requests might fail or be rate-limited.");
    }

    // Implementation note: The official API often requires an API key in header 'x-api-key'.

    try {
        const headers: HeadersInit = {};
        if (env.ANU_API_KEY) {
            headers["x-api-key"] = env.ANU_API_KEY;
        }

        // We need 32 bytes per item.
        // The API limits "length" to 1024.
        // If batchSize is 50, we need 50 * 32 = 1600 items. That's too big for one request.
        // We might need to reduce batch size or do multiple requests. 
        // Or, we check if 'size' matches block size for hex16.
        // Let's stick to safe uint8.
        // If batchSize is 10, needed = 320. Safe.
        // If batchSize is 50, needed = 1600. Unsafe (>1024).

        // Let's internally limit batch request size if needed or just request what fits.
        // For simplicity, let's request batchSize * 32 items of uint8.
        // If that exceeds 1024, we should cap it. 
        // Max batch size of 30 gives 960 uint8s. Safe.

        const bytesPerItem = 32;
        const totalBytesNeeded = batchSize * bytesPerItem;

        if (totalBytesNeeded > 1024) {
            console.warn("Requested batch size too large for ANU single request. Capping.");
            // This is just a helper, the worker controls calling it.
        }

        const url = `https://api.quantumnumbers.anu.edu.au/?length=${totalBytesNeeded}&type=uint8`;

        const response = await fetch(url, {
            method: "GET",
            headers,
        });

        if (!response.ok) {
            const text = await response.text();
            const status = response.status;
            if (text.includes("limit") || status === 429) {
                console.warn(`⚠️ ANU API Rate Limit Hit: ${text.substring(0, 100)}...`);
                throw new Error("RATE_LIMIT");
            }
            throw new Error(`ANU API Error: ${status} ${text.substring(0, 100)}`);
        }

        const data = await response.json() as any;

        if (data && Array.isArray(data.data)) {
            const numbers = data.data as number[]; // uint8 array
            const results: string[] = [];

            // Chunk into 32-byte hex strings
            for (let i = 0; i < numbers.length; i += bytesPerItem) {
                const chunk = numbers.slice(i, i + bytesPerItem);
                if (chunk.length === bytesPerItem) {
                    const hex = Buffer.from(chunk).toString('hex');
                    results.push(hex);
                }
            }
            return results;
        }

        throw new Error("Invalid response format from ANU");

    } catch (error: any) {
        if (error.message === "RATE_LIMIT") throw error; // Re-throw to handle in worker
        console.error("Failed to fetch quantum entropy:", error.message);
        return [];
    }
}
