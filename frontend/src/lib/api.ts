
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

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
    lnurlWithdraw?: string;
    k1?: string;
}

// Session Management (Still used for grouping, but not balance)
async function getOrCreateSession(): Promise<string> {
    let sessionId = localStorage.getItem('qb_sessionId');
    if (!sessionId) {
        try {
            const res = await api.post('/session/init');
            sessionId = res.data.sessionId;
            localStorage.setItem('qb_sessionId', sessionId || '');
        } catch (err) {
            console.error("Failed to init session", err);
            throw new Error("Could not initialize game session");
        }
    }
    return sessionId as string;
}

export const GameApi = {
    placeBet: async (bets: Record<number, number>, clientSeed: string) => {
        let sessionId = await getOrCreateSession();

        // Transform map to array
        const betsArray = Object.entries(bets).map(([numStr, amount]) => ({
            number: parseInt(numStr, 10),
            amount: amount
        }));

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

    getHealth: async () => {
        const res = await api.get('/health');
        return res.data;
    }
};

function arrIsSessionError(err: any): boolean {
    const msg = err.response?.data?.error;
    return msg === "Session not found" || msg === "Invalid Session";
}
