import { useEffect, useState, useMemo } from 'react';
import { GameApi } from '../../lib/api';
import type { StatisticsResponse } from '../../lib/api';
import { DualAxisHistogram, formatCompactNumber } from './DualAxisHistogram';

const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

function getNumberColorClass(n: number) {
    if (n === 0) return 'bg-green-500';
    return RED_NUMBERS.has(n) ? 'bg-red-600' : 'bg-slate-800';
}

export interface HistogramDataPoint {
    label: string;
    value: number;
    colorClass?: string;
}

export function StatisticsView() {
    const [stats, setStats] = useState<StatisticsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLimit, setSelectedLimit] = useState<string>("200");

    useEffect(() => {
        setIsLoading(true);
        GameApi.getStatistics(selectedLimit)
            .then(data => {
                setStats(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError("Failed to load statistics");
                setIsLoading(false);
            });
    }, [selectedLimit]);

    const numbersData: HistogramDataPoint[] = useMemo(() => {
        if (!stats?.frequencies) return [];
        return Object.entries(stats.frequencies).map(([numStr, count]) => {
            const n = parseInt(numStr, 10);
            return {
                label: numStr,
                value: count,
                colorClass: getNumberColorClass(n)
            };
        });
    }, [stats]);

    const rowsData: HistogramDataPoint[] = useMemo(() => {
        if (!stats?.frequencies) return [];
        let r1 = 0, r2 = 0, r3 = 0;
        Object.entries(stats.frequencies).forEach(([numStr, count]) => {
            const n = parseInt(numStr, 10);
            if (n === 0) return;
            if (n % 3 === 0) r1 += count;
            else if (n % 3 === 2) r2 += count;
            else if (n % 3 === 1) r3 += count;
        });
        return [
            { label: 'Row 1 (1,4,7...)', value: r3, colorClass: 'bg-primary/80' },
            { label: 'Row 2 (2,5,8...)', value: r2, colorClass: 'bg-primary/80' },
            { label: 'Row 3 (3,6,9...)', value: r1, colorClass: 'bg-primary/80' }
        ];
    }, [stats]);

    const dozensData: HistogramDataPoint[] = useMemo(() => {
        if (!stats?.frequencies) return [];
        let d1 = 0, d2 = 0, d3 = 0;
        Object.entries(stats.frequencies).forEach(([numStr, count]) => {
            const n = parseInt(numStr, 10);
            if (n === 0) return;
            if (n >= 1 && n <= 12) d1 += count;
            else if (n >= 13 && n <= 24) d2 += count;
            else if (n >= 25 && n <= 36) d3 += count;
        });
        return [
            { label: '1st 12', value: d1, colorClass: 'bg-blue-500/80' },
            { label: '2nd 12', value: d2, colorClass: 'bg-blue-500/80' },
            { label: '3rd 12', value: d3, colorClass: 'bg-blue-500/80' }
        ];
    }, [stats]);

    const halvesData: HistogramDataPoint[] = useMemo(() => {
        if (!stats?.frequencies) return [];
        let h1 = 0, h2 = 0;
        Object.entries(stats.frequencies).forEach(([numStr, count]) => {
            const n = parseInt(numStr, 10);
            if (n === 0) return;
            if (n >= 1 && n <= 18) h1 += count;
            else if (n >= 19 && n <= 36) h2 += count;
        });
        return [
            { label: '1-18', value: h1, colorClass: 'bg-purple-500/80' },
            { label: '19-36', value: h2, colorClass: 'bg-purple-500/80' }
        ];
    }, [stats]);

    const colorsData: HistogramDataPoint[] = useMemo(() => {
        if (!stats?.frequencies) return [];
        let red = 0, black = 0;
        Object.entries(stats.frequencies).forEach(([numStr, count]) => {
            const n = parseInt(numStr, 10);
            if (n === 0) return;
            if (RED_NUMBERS.has(n)) red += count;
            else black += count;
        });
        return [
            { label: 'Red', value: red, colorClass: 'bg-red-600' },
            { label: 'Black', value: black, colorClass: 'bg-slate-800' }
        ];
    }, [stats]);

    const parityData: HistogramDataPoint[] = useMemo(() => {
        if (!stats?.frequencies) return [];
        let odd = 0, even = 0;
        Object.entries(stats.frequencies).forEach(([numStr, count]) => {
            const n = parseInt(numStr, 10);
            if (n === 0) return;
            if (n % 2 !== 0) odd += count;
            else even += count;
        });
        return [
            { label: 'ODD', value: odd, colorClass: 'bg-amber-500/80' },
            { label: 'EVEN', value: even, colorClass: 'bg-amber-500/80' }
        ];
    }, [stats]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="text-center text-red-500 mt-10">
                <p>{error || "Failed to load data"}</p>
            </div>
        );
    }

    const totalBets = stats.totalBets;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter font-display uppercase">
                    GLOBAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">STATISTICS</span>
                </h1>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    A transparent record of every rolled outcome
                </p>
            </div>

            <div className="bg-gradient-to-r from-primary/20 via-black to-secondary/20 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-md shadow-2xl">
                <h2 className="text-sm font-mono text-primary tracking-widest uppercase mb-2">
                    {selectedLimit === 'All' ? 'Total Bets Played' : `Last ${selectedLimit} Bets`}
                </h2>
                <div className="text-6xl md:text-8xl font-black tracking-tighter text-white font-display drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                    {formatCompactNumber(totalBets)}
                </div>
            </div>

            <div className="flex justify-center -mt-6 relative z-10">
                <div className="flex items-center space-x-3 bg-black/60 p-2 rounded-xl border border-white/10 backdrop-blur-md shadow-lg">
                    <span className="text-xs font-mono text-gray-400 uppercase tracking-widest ml-2">Show:</span>
                    <select
                        value={selectedLimit}
                        onChange={(e) => setSelectedLimit(e.target.value)}
                        className="bg-slate-900 text-white border border-white/10 rounded-lg px-6 py-2 appearance-none cursor-pointer focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm font-bold font-sans tracking-wide text-center"
                    >
                        <option value="200">Last 200</option>
                        <option value="500">Last 500</option>
                        <option value="1000">Last 1,000</option>
                        <option value="5000">Last 5,000</option>
                        <option value="All">All Bets</option>
                    </select>
                    {/* Minimal custom dropdown arrow */}
                    <div className="pointer-events-none absolute right-4 flex items-center text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
            </div>

            <DualAxisHistogram
                title="1. Frequency by Number (0-36)"
                data={numbersData}
                total={totalBets}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <DualAxisHistogram
                    title="2. Frequency by Row"
                    data={rowsData}
                    total={totalBets}
                />
                <DualAxisHistogram
                    title="3. Frequency by Dozen"
                    data={dozensData}
                    total={totalBets}
                />
                <DualAxisHistogram
                    title="4. Frequency by Half"
                    data={halvesData}
                    total={totalBets}
                />
                <DualAxisHistogram
                    title="5. Frequency by Color"
                    data={colorsData}
                    total={totalBets}
                />
                <DualAxisHistogram
                    title="6. Parity (Odd/Even)"
                    data={parityData}
                    total={totalBets}
                />
            </div>
        </div>
    );
}
