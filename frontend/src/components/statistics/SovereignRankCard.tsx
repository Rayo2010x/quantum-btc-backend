import { useEffect, useState } from 'react';
import { GameApi } from '../../lib/api';

interface RankCardProps {
    sessionId: string | null;
}

export function SovereignRankCard({ sessionId }: RankCardProps) {
    const [stv, setStv] = useState<number | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!sessionId) {
            setIsLoading(false);
            return;
        }

        GameApi.checkCampaignStatus(sessionId)
            .then(res => {
                if (res.registered) {
                    setStv(res.totalContributed);
                    setAddress(res.rewardAddress || null);
                }
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [sessionId]);

    if (isLoading) return null; // Or a small skeleton
    if (stv === null) return null; // Not registered

    let rankLabel = "Participant";
    let rankColor = "text-gray-400";
    
    if (stv >= 100001) {
        rankLabel = "Guardian";
        rankColor = "text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]";
    } else if (stv >= 10001) {
        rankLabel = "Sentinel";
        rankColor = "text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]";
    } else if (stv >= 1000) {
        rankLabel = "Quantum Scout";
        rankColor = "text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]";
    }

    return (
        <div className="glass rounded-2xl p-6 relative border-white/10 overflow-hidden mb-8 max-w-2xl mx-auto text-center">
            {/* Background glow based on rank color */}
            <div className={`absolute -top-20 -right-20 w-40 h-40 blur-3xl opacity-20 ${rankColor.split(' ')[0].replace('text-', 'bg-')}`}></div>
            
            <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">Quantum Genesis</h3>
            <div className="text-sm text-gray-400 mb-4">{address}</div>
            
            <div className="flex items-center justify-center gap-6">
                <div>
                    <div className="text-xs uppercase text-gray-500 mb-1">Your Rank</div>
                    <div className={`text-2xl md:text-3xl font-black font-display tracking-tight ${rankColor}`}>
                        {rankLabel}
                    </div>
                </div>
                <div className="w-px h-12 bg-white/10"></div>
                <div>
                    <div className="text-xs uppercase text-gray-500 mb-1">STV Contribution</div>
                    <div className="text-xl md:text-2xl font-bold font-mono text-white">
                        {stv.toLocaleString()} <span className="text-xs text-primary">sats</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
