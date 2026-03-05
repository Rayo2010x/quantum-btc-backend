import React, { useEffect, useState } from 'react';
import { GameApi } from '../../lib/api';
import { Loader2, ShieldCheck, Database, Network, Key, CheckCircle2, Copy, RotateCw, ArrowRight } from 'lucide-react';

interface VerifyHistoryViewProps {
    sessionId: string | null;
}

// Helper to hash using Web Crypto API
async function sha256(message: string) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function VerifyHistoryView({ sessionId }: VerifyHistoryViewProps) {
    // History State
    const [bets, setBets] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    // Verify State
    const [verificationData, setVerificationData] = useState<any>(null);
    const [calculatedHash, setCalculatedHash] = useState<string | null>(null);
    const [calculatedOutcome, setCalculatedOutcome] = useState<number | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [verifyError, setVerifyError] = useState<string | null>(null);

    // Fetch History
    useEffect(() => {
        if (!sessionId) {
            setHistoryLoading(false);
            return;
        }

        const fetchHistory = async () => {
            try {
                const res = await GameApi.getHistory(sessionId);
                setBets(res.history);
            } catch (error) {
                console.error("Failed to fetch history:", error);
            } finally {
                setHistoryLoading(false);
            }
        };

        fetchHistory();

        // Polling history every 10 seconds for freshness
        const interval = setInterval(fetchHistory, 10000);
        return () => clearInterval(interval);
    }, [sessionId]);

    const handleVerify = async (e?: React.FormEvent, forceId?: string) => {
        if (e) e.preventDefault();

        const targetBetId = forceId;
        if (!targetBetId || !targetBetId.trim()) return;

        // Auto-scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });

        setVerificationData(null);
        setCalculatedHash(null);
        setCalculatedOutcome(null);
        setVerifyError(null);

        try {
            const data = await GameApi.checkStatus(targetBetId);

            if (!data.serverSeedReveal || !data.drandRandomness) {
                setVerifyError("Cryptographic ingredients not yet available. Wait for bet resolution.");
                return;
            }

            // Real Data mapping
            const mockData = {
                serverSeed: data.serverSeedReveal,
                clientSeed: data.clientSeed || 'Unknown',
                drandRound: data.drandRound || 0,
                drandRandomness: data.drandRandomness,
                anuBytes: data.serverSeedReveal, // ANU entropy was used as the server seed base in our latest route implementation
                finalOutcome: data.outcome
            };
            setVerificationData(mockData);

            // Client-side verification calculation
            // Formula: SHA256(server_seed + client_seed + drand_randomness + bet_id)
            // Note: Since `anu_quantum_bytes` = `server_seed` in DB, providing serverSeed is enough. 
            // The formula in actual implementation used in webhook.ts is: SHA256(entropyData + client_seed + drandRandomnessVal)
            const combinedString = `${mockData.serverSeed}${mockData.clientSeed}${mockData.drandRandomness}`;
            const hash = await sha256(combinedString);

            setCalculatedHash(hash);

            const hexPrefix = hash.substring(0, 8);
            const decimalVal = parseInt(hexPrefix, 16);
            setCalculatedOutcome(decimalVal % 37);

        } catch (error) {
            console.error(error);
            setVerifyError("Failed to fetch bet details or bet not found.");
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const isVerified = verificationData && calculatedOutcome !== null && calculatedOutcome === verificationData.finalOutcome;

    return (
        <div className="w-full max-w-5xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

            {/* --- TOP SECTION: THE VERIFIER --- */}
            <div className="space-y-10">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-2">
                        <ShieldCheck className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-4xl font-display font-bold text-white tracking-tight">
                        Verification <span className="text-primary">Laboratory</span>
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg pt-2">
                        Quantum BTC operates on a "Don't Trust, Verify" model. Audit the cryptographic fairness of your rounds here.
                    </p>
                </div>

                <div className="flex justify-center">
                    <p className="text-gray-500 italic text-sm">
                        Select a completed bet from the history table below to begin verification.
                    </p>
                </div>

                {verifyError && (
                    <div className="max-w-2xl mx-auto p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center font-medium">
                        {verifyError}
                    </div>
                )}

                {/* Results Area */}
                {verificationData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 animate-in fade-in zoom-in-95 duration-500">
                        {/* Left Column: Ingredients */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-6">
                                <Database className="w-5 h-5 text-gray-400" />
                                <h3 className="text-xl font-bold text-white">Cryptographic Ingredients</h3>
                            </div>

                            <div className="space-y-4">
                                <IngredientRow
                                    icon={<Key className="text-blue-400" />}
                                    label="Server Seed (ANU Quantum)"
                                    value={verificationData.serverSeed}
                                    tooltip="True physical randomness, revealed after settlement."
                                    onCopy={() => copyToClipboard(verificationData.serverSeed, 'server')}
                                    isCopied={copiedId === 'server'}
                                />
                                <IngredientRow
                                    icon={<Key className="text-green-400" />}
                                    label="Client Seed"
                                    value={verificationData.clientSeed}
                                    tooltip="Your local browser entropy preventing server manipulation."
                                    onCopy={() => copyToClipboard(verificationData.clientSeed, 'client')}
                                    isCopied={copiedId === 'client'}
                                />
                                <IngredientRow
                                    icon={<Network className="text-purple-400" />}
                                    label={`Drand Beacon (#${verificationData.drandRound})`}
                                    value={verificationData.drandRandomness}
                                    tooltip="Public randomness fetched at exact moment of transaction."
                                    link={`https://drand.love/explorer/`}
                                    onCopy={() => copyToClipboard(verificationData.drandRandomness, 'drand')}
                                    isCopied={copiedId === 'drand'}
                                />
                            </div>
                        </div>

                        {/* Right Column: Calculation Engine */}
                        <div className="bg-black/60 border border-white/10 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md flex flex-col">
                            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary left-0"></div>

                            <div className="flex items-center gap-2 mb-6">
                                <RotateCw className="w-5 h-5 text-gray-400" />
                                <h3 className="text-xl font-bold text-white">Client-Side Calculation</h3>
                            </div>

                            <div className="flex-1 space-y-6 flex flex-col justify-center">
                                {/* Formula */}
                                <div className="bg-black/40 rounded-lg p-4 font-mono text-xs text-gray-400 leading-relaxed border border-white/5 shadow-inner">
                                    <span className="text-primary">const</span> final_entropy = SHA256(<br />
                                    &nbsp;&nbsp;<span className="text-blue-400">ANU_quantum_bytes</span> + <br />
                                    &nbsp;&nbsp;<span className="text-green-400">client_seed</span> + <br />
                                    &nbsp;&nbsp;<span className="text-purple-400">drand_randomness</span> <br />
                                    );<br />
                                    <br />
                                    <span className="text-primary">const</span> result = parseInt(final_entropy.slice(0,8), 16) % 37;
                                </div>

                                {/* Hash Result */}
                                {calculatedHash && (
                                    <div className="space-y-2">
                                        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Generated Hash</div>
                                        <div className="bg-primary/5 border border-primary/20 text-primary font-mono text-xs p-3 rounded break-all">
                                            {calculatedHash}
                                        </div>
                                    </div>
                                )}

                                {/* Final Badge */}
                                {calculatedOutcome !== null && (
                                    <div className="pt-4 border-t border-white/10 mt-auto flex items-center justify-between">
                                        <div>
                                            <div className="text-sm text-gray-400">Calculated</div>
                                            <div className="text-4xl font-display font-bold text-white">{calculatedOutcome}</div>
                                        </div>
                                        {isVerified ? (
                                            <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-full flex items-center gap-2 font-bold text-sm">
                                                <CheckCircle2 className="w-5 h-5" />
                                                MATCH VERIFIED
                                            </div>
                                        ) : (
                                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-full flex gap-2 font-bold text-sm">
                                                MISMATCH
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>


            {/* --- BOTTOM SECTION: HISTORY TABLE --- */}
            <div className="space-y-6 pt-10 border-t border-white/10">
                <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white">Bet <span className="text-primary">History</span></h3>
                    <div className="text-sm text-gray-500 font-mono">
                        {sessionId ? `Session: ${sessionId.substring(0, 8)}...` : 'Connecting...'}
                    </div>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
                    {historyLoading ? (
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
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-center">Outcome</th>
                                        <th className="px-6 py-4 text-right">Net</th>
                                        <th className="px-6 py-4 text-center">Verification</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bets.map((bet) => {
                                        const isFinished = bet.status === 'WON' || bet.status === 'LOST';
                                        return (
                                            <tr key={bet.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 text-gray-400 font-mono text-xs whitespace-nowrap">
                                                    {(() => {
                                                        const d = new Date(bet.createdAt);
                                                        const pad = (n: number) => n.toString().padStart(2, '0');
                                                        return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}+00`;
                                                    })()}
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs text-gray-300">
                                                    {bet.id}
                                                </td>
                                                <td className="px-6 py-4 text-gray-400 text-xs">
                                                    {bet.status}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {isFinished ? (
                                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold
                                                        ${bet.outcome === 0 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                                                bet.outcome % 2 !== 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                                    'bg-white/10 text-white border border-white/20'}`}
                                                        >
                                                            {bet.outcome}
                                                        </span>
                                                    ) : <span className="text-gray-500">-</span>}
                                                </td>
                                                <td className={`px-6 py-4 text-right font-bold ${bet.status === 'WON' ? 'text-green-400' : bet.status === 'LOST' ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {bet.status === 'WON' ? `+${bet.payoutSat}` : bet.status === 'LOST' ? `-${bet.amountSat}` : `${bet.amountSat} pending`}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {isFinished && (
                                                        <button
                                                            onClick={() => handleVerify(undefined, bet.id)}
                                                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-white transition-colors px-3 py-1.5 rounded-full border border-primary/30 hover:bg-primary hover:border-primary"
                                                        >
                                                            Verify <ArrowRight size={14} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}

// Sub-component for ingredients
function IngredientRow({ icon, label, value, tooltip, onCopy, isCopied, link }: any) {
    return (
        <div className="bg-black/40 border border-white/5 rounded-lg p-4 group hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-sm font-bold text-gray-300" title={tooltip}>{label}</span>
                </div>
                {link && (
                    <a href={link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                        Verify Beacon ↗
                    </a>
                )}
            </div>
            <div className="flex items-center gap-2">
                <div className="flex-1 font-mono text-xs text-gray-500 truncate cursor-text">
                    {value || 'Retrieving...'}
                </div>
                <button
                    onClick={onCopy}
                    className="p-1.5 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"
                    title="Copy to clipboard"
                >
                    {isCopied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}
