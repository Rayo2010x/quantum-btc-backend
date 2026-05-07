import { useState, useEffect } from 'react';
import { GameApi, type PlaceBetResponse, type BetStatusResponse } from '../../lib/api';
import { Loader2, AlertCircle, X, CheckCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from './BetControls';
import { PlinkoBoard } from './PlinkoBoard';

export function PlinkoGame({ sessionId, isMaintenance }: { sessionId: string | null; isMaintenance: boolean }) {
    const [wager, setWager] = useState<number>(100);
    const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('medium');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [clientSeed, setClientSeed] = useState<string>('');
    const [showSettings, setShowSettings] = useState(false);

    // Non-Custodial States
    const [currentBet, setCurrentBet] = useState<PlaceBetResponse | null>(null);
    const [betStatus, setBetStatus] = useState<BetStatusResponse | null>(null);
    const [pollingBetId, setPollingBetId] = useState<string | null>(null);

    // Animation State
    const [isDropping, setIsDropping] = useState(false);
    const [showResultOverlay, setShowResultOverlay] = useState(false);

    useEffect(() => {
        if (!pollingBetId) return;

        const interval = setInterval(async () => {
            try {
                const status = await GameApi.checkStatus(pollingBetId);
                if (status.status !== 'WAITING_PAYMENT') {
                    setBetStatus(status);
                    
                    if (status.outcome !== undefined && !isDropping && !showResultOverlay) {
                        setIsDropping(true);
                        setCurrentBet(null);
                    }

                    if (status.status === 'LOST' || (status.status === 'WON' && status.isClaimed)) {
                        clearInterval(interval);
                        setPollingBetId(null);
                    }
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        }, 1500);

        return () => clearInterval(interval);
    }, [pollingBetId, isDropping, showResultOverlay]);

    const handleDropFinish = () => {
        setIsDropping(false);
        setShowResultOverlay(true);
    };

    const handleDrop = async () => {
        if (wager <= 0 || isMaintenance) return;
        
        if (betStatus?.status === 'WON' && !betStatus.isClaimed) {
            const confirmed = window.confirm("Warning: You haven't claimed your prize yet! If you continue, you might lose it. Continue?");
            if (!confirmed) return;
        }

        setLoading(true);
        setError(null);
        setCurrentBet(null);
        setBetStatus(null);
        setPollingBetId(null);
        setIsDropping(false);
        setShowResultOverlay(false);

        try {
            let finalSeed = clientSeed.trim();
            if (!finalSeed) {
                // Generate a secure 16-byte hex string
                const array = new Uint8Array(16);
                window.crypto.getRandomValues(array);
                finalSeed = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
                setClientSeed(finalSeed); // Update UI so user sees what was generated
            }
            
            const payload = [{ rows: 16, risk, amount: wager }];
            
            const res = await GameApi.placeBet(payload, finalSeed, 'plinko');
            setCurrentBet(res);
            setPollingBetId(res.betId);
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 400) {
                setError("Exposure Limit Reached: Maximum potential payout exceeds allowable risk. Please lower your wager.");
            } else {
                setError("Transaction failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-start min-h-[80vh] text-center space-y-8 max-w-5xl mx-auto">
            {/* Hero Section */}
            <div className="space-y-4 pt-8">
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter font-display">
                    QUANTUM FAIR <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">PLINKO</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
                    A provably fair 50/50 gravity drop powered by SHA256 entropy.
                </p>
            </div>

            <div className="w-full glass p-6 rounded-2xl relative border border-white/5">
                {/* Error Overlay */}
                {error && (
                    <div className="absolute top-4 left-4 right-4 z-[60] p-4 bg-red-900/90 border border-red-500 rounded-lg text-white flex justify-between items-center shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-4">
                        <span className="flex items-center gap-3"><AlertCircle size={20} className="shrink-0" /> <span className="text-sm font-medium">{error}</span></span>
                        <button onClick={() => setError(null)} className="hover:bg-white/10 p-1 rounded-md transition-colors"><X size={18} /></button>
                    </div>
                )}

                {/* Main Game Layout */}
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Controls Sidebar */}
                    <div className="w-full lg:w-80 flex flex-col gap-6 bg-black/40 p-6 rounded-xl border border-white/5 h-fit">
                        {/* Wager Input */}
                        <div className="space-y-2 text-left">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bet Amount (Sats)</label>
                            <div className="flex gap-2">
                                <input 
                                    type="number" 
                                    value={wager} 
                                    onChange={(e) => setWager(Math.max(1, parseInt(e.target.value) || 0))}
                                    className="w-full bg-black/50 border border-white/20 rounded-md px-4 py-3 text-white font-mono text-xl focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                <button onClick={() => setWager(Math.floor(wager / 2))} className="bg-white/10 hover:bg-white/20 px-4 rounded-md font-bold transition-colors">/2</button>
                                <button onClick={() => setWager(wager * 2)} className="bg-white/10 hover:bg-white/20 px-4 rounded-md font-bold transition-colors">x2</button>
                            </div>
                        </div>

                        {/* Risk Selector */}
                        <div className="space-y-2 text-left">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Risk Level</label>
                            <div className="flex bg-black/50 p-1 rounded-lg border border-white/10">
                                {['low', 'medium', 'high'].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setRisk(r as any)}
                                        className={cn(
                                            "flex-1 py-2 text-sm font-bold uppercase rounded-md transition-all",
                                            risk === r ? "bg-primary text-black shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Provably Fair Settings Toggle */}
                        <div className="pt-2 text-left">
                            <button 
                                onClick={() => setShowSettings(!showSettings)}
                                className="text-xs font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1 uppercase tracking-wider"
                            >
                                <AlertCircle size={14} /> Provably Fair Settings
                            </button>
                            
                            {showSettings && (
                                <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 fade-in duration-200">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Client Seed</label>
                                    <input 
                                        type="text" 
                                        value={clientSeed} 
                                        onChange={(e) => setClientSeed(e.target.value)}
                                        placeholder="Auto-generated if empty"
                                        className="w-full bg-black/50 border border-white/20 rounded-md px-3 py-2 text-white font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                    <p className="text-[10px] text-gray-500 leading-tight">
                                        Provide your own entropy to guarantee the casino cannot predict the outcome. Leave blank to auto-generate securely.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={handleDrop}
                            disabled={loading || wager <= 0 || isMaintenance || isDropping}
                            className={cn(
                                "w-full py-5 rounded-xl font-bold text-2xl uppercase tracking-widest transition-all font-display mt-auto",
                                loading || wager <= 0 || isMaintenance || isDropping
                                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                                    : "bg-primary text-black hover:bg-primary/90 shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] active:scale-95"
                            )}
                        >
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : "DROP"}
                        </button>
                    </div>

                    {/* Plinko Board Area */}
                    <div className="flex-1 relative">
                        {/* Payment Overlay */}
                        {currentBet && !betStatus?.outcome && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-xl">
                                <div className="bg-surface border border-primary/30 p-8 rounded-2xl max-w-sm w-full text-center space-y-6 shadow-[0_0_50px_rgba(0,240,255,0.2)]">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-2 font-display">Pay to Drop</h2>
                                        <p className="text-gray-400">Scan via Lightning Wallet</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl inline-block">
                                        <QRCodeSVG value={currentBet.paymentRequest} size={200} />
                                    </div>
                                    <div className="font-mono text-xl text-primary font-bold font-display">
                                        {currentBet.amountSat} sats
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500 animate-pulse">
                                        <Loader2 className="animate-spin" size={16} /> Waiting for payment...
                                    </div>
                                </div>
                            </div>
                        )}

                        <PlinkoBoard 
                            isDropping={isDropping} 
                            targetSlot={betStatus?.outcome ?? null} 
                            risk={risk}
                            onDropFinish={handleDropFinish}
                        />
                    </div>
                </div>

                {/* Result Overlay */}
                {showResultOverlay && betStatus && (
                    <div className="mt-8 p-6 rounded-xl border text-center animate-in fade-in zoom-in duration-300 bg-black/40 border-white/10 overflow-hidden relative">
                        <div className={cn(
                            "absolute top-0 left-0 w-full h-1",
                            betStatus.payoutSat && betStatus.payoutSat > wager ? "bg-green-500" : "bg-red-500"
                        )} />

                        <div className="flex flex-wrap justify-center gap-12 mb-6">
                            <div>
                                <span className="text-gray-500 block text-xs uppercase">Multiplier</span>
                                <span className="font-mono text-3xl text-white">x{(betStatus.payoutSat! / wager).toFixed(2)}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs uppercase">Prize</span>
                                <span className={cn("font-mono text-3xl", betStatus.payoutSat && betStatus.payoutSat > wager ? "text-green-400" : "text-gray-300")}>
                                    {betStatus.payoutSat} sats
                                </span>
                            </div>
                        </div>

                        {/* Withdrawal QR or Claimed State if Won */}
                        {betStatus.status === 'WON' && (
                            <div className="bg-white/5 p-6 rounded-xl border border-green-500/30 inline-block w-full max-w-md">
                                {betStatus.isClaimed ? (
                                    <p className="text-green-400 font-bold flex items-center justify-center gap-2 text-xl">
                                        <CheckCircle size={28} /> Prize transferred. Congrats!
                                    </p>
                                ) : (
                                    <>
                                        <p className="text-green-400 font-bold mb-4 flex items-center justify-center gap-2">
                                            <CheckCircle size={20} /> CLAIM YOUR PRIZE
                                        </p>
                                        {betStatus.lnurlWithdraw && (
                                            <div className="bg-white p-3 rounded-lg inline-block mb-4">
                                                <QRCodeSVG value={betStatus.lnurlWithdraw} size={150} />
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-500">Scan with Wallet to Withdraw</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            <div className="text-xs text-gray-600 font-mono pt-4">
                Session ID: {sessionId || 'Initializing...'}
            </div>
        </div>
    );
}
