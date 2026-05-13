import { useState, useEffect, useCallback } from 'react';
import { GameApi, type PlaceBetResponse, type BetStatusResponse } from '../../lib/api';
import { Loader2, AlertCircle, X, CheckCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from './BetControls';
import { PlinkoBoard, MULTIPLIERS, type BallData } from './PlinkoBoard';

const ALLOWED_RUNS = [1, 2, 5, 10] as const;
type RunsCount = typeof ALLOWED_RUNS[number];

const ALLOWED_ROWS = [8, 12, 16] as const;
type RowsCount = typeof ALLOWED_ROWS[number];

export function PlinkoGame({ sessionId, isMaintenance }: { sessionId: string | null; isMaintenance: boolean }) {
    const [wager, setWager] = useState<number>(100);
    const [runsCount, setRunsCount] = useState<RunsCount>(1);
    const [rows, setRows] = useState<RowsCount>(16);
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
    const [ballsData, setBallsData] = useState<BallData[]>([]);

    // Computed values

    const wagerPerRun = Math.floor(wager / runsCount);
    const minBet = 5 * runsCount;

    useEffect(() => {
        if (!pollingBetId) return;

        const interval = setInterval(async () => {
            try {
                const status = await GameApi.checkStatus(pollingBetId);
                if (status.status !== 'WAITING_PAYMENT') {
                    setBetStatus(status);
                    
                    if (status.outcome !== undefined && !isDropping && !showResultOverlay) {
                        // Compute paths for all balls
                        const computedBalls: BallData[] = [];
                        const effectiveRunsCount = status.runsCount || 1;
                        const runResults = status.runResults || [];

                        if (runResults.length > 0) {
                            // Multi-run: use runResults with path data
                            for (const run of runResults) {
                                if (run.path && run.path.length === 16) {
                                    computedBalls.push({
                                        path: run.path,
                                        slot: run.outcome,
                                    });
                                } else {
                                    // Fallback: compute path from seeds with nonce
                                    const path = await computePathFromSeeds(
                                        status.serverSeedReveal,
                                        status.clientSeed,
                                        status.drandRandomness,
                                        run.run,
                                        effectiveRunsCount,
                                        rows
                                    );
                                    computedBalls.push({
                                        path: path || generateFallbackPath(run.outcome, rows),
                                        slot: run.outcome,
                                    });
                                }
                            }
                        } else if (status.outcome !== undefined) {
                            // Single-run backward compat (no runResults)
                            const path = await computePathFromSeeds(
                                status.serverSeedReveal,
                                status.clientSeed,
                                status.drandRandomness,
                                0,
                                1,
                                rows
                            );
                            computedBalls.push({
                                path: path || generateFallbackPath(status.outcome, rows),
                                slot: status.outcome,
                            });
                        }

                        setBallsData(computedBalls);
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

    const handleDropFinish = useCallback(() => {
        setIsDropping(false);
        setShowResultOverlay(true);
    }, []);

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
        setBallsData([]);

        try {
            let finalSeed = clientSeed.trim();
            if (!finalSeed) {
                // Generate a secure 16-byte hex string
                const array = new Uint8Array(16);
                window.crypto.getRandomValues(array);
                finalSeed = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
                setClientSeed(finalSeed); // Update UI so user sees what was generated
            }
            
            const payload = [{ rows, risk, amount: wager }];
            
            const res = await GameApi.placeBet(payload, finalSeed, 'plinko', runsCount);
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

    // Compute summary stats from runResults
    const summaryStats = computeSummary(betStatus, wager, risk, runsCount, rows);

    return (
        <div className="flex flex-col items-center justify-start min-h-[80vh] text-center space-y-8 max-w-5xl mx-auto">
            {/* Hero Section */}
            <div className="space-y-4 pt-8">
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter font-display">
                    QUANTUM FAIR <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">PLINKO</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
                    Entropy powered by real quantum fluctuations
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
                                    onChange={(e) => setWager(parseInt(e.target.value) || 0)}
                                    className="w-full bg-black/50 border border-white/20 rounded-md px-4 py-3 text-white font-mono text-xl focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                <button onClick={() => setWager(Math.max(minBet, Math.floor(wager / 2)))} className="bg-white/10 hover:bg-white/20 px-4 rounded-md font-bold transition-colors">/2</button>
                                <button onClick={() => setWager(wager * 2)} className="bg-white/10 hover:bg-white/20 px-4 rounded-md font-bold transition-colors">x2</button>
                            </div>
                            {wager < minBet && (
                                <p className="text-red-400 text-[10px] uppercase font-bold mt-1">Minimum bet is {minBet} sats ({runsCount} run{runsCount > 1 ? 's' : ''} × 5 sats).</p>
                            )}
                        </div>

                        {/* Runs Selector */}
                        <div className="space-y-2 text-left">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Runs</label>
                            <div className="flex bg-black/50 p-1 rounded-lg border border-white/10">
                                {ALLOWED_RUNS.map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setRunsCount(r)}
                                        className={cn(
                                            "flex-1 py-2 text-sm font-bold rounded-md transition-all font-mono",
                                            runsCount === r 
                                                ? "bg-primary text-black shadow-lg shadow-primary/20" 
                                                : "text-gray-400 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        {r}×
                                    </button>
                                ))}
                            </div>
                            {/* Total bet display */}
                            {runsCount > 1 && (
                                <div className="flex items-center justify-between text-xs font-mono mt-1 px-1">
                                    <span className="text-gray-500">Total Invoice</span>
                                    <span className="text-primary font-bold">
                                        {wager.toLocaleString()} sats
                                        <span className="text-gray-500 font-normal ml-1">
                                            ({runsCount} × {wagerPerRun.toLocaleString()})
                                        </span>
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Rows Selector */}
                        <div className="space-y-2 text-left">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rows</label>
                            <div className="flex bg-black/50 p-1 rounded-lg border border-white/10">
                                {ALLOWED_ROWS.map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setRows(r)}
                                        disabled={isDropping}
                                        className={cn(
                                            "flex-1 py-2 text-sm font-bold rounded-md transition-all font-mono",
                                            rows === r 
                                                ? "bg-primary text-black shadow-lg shadow-primary/20" 
                                                : "text-gray-400 hover:text-white hover:bg-white/5",
                                            isDropping && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        {r}
                                    </button>
                                ))}
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
                                        disabled={isDropping}
                                        className={cn(
                                            "flex-1 py-2 text-sm font-bold uppercase rounded-md transition-all",
                                            risk === r ? "bg-primary text-black shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5",
                                            isDropping && "opacity-50 cursor-not-allowed"
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
                            disabled={loading || wager < minBet || isMaintenance || isDropping}
                            className={cn(
                                "w-full py-5 rounded-xl font-bold text-2xl uppercase tracking-widest transition-all font-display mt-auto",
                                loading || wager < minBet || isMaintenance || isDropping
                                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                                    : "bg-primary text-black hover:bg-primary/90 shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] active:scale-95"
                            )}
                        >
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : runsCount > 1 ? `DROP ${runsCount}×` : "DROP"}
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
                                        {runsCount > 1 && (
                                            <span className="text-gray-500 text-sm font-normal block mt-1">
                                                {runsCount} runs × {Math.floor(currentBet.amountSat / runsCount)} sats each
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500 animate-pulse">
                                        <Loader2 className="animate-spin" size={16} /> Waiting for payment...
                                    </div>
                                </div>
                            </div>
                        )}

                        <PlinkoBoard 
                            isDropping={isDropping} 
                            balls={ballsData}
                            risk={risk}
                            wager={wager}
                            runsCount={runsCount}
                            rows={rows}
                            onDropFinish={handleDropFinish}
                        />
                    </div>
                </div>

                {/* Result Overlay */}
                {showResultOverlay && betStatus && (
                    <div className="mt-8 p-6 rounded-xl border text-center animate-in fade-in zoom-in duration-300 bg-black/40 border-white/10 overflow-hidden relative">
                        <div className={cn(
                            "absolute top-0 left-0 w-full h-1",
                            summaryStats.netPnl > 0 ? "bg-green-500" : "bg-red-500"
                        )} />

                        {/* Multi-run Summary */}
                        {runsCount > 1 && betStatus.runResults && betStatus.runResults.length > 1 ? (
                            <div className="flex flex-wrap justify-center gap-12 mb-6">
                                <div>
                                    <span className="text-gray-500 block text-xs uppercase">Avg. Multiplier</span>
                                    <span className="font-mono text-3xl text-white">x{summaryStats.avgMultiplier.toFixed(2)}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block text-xs uppercase">Total Prize</span>
                                    <span className={cn("font-mono text-3xl", (betStatus.payoutSat ?? 0) > wager ? "text-green-400" : "text-gray-300")}>
                                        {betStatus.payoutSat} sats
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block text-xs uppercase">Runs</span>
                                    <span className="font-mono text-3xl text-white">{summaryStats.totalRuns}×</span>
                                </div>
                            </div>
                        ) : (
                            /* Single-run result (original layout) */
                            <div className="flex flex-wrap justify-center gap-12 mb-6">
                                <div>
                                    <span className="text-gray-500 block text-xs uppercase">Multiplier</span>
                                    <span className="font-mono text-3xl text-white">x{betStatus.outcome !== undefined ? (MULTIPLIERS as any)[rows][risk][betStatus.outcome].toFixed(2) : "0.00"}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block text-xs uppercase">Prize</span>
                                    <span className={cn("font-mono text-3xl", betStatus.payoutSat && betStatus.payoutSat > wager ? "text-green-400" : "text-gray-300")}>
                                        {betStatus.payoutSat} sats
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Withdrawal QR or Claimed State if Won */}
                        {betStatus.status === 'WON' && (
                            <div className="bg-white/5 p-6 rounded-xl border border-green-500/30 inline-block w-full max-w-md mt-4">
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

// ---- Helper Functions ----

/** Compute path from seeds (with nonce for multi-run) */
async function computePathFromSeeds(
    serverSeed?: string,
    clientSeed?: string,
    drandRandomness?: string,
    runIndex: number = 0,
    totalRuns: number = 1,
    rows: number = 16
): Promise<number[] | null> {
    if (!serverSeed || !clientSeed || !drandRandomness) return null;

    // For single-run (backward compat): no nonce appended
    // For multi-run: append nonce index
    const combinedString = totalRuns === 1
        ? `${serverSeed}${clientSeed}${drandRandomness}`
        : `${serverSeed}${clientSeed}${drandRandomness}${runIndex}`;

    const msgBuffer = new TextEncoder().encode(combinedString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const path: number[] = [];
    for (let i = 0; i < rows; i++) {
        path.push(parseInt(hash.charAt(i), 16) % 2);
    }
    return path;
}

/** Generate a fallback visual path targeting the given slot */
function generateFallbackPath(targetSlot: number, rows: number = 16): number[] {
    const moves = Array(rows).fill(0);
    for (let i = 0; i < targetSlot; i++) moves[i] = 1;
    // Shuffle
    for (let i = moves.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [moves[i], moves[j]] = [moves[j], moves[i]];
    }
    return moves;
}

/** Compute summary statistics for multi-run overlay */
function computeSummary(
    betStatus: BetStatusResponse | null,
    wager: number,
    risk: string,
    runsCount: number,
    rows: number
): { totalRuns: number; wins: number; losses: number; netPnl: number; bestMultiplier: number; avgMultiplier: number } {
    if (!betStatus || !betStatus.runResults || betStatus.runResults.length === 0) {
        // Single-run fallback
        const payout = betStatus?.payoutSat ?? 0;
        const isWin = payout > wager;
        const mult = betStatus?.outcome !== undefined 
            ? (MULTIPLIERS as any)[rows]?.[risk]?.[betStatus.outcome] ?? 0 
            : 0;
        return {
            totalRuns: 1,
            wins: isWin ? 1 : 0,
            losses: isWin ? 0 : 1,
            netPnl: payout - wager,
            bestMultiplier: mult,
            avgMultiplier: mult,
        };
    }

    const perRunWager = Math.floor(wager / runsCount);
    let wins = 0;
    let losses = 0;
    let bestMultiplier = 0;
    let totalPayout = 0;
    let totalMultiplier = 0;

    for (const run of betStatus.runResults) {
        const mult = run.multiplier ?? (perRunWager > 0 ? run.payout_sat / perRunWager : 0);
        if (run.payout_sat > perRunWager) wins++;
        else losses++;
        if (mult > bestMultiplier) bestMultiplier = mult;
        totalPayout += run.payout_sat;
        totalMultiplier += mult;
    }

    const avgMultiplier = betStatus.runResults.length > 0 ? totalMultiplier / betStatus.runResults.length : 0;

    return {
        totalRuns: betStatus.runResults.length,
        wins,
        losses,
        netPnl: totalPayout - wager,
        bestMultiplier,
        avgMultiplier,
    };
}

