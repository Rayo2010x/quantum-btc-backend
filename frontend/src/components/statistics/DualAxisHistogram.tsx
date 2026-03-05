import React from 'react';

export interface HistogramDataPoint {
    label: string;
    value: number;
    colorClass?: string; // e.g., 'bg-red-500', 'bg-black'
}

interface DualAxisHistogramProps {
    title: string;
    data: HistogramDataPoint[];
    total: number;
}

export function formatCompactNumber(number: number): string {
    return new Intl.NumberFormat('en-US', {
        notation: "compact",
        compactDisplay: "short",
        maximumFractionDigits: 1
    }).format(number);
}

export function DualAxisHistogram({ title, data, total }: DualAxisHistogramProps) {
    // Find max value to determine the scale (Y maximum)
    const maxValue = data.length > 0 ? Math.max(...data.map(d => d.value)) : 0;

    // Y-Axis labels (3 points: Max, Half, Zero)
    const yAxisCountLabels = [maxValue, Math.round(maxValue / 2), 0];
    const maxPerc = total > 0 ? (maxValue / total) * 100 : 0;
    const yAxisPercLabels = [maxPerc, maxPerc / 2, 0];

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 backdrop-blur-md shadow-2xl flex flex-col w-full overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl md:text-2xl font-bold tracking-tight text-gray-200 uppercase font-display">
                    {title}
                </h3>
            </div>

            {/* Chart Area */}
            <div className="relative h-64 w-full flex items-end">
                {/* Left Y-Axis (Quantity) */}
                <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-500 font-mono pr-2 -ml-2 text-right w-12 border-r border-white/10 z-10">
                    {yAxisCountLabels.map((val, i) => (
                        <span key={`left-${i}`} className={i === 2 ? 'relative top-2' : ''}>
                            {formatCompactNumber(val)}
                        </span>
                    ))}
                </div>

                {/* Right Y-Axis (Percentage) */}
                <div className="absolute right-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-500 font-mono pl-2 -mr-2 text-left w-12 border-l border-white/10 z-10">
                    {yAxisPercLabels.map((val, i) => (
                        <span key={`right-${i}`} className={i === 2 ? 'relative top-2' : ''}>
                            {val.toFixed(1)}%
                        </span>
                    ))}
                </div>

                {/* Grid Lines */}
                <div className="absolute left-10 right-10 top-0 bottom-8 flex flex-col justify-between pointer-events-none">
                    <div className="w-full border-t border-white/5 border-dashed"></div>
                    <div className="w-full border-t border-white/5 border-dashed"></div>
                    <div className="w-full border-b border-white/20"></div>
                </div>

                {/* Bars Container */}
                <div className="absolute left-12 right-12 top-0 bottom-0 flex items-end justify-between px-2 overflow-x-auto gap-1 pb-8 hide-scrollbar">
                    {data.map((point, idx) => {
                        const heightPerc = maxValue > 0 ? (point.value / maxValue) * 100 : 0;
                        const defaultColor = 'bg-primary/80';
                        const barColor = point.colorClass || defaultColor;
                        const percentageOfTotal = total > 0 ? ((point.value / total) * 100).toFixed(1) : '0.0';

                        return (
                            <div key={idx} className="flex flex-col items-center justify-end h-full flex-1 group" style={{ minWidth: data.length > 20 ? '20px' : '40px' }}>
                                {/* Tooltip on Hover */}
                                <div className="opacity-0 group-hover:opacity-100 absolute -top-10 bg-black/90 border border-white/10 text-white text-xs px-2 py-1 rounded transition-opacity whitespace-nowrap z-20 pointer-events-none">
                                    <span className="font-bold">{point.label}</span>: {formatCompactNumber(point.value)} ({percentageOfTotal}%)
                                </div>

                                {/* Bar */}
                                <div
                                    className={`w-full rounded-t-sm transition-all duration-700 ease-out hover:brightness-125 hover:shadow-[0_0_10px_rgba(255,255,255,0.3)] ${barColor}`}
                                    style={{ height: `${heightPerc}%` }}
                                ></div>

                                {/* X-Axis Label */}
                                <span className="absolute bottom-1 text-[10px] md:text-xs text-gray-400 font-mono font-bold mt-2 truncate w-full text-center group-hover:text-white transition-colors">
                                    {point.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
            {/* Custom scrollbar hiding in global CSS might be needed for .hide-scrollbar if overflown */}
            <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
        </div>
    );
}
