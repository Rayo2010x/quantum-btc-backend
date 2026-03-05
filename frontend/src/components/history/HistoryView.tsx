import { useEffect, useState } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';


interface HistoryViewProps {
    sessionId: string | null;
    onVerifyClick: (betId: string) => void;
}

export function HistoryView({ sessionId, onVerifyClick }: HistoryViewProps) {
    const [bets, setBets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sessionId) {
            setLoading(false);
            return;
        }

        // TODO: Replace with actual API call once implemented in backend
        const fetchHistory = async () => {
            try {
                // Mock data for now until API is ready
                setTimeout(() => {
                    setBets([
                        { id: 'bet-123-abc', amountSat: 1500, status: 'WON', outcome: 17, payoutSat: 3600, createdAt: new Date().toISOString() },
                        { id: 'bet-456-def', amountSat: 500, status: 'LOST', outcome: 0, payoutSat: 0, createdAt: new Date(Date.now() - 3600000).toISOString() }
                    ]);
                    setLoading(false);
                }, 800);
            } catch (error) {
                console.error("Failed to fetch history:", error);
                setLoading(false);
            }
        };

        fetchHistory();
    }, [sessionId]);

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-display font-bold text-white">Your <span className="text-primary">Session History</span></h2>
                <p className="text-gray-400">Review your past bets and verify their quantum fairness.</p>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                        <p>Loading session history...</p>
                    </div>
                ) : bets.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p>No bets found for this session.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-400 uppercase bg-black/60 border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-4">Time</th>
                                    <th className="px-6 py-4">Bet ID</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4 text-center">Result</th>
                                    <th className="px-6 py-4 text-right">Payout</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bets.map((bet) => (
                                    <tr key={bet.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-gray-400 font-mono text-xs">
                                            {new Date(bet.createdAt).toLocaleTimeString()}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-gray-300">
                                            {bet.id.substring(0, 8)}...
                                        </td>
                                        <td className="px-6 py-4 text-white">
                                            {bet.amountSat} Sats
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold
                                                ${bet.outcome === 0 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                                    bet.outcome % 2 !== 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                        'bg-white/10 text-white border border-white/20'}`}
                                            >
                                                {bet.outcome}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold ${bet.status === 'WON' ? 'text-green-400' : 'text-gray-500'}`}>
                                            {bet.status === 'WON' ? `+${bet.payoutSat}` : `-${bet.amountSat}`}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => onVerifyClick(bet.id)}
                                                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-white transition-colors px-3 py-1.5 rounded-full border border-primary/30 hover:bg-primary hover:border-primary"
                                            >
                                                Verify <ArrowRight size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
