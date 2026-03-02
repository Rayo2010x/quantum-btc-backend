export interface DrandResponse {
    round: number;
    randomness: string;
    signature: string;
}

/**
 * Fetches the latest randomness from the public drand beacon.
 * Enforces a strict timeout to ensure Lightning Network resolution isn't delayed.
 * @param timeoutMs The maximum amount of time to wait (defaults to 1500ms).
 * @returns DrandResponse object if successful, null if failed or timed out.
 */
export async function fetchDrandLatest(timeoutMs: number = 1500): Promise<DrandResponse | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        console.log(`⏱️ Fetching drand beacon... (Timeout: ${timeoutMs}ms)`);
        const response = await fetch("https://api.drand.sh/public/latest", {
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`Drand API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        return {
            round: data.round,
            randomness: data.randomness,
            signature: data.signature
        };
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.warn(`⚠️ Drand fetch timed out after ${timeoutMs}ms. Yielding to fallback.`);
        } else {
            console.warn(`⚠️ Drand fetch failed: ${error.message}. Yielding to fallback.`);
        }
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}
