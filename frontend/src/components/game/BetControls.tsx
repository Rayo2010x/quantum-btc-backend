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
    // keys can be numbers "17" or group IDs "red", "col_1", "dozen_0"
    const [bets, setBets] = useState<Record<string, number>>({});
    const [chipValue, setChipValue] = useState<number>(100);
    const [loading, setLoading] = useState(false);

    // Non-Custodial States
    const [currentBet, setCurrentBet] = useState<PlaceBetResponse | null>(null);
    const [betStatus, setBetStatus] = useState<BetStatusResponse | null>(null);
    const [pollingBetId, setPollingBetId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [clientSeed, setClientSeed] = useState<string>('');
    const [showSettings, setShowSettings] = useState(false);

    // Animation State
    const [isSpinning, setIsSpinning] = useState(false);
    const [showResultOverlay, setShowResultOverlay] = useState(false);

    // System Limiter State
    const [isMaintenance, setIsMaintenance] = useState(false);

    const totalWager = Object.values(bets).reduce((a, b) => a + b, 0);

    // Standard European Roulette layout logic has been moved to OUTSIDE_BETS_MAP

    const handleNumberClick = (num: number) => {
        if (currentBet || isSpinning || isMaintenance) return; // Lock during spin or maintenance
        setBets(prev => {
            const current = prev[num.toString()] || 0;
            return {
                ...prev,
                [num.toString()]: current + chipValue
            };
        });
    };

    const handleOutsideBet = (groupId: string) => {
        if (currentBet || isSpinning || isMaintenance) return;
        setBets(prev => {
            const current = prev[groupId] || 0;
            return {
                ...prev,
                [groupId]: current + chipValue
            };
        });
    };

    // Outside Bet Definitions mapped to Arrays
    const OUTSIDE_BETS_MAP: Record<string, number[]> = {
        'col_0': Array.from({ length: 12 }, (_, i) => (i * 3) + 1), // 1, 4, 7...
        'col_1': Array.from({ length: 12 }, (_, i) => (i * 3) + 2), // 2, 5, 8...
        'col_2': Array.from({ length: 12 }, (_, i) => (i * 3) + 3), // 3, 6, 9...
        'doz_0': Array.from({ length: 12 }, (_, i) => i + 1), // 1-12
        'doz_1': Array.from({ length: 12 }, (_, i) => i + 13), // 13-24
        'doz_2': Array.from({ length: 12 }, (_, i) => i + 25), // 25-36
        'half_low': Array.from({ length: 18 }, (_, i) => i + 1), // 1-18
        'half_high': Array.from({ length: 18 }, (_, i) => i + 19), // 19-36
        'even': Array.from({ length: 36 }, (_, i) => i + 1).filter(n => n % 2 === 0),
        'odd': Array.from({ length: 36 }, (_, i) => i + 1).filter(n => n % 2 !== 0),
        'red': [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36],
        'black': Array.from({ length: 36 }, (_, i) => i + 1).filter(n => ![1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(n)),
    };

    // Helpers to calculate visual summary of bets placed on outside groups
    const getOutsideBetTotal = (groupId: string) => {
        return bets[groupId] || 0;
    };

    // Polling Hook
    useEffect(() => {
        if (!pollingBetId) return;

        const interval = setInterval(async () => {
            try {
                const status = await GameApi.checkStatus(pollingBetId);

                // If status changed to PROCESSING or WON/LOST
                if (status.status !== 'WAITING_PAYMENT') {
                    // Update the status object (which contains the outcome)
                    setBetStatus(status);

                    // If we have an outcome and aren't spinning yet, START SPIN!
                    if (status.outcome !== undefined && !isSpinning && !showResultOverlay) {
                        setIsSpinning(true);
                        setCurrentBet(null); // Hide QR code modal
                    }

                    // Stop polling if lost or if won and claimed
                    if (status.status === 'LOST' || (status.status === 'WON' && status.isClaimed)) {
                        clearInterval(interval);
                        setPollingBetId(null);
                    }
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        }, 1500); // Check every 1.5s

        return () => clearInterval(interval);
    }, [pollingBetId, isSpinning, showResultOverlay]);

    const handleAnimationFinish = () => {
        setIsSpinning(false);
        setShowResultOverlay(true);
    };

    const handleClear = () => {
        if ((currentBet && !betStatus?.outcome && !isSpinning) || isMaintenance) return;
        setBets({});
        setCurrentBet(null);
        setBetStatus(null);
        setPollingBetId(null);
        setIsSpinning(false);
        setShowResultOverlay(false);
    };

    const handleSpin = async () => {
        if (totalWager === 0) return;

        // Prevent spin if there is an unclaimed prize
        if (betStatus?.status === 'WON' && !betStatus.isClaimed) {
            const confirmed = window.confirm("Warning: You haven't claimed your prize yet! If you continue without claiming, you might lose it. Do you want to continue?");
            if (!confirmed) return;
        }

        setLoading(true);
        setError(null);
        setCurrentBet(null);
        setBetStatus(null);
        setPollingBetId(null);
        setIsSpinning(false);
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

            // Map the frontend Group IDs into actual number arrays for the backend
            const payloadArray: { numbers: number[], amount: number }[] = Object.entries(bets).map(([key, amount]) => {
                if (OUTSIDE_BETS_MAP[key]) {
                    return { numbers: OUTSIDE_BETS_MAP[key], amount: amount };
                } else {
                    return { numbers: [parseInt(key, 10)], amount: amount };
                }
            });

            const res = await GameApi.placeBet(payloadArray, finalSeed, 'roulette');
            setCurrentBet(res);
            setPollingBetId(res.betId);
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 400) {
                setError("Exposure Limit Reached: Maximum potential payout exceeds allowable risk. Please lower your wager.");
            } else if (err.response?.status === 403) {
                setError(err.response?.data?.message || "Service not available in your region.");
            } else if (err.response?.status === 503) {
                setIsMaintenance(true);
            } else {
                setError("Transaction failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 glass rounded-xl space-y-6 relative">

            {/* Error Overlay */}
            {error && (
                <div className="absolute top-4 left-4 right-4 z-[60] p-4 bg-red-900/90 border border-red-500 rounded-lg text-white flex justify-between items-center shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-4">
                    <span className="flex items-center gap-3"><AlertCircle size={20} className="shrink-0" /> <span className="text-sm font-medium">{error}</span></span>
                    <button onClick={() => setError(null)} className="hover:bg-white/10 p-1 rounded-md transition-colors"><X size={18} /></button>
                </div>
            )}

            {/* Maintenance Overlay */}
            {isMaintenance && (
                <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-6 rounded-xl border border-red-500/50 text-center animate-in zoom-in duration-300">
                    <AlertCircle size={56} className="text-red-500 mb-6 animate-pulse" />
                    <h2 className="text-3xl font-display font-bold text-red-500 mb-3 tracking-wide uppercase">Liquidity Maintenance</h2>
                    <p className="text-gray-300 max-w-sm mb-8 text-sm leading-relaxed">
                        The platform is currently operating under restricted liquidity mode. Betting controls are temporarily disabled to ensure player safety.
                    </p>
                    <button
                        onClick={() => setIsMaintenance(false)}
                        className="px-8 py-3 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 rounded-full font-display text-sm tracking-widest uppercase transition-all"
                    >
                        Acknowledge
                    </button>
                </div>
            )}

            {/* Payment Modal / Overlay */}
            {currentBet && !betStatus?.outcome && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-surface border border-primary/30 p-8 rounded-2xl max-w-md w-full text-center space-y-6 shadow-[0_0_50px_rgba(0,240,255,0.2)]">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2 font-display">Pay to Spin</h2>
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

                    <h2 className={cn("text-4xl font-bold mb-4 font-display", betStatus.status === 'WON' ? "text-green-400" : "text-red-400")}>
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

                    {/* Withdrawal QR or Claimed State if Won */}
                    {betStatus.status === 'WON' && (
                        <div className="bg-white/5 p-6 rounded-xl border border-green-500/30">
                            {betStatus.isClaimed ? (
                                <p className="text-green-400 font-bold mb-4 flex items-center justify-center gap-2 text-xl">
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

            {/* Betting Grid - Classic European Layout (NetEnt Style) */}
            <div className="flex flex-col w-full overflow-x-auto pb-6 pt-4 px-2 sm:px-4 bg-[#05401e] rounded-xl border-4 border-[#3a200a]/80 shadow-2xl relative">
                {/* Wood/Gold trim accent */}
                <div className="absolute inset-0 rounded-lg border border-[#e8c15a]/20 pointer-events-none"></div>

                <div className="min-w-[700px] flex relative z-10">
                    {/* Zero */}
                    <div className="w-12 sm:w-16 flex-shrink-0 flex flex-col items-stretch">
                        <NumberButton
                            num={0}
                            currentBet={bets['0']}
                            onClick={() => handleNumberClick(0)}
                            className="flex-1 w-full h-auto rounded-l-[2rem] border border-white/30 border-r-0 -mr-px"
                            isGreen
                        />
                    </div>

                    {/* Main Board (1-36) + Columns */}
                    <div className="flex-grow flex flex-col">
                        {/* Top Row: 3, 6, 9... 36 (Column 3) */}
                        <div className="flex h-12 sm:h-14">
                            {[3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].map(num => (
                                <NumberButton key={num} num={num} currentBet={bets[num.toString()]} onClick={() => handleNumberClick(num)} className="flex-1 rounded-none border-collapse -ml-px -mt-px first:ml-0" />
                            ))}
                            <OutsideBetButton label="2:1" currentBet={getOutsideBetTotal('col_2')} onClick={() => handleOutsideBet('col_2')} className="flex-1 font-sans text-[10px] sm:text-xs rounded-tr-3xl -ml-px -mt-px" />
                        </div>
                        {/* Middle Row: 2, 5, 8... 35 (Column 2) */}
                        <div className="flex h-12 sm:h-14">
                            {[2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].map(num => (
                                <NumberButton key={num} num={num} currentBet={bets[num.toString()]} onClick={() => handleNumberClick(num)} className="flex-1 rounded-none border-collapse -ml-px -mt-px first:ml-0" />
                            ))}
                            <OutsideBetButton label="2:1" currentBet={getOutsideBetTotal('col_1')} onClick={() => handleOutsideBet('col_1')} className="flex-1 font-sans text-[10px] sm:text-xs rounded-none -ml-px -mt-px" />
                        </div>
                        {/* Bottom Row: 1, 4, 7... 34 (Column 1) */}
                        <div className="flex h-12 sm:h-14">
                            {[1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].map(num => (
                                <NumberButton key={num} num={num} currentBet={bets[num.toString()]} onClick={() => handleNumberClick(num)} className="flex-1 rounded-none border-collapse -ml-px -mt-px first:ml-0" />
                            ))}
                            <OutsideBetButton label="2:1" currentBet={getOutsideBetTotal('col_0')} onClick={() => handleOutsideBet('col_0')} className="flex-1 font-sans text-[10px] sm:text-xs rounded-br-3xl -ml-px -mt-px" />
                        </div>
                    </div>
                </div>

                {/* Dozens Row */}
                <div className="min-w-[700px] flex relative z-10 pl-12 sm:pl-16 pr-[calc(5%+2rem)] sm:pr-[calc(8.33%+.5rem)]">
                    <OutsideBetButton label="1st 12" currentBet={getOutsideBetTotal('doz_0')} onClick={() => handleOutsideBet('doz_0')} className="flex-1 h-10 sm:h-12 -mt-px -ml-px" />
                    <OutsideBetButton label="2nd 12" currentBet={getOutsideBetTotal('doz_1')} onClick={() => handleOutsideBet('doz_1')} className="flex-1 h-10 sm:h-12 -mt-px -ml-px" />
                    <OutsideBetButton label="3rd 12" currentBet={getOutsideBetTotal('doz_2')} onClick={() => handleOutsideBet('doz_2')} className="flex-1 h-10 sm:h-12 -mt-px -ml-px" />
                </div>

                {/* Bottom Outside Bets Row */}
                <div className="min-w-[700px] flex relative z-10 pl-12 sm:pl-16 pr-[calc(5%+2rem)] sm:pr-[calc(8.33%+.5rem)] pb-2">
                    <OutsideBetButton label="1-18" currentBet={getOutsideBetTotal('half_low')} onClick={() => handleOutsideBet('half_low')} className="flex-1 h-12 sm:h-14 rounded-bl-3xl -mt-px -ml-px" />
                    <OutsideBetButton label="EVEN" currentBet={getOutsideBetTotal('even')} onClick={() => handleOutsideBet('even')} className="flex-1 h-12 sm:h-14 -mt-px -ml-px" />

                    {/* RED Diamond */}
                    <button onClick={() => handleOutsideBet('red')} className={cn("flex-1 relative h-12 sm:h-14 bg-transparent border border-white/30 hover:bg-white/10 transition-colors flex items-center justify-center group overflow-hidden -mt-px -ml-px", getOutsideBetTotal('red') > 0 && "border-primary ring-2 ring-primary ring-inset z-20")}>
                        <div className="w-6 h-6 bg-[#c91c1c] rotate-45 transform rounded-[2px] shadow-sm z-10 border border-white/40"></div>
                        {getOutsideBetTotal('red') > 0 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] z-20 animate-in fade-in zoom-in duration-200">
                                <div className="w-8 h-8 rounded-full bg-primary text-black flex items-center justify-center text-[10px] font-bold shadow-lg border border-white filter-none opacity-100">
                                    {getOutsideBetTotal('red') >= 1000 ? (getOutsideBetTotal('red') / 1000) + 'k' : getOutsideBetTotal('red')}
                                </div>
                            </div>
                        )}
                    </button>

                    {/* BLACK Diamond */}
                    <button onClick={() => handleOutsideBet('black')} className={cn("flex-1 relative h-12 sm:h-14 bg-transparent border border-white/30 hover:bg-white/10 transition-colors flex items-center justify-center group overflow-hidden -mt-px -ml-px", getOutsideBetTotal('black') > 0 && "border-primary ring-2 ring-primary ring-inset z-20")}>
                        <div className="w-6 h-6 bg-[#1c1c1c] rotate-45 transform rounded-[2px] shadow-sm z-10 border border-white/40"></div>
                        {getOutsideBetTotal('black') > 0 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] z-20 animate-in fade-in zoom-in duration-200">
                                <div className="w-8 h-8 rounded-full bg-primary text-black flex items-center justify-center text-[10px] font-bold shadow-lg border border-white filter-none opacity-100">
                                    {getOutsideBetTotal('black') >= 1000 ? (getOutsideBetTotal('black') / 1000) + 'k' : getOutsideBetTotal('black')}
                                </div>
                            </div>
                        )}
                    </button>

                    <OutsideBetButton label="ODD" currentBet={getOutsideBetTotal('odd')} onClick={() => handleOutsideBet('odd')} className="flex-1 h-12 sm:h-14 -mt-px -ml-px" />
                    <OutsideBetButton label="19-36" currentBet={getOutsideBetTotal('half_high')} onClick={() => handleOutsideBet('half_high')} className="flex-1 h-12 sm:h-14 rounded-br-3xl -mt-px -ml-px" />
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-6 justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <span className="block text-xs text-gray-500 uppercase">Total Bet</span>
                        <span className="text-2xl font-display font-bold text-white tracking-widest">{totalWager} Sats</span>
                    </div>
                    <button
                        onClick={handleClear}
                        className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                        title="Clear all bets"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
                
                <div className="flex-1 max-w-sm ml-4">
                    <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className="text-xs font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1 uppercase tracking-wider mb-2"
                    >
                        <AlertCircle size={14} /> Provably Fair Settings
                    </button>
                    
                    {showSettings && (
                        <div className="animate-in slide-in-from-top-2 fade-in duration-200 text-left">
                            <input 
                                type="text" 
                                value={clientSeed} 
                                onChange={(e) => setClientSeed(e.target.value)}
                                placeholder="Auto-generated if empty"
                                className="w-full bg-black/50 border border-white/20 rounded-md px-3 py-2 text-white font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <p className="text-[10px] text-gray-500 mt-1 leading-tight">
                                Provide your own entropy. Leave blank to auto-generate securely.
                            </p>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleSpin}
                    disabled={loading || totalWager === 0 || isMaintenance}
                    className={cn(
                        "w-full sm:w-auto px-10 py-4 rounded-full font-bold text-xl uppercase tracking-widest transition-all font-display",
                        loading || totalWager === 0 || isMaintenance
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
                "relative h-12 sm:h-14 font-bold transition-all border flex items-center justify-center overflow-hidden group border-white/30",
                isGreen
                    ? "bg-[#0b6b3a] text-white hover:bg-[#0e8a4a]"
                    : isRed
                        ? "bg-[#c91c1c] text-white hover:bg-[#e62020]"
                        : "bg-[#1c1c1c] text-white hover:bg-[#2e2e2e]",
                currentBet > 0 && "border-primary ring-2 ring-primary ring-inset z-20",
                className
            )}
        >
            <span className="z-10 font-display text-lg">{num}</span>

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

// Subcomponent for Outside Bets (Dozens, Columns, Red/Black, etc)
function OutsideBetButton({ label, currentBet, onClick, className }: { label: string, currentBet: number, onClick: () => void, className?: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "relative font-display font-bold text-sm tracking-widest transition-all border border-white/30 flex items-center justify-center overflow-hidden group",
                "bg-transparent text-white hover:bg-white/10",
                currentBet > 0 && "border-primary ring-2 ring-primary ring-inset z-20 text-white",
                className
            )}
        >
            <span className="z-10">{label}</span>

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
