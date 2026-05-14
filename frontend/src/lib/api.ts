
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

export interface RunResult {
    run: number;
    outcome: number;
    payout_sat: number;
    multiplier?: number;
    path?: number[];
}

export interface BetStatusResponse {
    status: 'WAITING_PAYMENT' | 'WON' | 'LOST' | 'PROCESSING';
    outcome?: number;
    gameType?: string;
    payoutSat?: number;
    runsCount?: number;
    runResults?: RunResult[] | null;
    serverSeedReveal?: string;
    clientSeed?: string;
    drandRound?: number;
    drandRandomness?: string;
    drandSignature?: string;
    lnurlWithdraw?: string;
    k1?: string;
    isClaimed?: boolean;
    betDetails?: any;
}

export interface BetHistoryResponse {
    history: {
        id: string;
        amountSat: number;
        payoutSat: number;
        runsCount?: number;
        status: string;
        outcome: number;
        gameType?: string;
        createdAt: string;
    }[];
}

export interface StatisticsResponse {
    totalBets: number;
    totalRuns: number;
    frequencies: Record<number, number>;
    plinkoFrequencies?: Record<number, Record<number, number>>;
}

// Campaign Models
export interface CampaignCheckResponse {
    registered: boolean;
    rewardAddress?: string;
    totalContributed: number;
}

export interface CampaignRegisterResponse {
    message: string;
    registrationId: string;
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
    // `bets` is now an array of objects matching either Roulette or Plinko schemas
    placeBet: async (betsArray: any[], clientSeed: string, gameType: 'roulette' | 'plinko' = 'roulette', runsCount: number = 1) => {
        let sessionId = await getOrCreateSession();

        if (betsArray.length === 0) throw new Error("No bets placed");

        try {
            const response = await api.post<PlaceBetResponse>('/game/bet', {
                sessionId,
                gameType,
                runsCount,
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
                    gameType,
                    runsCount,
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

    getStatistics: async (limit?: number | string, gameType?: string) => {
        const params: any = {};
        if (limit) params.limit = limit;
        if (gameType) params.gameType = gameType;
        const res = await api.get<StatisticsResponse>(`/game/statistics`, { params });
        return res.data;
    },

    initSession: async () => {
        return getOrCreateSession();
    },

    // Campaign Methods
    checkCampaignStatus: async (sessionId: string) => {
        const res = await api.get<CampaignCheckResponse>(`/campaign/check`, { params: { sessionId } });
        return res.data;
    },

    registerCampaign: async (sessionId: string, rewardAddress: string) => {
        const res = await api.post<CampaignRegisterResponse>(`/campaign/register`, { sessionId, rewardAddress });
        return res.data;
    }
};

export const DonationsApi = {
    createDonation: async (amountSat: number, address?: string) => {
        const res = await api.post<{id: string, paymentRequest: string, chargeId: string}>('/donations/create', { amountSat, address });
        return res.data;
    },
    checkStatus: async (id: string) => {
        const res = await api.get<{status: string}>(`/donations/${id}/status`);
        return res.data;
    }
};

function arrIsSessionError(err: any): boolean {
    const msg = err.response?.data?.error;
    return msg === "Session not found" || msg === "Invalid Session";
}
