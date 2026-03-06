
import axios from 'axios';

// Target production backend for Vercel deployment
const API_URL = import.meta.env.VITE_API_URL || 'https://quantum-btc-backend-production.up.railway.app/v1';

const api = axios.create({
    baseURL: API_URL,
});

export interface PlaceBetResponse {
    betId: string;
    paymentRequest: string; // BOLT11
    amountSat: number;
}

export interface BetStatusResponse {
    status: 'WAITING_PAYMENT' | 'WON' | 'LOST' | 'PROCESSING';
    outcome?: number;
    payoutSat?: number;
    serverSeedReveal?: string;
    clientSeed?: string;
    drandRound?: number;
    drandRandomness?: string;
    drandSignature?: string;
    lnurlWithdraw?: string;
    k1?: string;
    isClaimed?: boolean;
}

export interface BetHistoryResponse {
    history: {
        id: string;
        amountSat: number;
        payoutSat: number;
        status: string;
        outcome: number;
        createdAt: string;
    }[];
}

export interface StatisticsResponse {
    totalBets: number;
    frequencies: Record<number, number>;
}

// Session Management
async function getOrCreateSession(): Promise<string> {
    let sessionId = localStorage.getItem('qb_sessionId');

    // ALWAYS validate with backend to check for IP changes / Geo-blocking
    try {
        const payload = sessionId ? { sessionId } : {};
        const res = await api.post('/session/init', payload);

        // Backend returns either the same ID (if IP checked out) or a new one
        const validatedId = res.data.sessionId;

        if (validatedId !== sessionId) {
            console.log("Session rotated by backend (New IP or Expired)");
            localStorage.setItem('qb_sessionId', validatedId);
        }

        return validatedId;
    } catch (err) {
        console.error("Failed to init/validate session", err);
        // Fallback: Use local if available, though backend is likely down
        if (sessionId) return sessionId;
        throw new Error("Could not initialize game session");
    }
}

export const GameApi = {
    // `bets` is now pre-formatted by the UI as an array of objects matching the backend MultiBetSchema
    placeBet: async (betsArray: { numbers: number[], amount: number }[], clientSeed: string) => {
        let sessionId = await getOrCreateSession();

        if (betsArray.length === 0) throw new Error("No bets placed");

        try {
            const response = await api.post<PlaceBetResponse>('/game/bet', {
                sessionId,
                bets: betsArray,
                clientSeed,
            });
            return response.data;
        } catch (err: any) {
            if (arrIsSessionError(err)) {
                localStorage.removeItem('qb_sessionId');
                sessionId = await getOrCreateSession();
                const response = await api.post<PlaceBetResponse>('/game/bet', {
                    sessionId,
                    bets: betsArray,
                    clientSeed,
                });
                return response.data;
            }
            throw err;
        }
    },

    checkStatus: async (betId: string) => {
        const res = await api.get<BetStatusResponse>(`/game/bet/${betId}/status`);
        return res.data;
    },

    getHistory: async (sessionId: string) => {
        const res = await api.get<BetHistoryResponse>(`/game/history`, { params: { sessionId } });
        return res.data;
    },

    getHealth: async () => {
        const res = await api.get('/health');
        return res.data;
    },

    getStatistics: async (limit?: number | string) => {
        const params = limit ? { limit } : {};
        const res = await api.get<StatisticsResponse>(`/game/statistics`, { params });
        return res.data;
    },

    initSession: async () => {
        return getOrCreateSession();
    }
};

function arrIsSessionError(err: any): boolean {
    const msg = err.response?.data?.error;
    return msg === "Session not found" || msg === "Invalid Session";
}
