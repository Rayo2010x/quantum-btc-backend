import { useState, useEffect } from 'react';
import { GameApi, type PlaceBetResponse, type BetStatusResponse } from '../../lib/api';
import { Loader2, Trash2, X, AlertCircle, CheckCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { SpinWheel } from './SpinWheel';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function BetControls() {
    const [bets, setBets] = useState<Record<number, number>>({});
    const [chipValue, setChipValue] = useState<number>(100);
    const [loading, setLoading] = useState(false);

    // Non-Custodial States
    const [currentBet, setCurrentBet] = useState<PlaceBetResponse | null>(null);
    const [betStatus, setBetStatus] = useState<BetStatusResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Animation State
    const [isSpinning, setIsSpinning] = useState(false);
    const [showResultOverlay, setShowResultOverlay] = useState(false);

    const totalWager = Object.values(bets).reduce((a, b) => a + b, 0);

    const handleNumberClick = (num: number) => {
        if (currentBet || isSpinning) return; // Lock during spin
        setBets(prev => {
            const current = prev[num] || 0;
            return {
                ...prev,
                [num]: current + chipValue
            };
        });
    };

    // Polling Hook
    useEffect(() => {
        if (!currentBet) return;
        // If we already have a result displayed, stop polling.
        if (showResultOverlay) return;

        const interval = setInterval(async () => {
            try {
                const status = await GameApi.checkStatus(currentBet.betId);

                // If status changed to PROCESSING or WON/LOST
                if (status.status !== 'WAITING_PAYMENT') {
                    // Update the status object (which contains the outcome)
                    setBetStatus(status);

                    // If we have an outcome and aren't spinning yet, START SPIN!
                    if (status.outcome !== undefined && !isSpinning && !showResultOverlay) {
                        setIsSpinning(true);
                        setCurrentBet(null); // Hide QR code modal
                    }

                    if (status.status === 'WON' || status.status === 'LOST') {
                        clearInterval(interval);
                    }
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        }, 1500); // Check every 1.5s

        return () => clearInterval(interval);
    }, [currentBet, betStatus, isSpinning, showResultOverlay]);

    const handleAnimationFinish = () => {
        setIsSpinning(false);
        setShowResultOverlay(true);
    };

    const handleClear = () => {
        if (currentBet && !betStatus?.outcome && !isSpinning) return;
        setBets({});
        setCurrentBet(null);
        setBetStatus(null);
        setIsSpinning(false);
        setShowResultOverlay(false);
    };

    const handleSpin = async () => {
        if (totalWager === 0) return;
        setLoading(true);
        setError(null);
        setCurrentBet(null);
        setBetStatus(null);
        setIsSpinning(false);
        setShowResultOverlay(false);

        try {
            const clientSeed = "client-seed-" + Math.random().toString(36).substring(7);
            const res = await GameApi.placeBet(bets, clientSeed);
            setCurrentBet(res);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || err.message || "Failed to create invoice");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-surface/50 backdrop-blur-sm rounded-xl border border-white/10 space-y-6 relative">

            {/* Error Overlay */}
            {error && (
                <div className="absolute top-4 left-4 right-4 z-50 p-4 bg-red-900/90 border border-red-500 rounded-lg text-white flex justify-between items-center">
                    <span className="flex items-center gap-2"><AlertCircle size={18} /> {error}</span>
                    <button onClick={() => setError(null)}><X size={18} /></button>
                </div>
            )}

            {/* Payment Modal / Overlay */}
            {currentBet && !betStatus?.outcome && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-surface border border-primary/30 p-8 rounded-2xl max-w-md w-full text-center space-y-6 shadow-[0_0_50px_rgba(0,240,255,0.2)]">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Pay to Spin</h2>
                            <p className="text-gray-400">Scan via Lightning Wallet</p>
                        </div>

                        <div className="bg-white p-4 rounded-xl inline-block">
                            <QRCodeSVG value={currentBet.paymentRequest} size={200} />
                        </div>

                        <div className="font-mono text-xl text-primary font-bold">
                            {currentBet.amountSat} sats
                        </div>

                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 animate-pulse">
                            <Loader2 className="animate-spin" size={16} /> Waiting for payment...
                        </div>

                        <button
                            onClick={() => setCurrentBet(null)}
                            className="text-gray-500 hover:text-white underline text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Spin Wheel Animation */}
            {(isSpinning || showResultOverlay) && (
                <div className="mb-8 transform scale-90 sm:scale-100 transition-all">
                    <SpinWheel
                        targetNumber={betStatus?.outcome ?? 0} // Default 0 if undefined, but logic ensures defined
                        isSpinning={isSpinning}
                        onFinish={handleAnimationFinish}
                    />
                </div>
            )}

            {/* Result Overlay - Only show AFTER animation finishes */}
            {showResultOverlay && betStatus && (
                <div className="p-6 rounded-xl border text-center animate-in fade-in zoom-in duration-300 bg-black/40 border-white/10 mb-6 relative overflow-hidden">
                    <div className={cn(
                        "absolute top-0 left-0 w-full h-1",
                        betStatus.status === 'WON' ? "bg-green-500" : "bg-red-500"
                    )} />

                    <h2 className={cn("text-4xl font-bold mb-4", betStatus.status === 'WON' ? "text-green-400" : "text-red-400")}>
                        {betStatus.status === 'WON' ? "YOU WON!" : "ROUND OVER"}
                    </h2>

                    <div className="flex flex-wrap justify-center gap-8 mb-6">
                        <div>
                            <span className="text-gray-500 block text-xs uppercase">Outcome</span>
                            <span className="font-mono text-3xl text-white">{betStatus.outcome}</span>
                        </div>
                        {betStatus.payoutSat ? (
                            <div>
                                <span className="text-gray-500 block text-xs uppercase">Prize</span>
                                <span className="font-mono text-3xl text-green-400">+{betStatus.payoutSat} sats</span>
                            </div>
                        ) : null}
                    </div>

                    {/* Withdrawal QR if Won */}
                    {betStatus.status === 'WON' && betStatus.lnurlWithdraw && (
                        <div className="bg-white/5 p-6 rounded-xl border border-green-500/30">
                            <p className="text-green-400 font-bold mb-4 flex items-center justify-center gap-2">
                                <CheckCircle size={20} /> CLAIM YOUR PRIZE
                            </p>
                            <div className="bg-white p-3 rounded-lg inline-block mb-4">
                                <QRCodeSVG value={betStatus.lnurlWithdraw} size={150} />
                            </div>
                            <p className="text-xs text-gray-500">Scan with Wallet to Withdraw</p>
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <button onClick={handleClear} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm">
                                    Play Again
                                </button>
                            </div>
                        </div>
                    )}

                    {betStatus.status === 'LOST' && (
                        <button onClick={handleClear} className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full font-bold">
                            Try Again
                        </button>
                    )}
                </div>
            )}

            {/* Chip Selection */}
            <div className="flex items-center justify-center gap-4 py-2">
                <span className="text-sm text-gray-400 uppercase tracking-widest">Chip Value</span>
                {[50, 100, 500, 1000].map(val => (
                    <button
                        key={val}
                        onClick={() => setChipValue(val)}
                        className={cn(
                            "w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-xs sm:text-sm transition-all",
                            chipValue === val
                                ? "bg-primary text-black border-primary scale-110 shadow-[0_0_15px_rgba(0,240,255,0.5)]"
                                : "bg-black/50 text-gray-400 border-white/20 hover:border-white/50"
                        )}
                    >
                        {val}
                    </button>
                ))}
            </div>

            {/* Betting Grid */}
            <div className="grid grid-cols-12 gap-1 sm:gap-2 select-none">
                {/* 0 Green */}
                <NumberButton
                    num={0}
                    currentBet={bets[0]}
                    onClick={() => handleNumberClick(0)}
                    className="col-span-12"
                    isGreen
                />

                {/* 1-36 */}
                {Array.from({ length: 36 }, (_, i) => {
                    const num = i + 1;
                    return (
                        <NumberButton
                            key={num}
                            num={num}
                            currentBet={bets[num]}
                            onClick={() => handleNumberClick(num)}
                            className="col-span-4 sm:col-span-3 md:col-span-1"
                        />
                    );
                })}
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-6 justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <span className="block text-xs text-gray-500 uppercase">Total Bet</span>
                        <span className="text-xl font-mono font-bold text-white">{totalWager} Sats</span>
                    </div>
                    <button
                        onClick={handleClear}
                        className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                        title="Clear all bets"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>

                <button
                    onClick={handleSpin}
                    disabled={loading || totalWager === 0}
                    className={cn(
                        "w-full sm:w-auto px-10 py-4 rounded-full font-bold text-xl uppercase tracking-widest transition-all",
                        loading || totalWager === 0
                            ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                            : "bg-primary text-black hover:bg-primary/90 shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] active:scale-95"
                    )}
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="animate-spin" /> Spinning...
                        </span>
                    ) : (
                        "SPIN"
                    )}
                </button>
            </div>
        </div>
    );
}

// Subcomponent for grid buttons
function NumberButton({ num, currentBet, onClick, className, isGreen }: any) {
    // Red/Black Logic
    let isRed = false;
    if (num !== 0) {
        if (num <= 10 || (num >= 19 && num <= 28)) {
            isRed = num % 2 !== 0;
        } else {
            isRed = num % 2 === 0;
        }
    }

    return (
        <button
            onClick={onClick}
            className={cn(
                "relative h-12 sm:h-14 rounded-md font-bold transition-all border flex items-center justify-center overflow-hidden group",
                isGreen
                    ? "bg-green-900/40 text-green-400 border-green-500/20 hover:bg-green-900/60"
                    : isRed
                        ? "bg-red-900/20 text-red-400 border-red-500/20 hover:bg-red-900/40"
                        : "bg-gray-800/40 text-gray-300 border-white/5 hover:bg-gray-800/80",
                currentBet > 0 && "border-primary/50 ring-1 ring-primary/50",
                className
            )}
        >
            <span className="z-10">{num}</span>

            {/* Chip Indicator */}
            {currentBet > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px] z-20 animate-in fade-in zoom-in duration-200">
                    <div className="w-8 h-8 rounded-full bg-primary text-black flex items-center justify-center text-[10px] font-bold shadow-lg border border-white">
                        {currentBet >= 1000 ? (currentBet / 1000) + 'k' : currentBet}
                    </div>
                </div>
            )}
        </button>
    );
}
