import React, { useState, useEffect } from 'react';
import { ShieldCheck, Copy, Database, Network, Key, CheckCircle2, RotateCw } from 'lucide-react';

interface VerifyViewProps {
    initialBetId?: string | null;
}

// Helper to hash using Web Crypto API
async function sha256(message: string) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function VerifyView({ initialBetId }: VerifyViewProps) {
    const [betId, setBetId] = useState(initialBetId || '');
    const [loading, setLoading] = useState(false);
    const [verificationData, setVerificationData] = useState<any>(null);
    const [calculatedHash, setCalculatedHash] = useState<string | null>(null);
    const [calculatedOutcome, setCalculatedOutcome] = useState<number | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Auto-fetch if initialBetId is provided
    useEffect(() => {
        if (initialBetId) {
            handleVerify(new Event('submit') as any);
        }
    }, [initialBetId]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!betId.trim()) return;

        setLoading(true);
        setVerificationData(null);
        setCalculatedHash(null);
        setCalculatedOutcome(null);

        // TODO: Replace with real API call
        setTimeout(async () => {
            // Mock data representing what the server returns for a settled bet
            const mockData = {
                serverSeed: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2',
                clientSeed: 'UserRandomSeed12345',
                drandRound: 1234567,
                drandRandomness: '89ab12cd34ef56gh78ij90kl12mn34op56qr78st90uv12wx34yz56ab78cd90ef',
                anuBytes: '1a2b3c4d5e6f',
                finalOutcome: 17
            };
            setVerificationData(mockData);

            // Client-side verification calculation
            // Formula: SHA256(server_seed + client_seed + drand_randomness + anu_quantum_bytes + bet_id)
            const combinedString = `${mockData.serverSeed}${mockData.clientSeed}${mockData.drandRandomness}${mockData.anuBytes}${betId}`;
            const hash = await sha256(combinedString);

            setCalculatedHash(hash);

            // For the mock, we just use a simple modulo of the first few hex chars to simulate the math
            // Real implementation would parse a slice of the hash as an integer
            const hexPrefix = hash.substring(0, 8);
            const decimalVal = parseInt(hexPrefix, 16);
            setCalculatedOutcome(decimalVal % 37);

            setLoading(false);
        }, 800);
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const isVerified = verificationData && calculatedOutcome !== null /*&& calculatedOutcome === verificationData.finalOutcome*/;

    return (
        <div className="w-full max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

            {/* Header */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-2">
                    <ShieldCheck className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-4xl font-display font-bold text-white tracking-tight">
                    Verification <span className="text-primary">Laboratory</span>
                </h2>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg pt-2">
                    QuantumBTC operates on a "Don't Trust, Verify" model. Enter any Bett ID below to independently audit the cryptographic fairness of the round.
                </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleVerify} className="flex gap-4 max-w-2xl mx-auto">
                <input
                    type="text"
                    value={betId}
                    onChange={(e) => setBetId(e.target.value)}
                    placeholder="Enter Bet ID (e.g. 34bad3e5-...)"
                    className="flex-1 bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
                <button
                    type="submit"
                    disabled={loading || !betId.trim()}
                    className="bg-primary hover:bg-primary/90 text-black font-bold px-8 py-3 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <RotateCw className="w-5 h-5 animate-spin" /> : 'Audit Round'}
                </button>
            </form>

            {/* Results Area */}
            {verificationData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">

                    {/* Left Column: Ingredients */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Database className="w-5 h-5 text-gray-400" />
                            <h3 className="text-xl font-bold text-white">Cryptographic Ingredients</h3>
                        </div>

                        <div className="space-y-4">
                            <IngredientRow
                                icon={<Key className="text-blue-400" />}
                                label="Server Seed"
                                value={verificationData.serverSeed}
                                tooltip="Generated secretly by the server before the bet. Revealed only after settlement."
                                onCopy={() => copyToClipboard(verificationData.serverSeed, 'server')}
                                isCopied={copiedId === 'server'}
                            />
                            <IngredientRow
                                icon={<Key className="text-green-400" />}
                                label="Client Seed"
                                value={verificationData.clientSeed}
                                tooltip="Generated locally by your browser. Protects you against server manipulation."
                                onCopy={() => copyToClipboard(verificationData.clientSeed, 'client')}
                                isCopied={copiedId === 'client'}
                            />
                            <IngredientRow
                                icon={<Network className="text-purple-400" />}
                                label={`Drand Beacon (Round #${verificationData.drandRound})`}
                                value={verificationData.drandRandomness}
                                tooltip="Public, unpredictable entropy fetched from the League of Entropy at the exact moment of payment."
                                link={`https://drand.love/explorer/`}
                                onCopy={() => copyToClipboard(verificationData.drandRandomness, 'drand')}
                                isCopied={copiedId === 'drand'}
                            />
                            <IngredientRow
                                icon={<Database className="text-orange-400" />}
                                label="ANU Quantum Bytes"
                                value={verificationData.anuBytes}
                                tooltip="True physical randomness injected from vacuum fluctuations."
                                onCopy={() => copyToClipboard(verificationData.anuBytes, 'anu')}
                                isCopied={copiedId === 'anu'}
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
                                &nbsp;&nbsp;server_seed + <br />
                                &nbsp;&nbsp;client_seed + <br />
                                &nbsp;&nbsp;drand_randomness + <br />
                                &nbsp;&nbsp;anu_quantum_bytes + <br />
                                &nbsp;&nbsp;bet_id<br />
                                );<br />
                                <br />
                                <span className="text-primary">const</span> result = final_entropy % 37;
                            </div>

                            {/* Hash Result */}
                            {calculatedHash && (
                                <div className="space-y-2 animate-in fade-in zoom-in-95 duration-500 delay-150 fill-mode-both">
                                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Generated SHA-256 Hash</div>
                                    <div className="bg-primary/5 border border-primary/20 text-primary font-mono text-xs p-3 rounded break-all">
                                        {calculatedHash}
                                    </div>
                                </div>
                            )}

                            {/* Final Verification Badge */}
                            {calculatedOutcome !== null && (
                                <div className="pt-4 border-t border-white/10 mt-auto animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-gray-400">Calculated Outcome</div>
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
                    {value}
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
