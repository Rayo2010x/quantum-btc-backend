import { useEffect, useState, useRef } from 'react';
import { cn } from './BetControls';

interface SpinWheelProps {
    outcome?: number;
    runResults: { outcome: number }[];
    isSpinning: boolean;
    onFinish?: () => void;
}

// European Roulette Numbers in clockwise order (standard)
const WHEEL_NUMBERS = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const QUANTUM_STYLES = `
@keyframes quantum-jitter {
  0% { transform: translate(-50%, -50%) translate(0, 0); filter: drop-shadow(0 0 15px #00f0ff); }
  25% { transform: translate(-50%, -50%) translate(-2px, 2px); filter: drop-shadow(0 0 25px #00f0ff); }
  50% { transform: translate(-50%, -50%) translate(2px, -2px); filter: drop-shadow(0 0 20px #00f0ff); }
  75% { transform: translate(-50%, -50%) translate(-2px, -2px); filter: drop-shadow(0 0 30px #00f0ff); }
  100% { transform: translate(-50%, -50%) translate(2px, 2px); filter: drop-shadow(0 0 15px #00f0ff); }
}
@keyframes ghost-1 {
  0%, 100% { transform: translate(-50%, -50%) translate(-6px, 0); opacity: 0.3; }
  50% { transform: translate(-50%, -50%) translate(4px, 6px); opacity: 0.7; }
}
@keyframes ghost-2 {
  0%, 100% { transform: translate(-50%, -50%) translate(6px, -4px); opacity: 0.7; }
  50% { transform: translate(-50%, -50%) translate(-4px, -2px); opacity: 0.3; }
}
.animate-quantum-jitter { animation: quantum-jitter 0.1s infinite; }
.animate-ghost-1 { animation: ghost-1 0.15s infinite alternate; }
.animate-ghost-2 { animation: ghost-2 0.12s infinite alternate; }
`;

type AnimationPhase = 'idle' | 'quantum' | 'spinning' | 'settled';

export function SpinWheel({ runResults, isSpinning, onFinish }: SpinWheelProps) {
    const [phase, setPhase] = useState<AnimationPhase>('idle');
    const [spins, setSpins] = useState<number[]>([]);
    const hasSpun = useRef(false);

    // Calculate outcome counts for badge aggregation
    const outcomeCounts = runResults.reduce((acc, r) => {
        acc[r.outcome] = (acc[r.outcome] || 0) + 1;
        return acc;
    }, {} as Record<number, number>);

    useEffect(() => {
        if (isSpinning && !hasSpun.current && runResults.length > 0) {
            hasSpun.current = true;
            
            // Randomize spins for each ball so they don't move exactly together
            const newSpins = runResults.map(() => 360 * (3 + Math.floor(Math.random() * 3)));
            setSpins(newSpins);

            setPhase('quantum');

            const timeouts = [
                setTimeout(() => setPhase('spinning'), 1500),
                setTimeout(() => setPhase('settled'), 4500),
                setTimeout(() => {
                    onFinish?.();
                    hasSpun.current = false;
                }, 5000) // Small delay after settling before overlay shows
            ];

            return () => timeouts.forEach(clearTimeout);
        }
    }, [isSpinning, runResults, onFinish]);

    // Reset when not spinning
    useEffect(() => {
        if (!isSpinning && phase === 'settled') {
            setPhase('idle');
            setSpins([]);
        }
    }, [isSpinning, phase]);

    return (
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto overflow-hidden rounded-full border-4 border-yellow-600/50 shadow-[0_0_50px_rgba(255,215,0,0.1)] bg-black">
            <style>{QUANTUM_STYLES}</style>

            {/* Static Wheel */}
            <div className="w-full h-full relative">
                {/* Render Numbers */}
                {WHEEL_NUMBERS.map((num, i) => {
                    const angle = (i * 360) / 37;
                    let color = "bg-black text-white";
                    if (num !== 0) {
                        const isRed = (num <= 10 || (num >= 19 && num <= 28)) ? (num % 2 !== 0) : (num % 2 === 0);
                        color = isRed ? "bg-red-600 text-white" : "bg-black text-white";
                    } else {
                        color = "bg-green-600 text-white";
                    }

                    return (
                        <div
                            key={num}
                            className={cn(
                                "absolute top-0 left-1/2 -ml-[1px] w-[2px] h-1/2 origin-bottom flex justify-center pt-2",
                            )}
                            style={{ transform: `rotate(${angle}deg)` }}
                        >
                            <div className={cn("w-6 h-8 flex items-center justify-center text-[10px] font-bold rounded-sm shadow-sm", color)}>
                                <span style={{ transform: 'rotate(180deg)' }}>{num}</span>
                            </div>
                        </div>
                    );
                })}

                {/* Multiple Balls */}
                {phase !== 'idle' && runResults.map((run, i) => {
                    const targetIndex = WHEEL_NUMBERS.indexOf(run.outcome);
                    const baseAngle = targetIndex * (360 / 37);
                    const finalRotation = baseAngle + (spins[i] || 0);
                    const isQuantum = phase === 'quantum';
                    const isSpinning = phase === 'spinning';
                    const isSettled = phase === 'settled';
                    const currentRotation = isQuantum ? baseAngle : finalRotation;
                    
                    const isFirstOfOutcome = runResults.findIndex(r => r.outcome === run.outcome) === i;
                    const count = outcomeCounts[run.outcome];

                    return (
                        <div
                            key={i}
                            className="absolute inset-0 transition-transform ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                            style={{ 
                                transform: `rotate(${currentRotation}deg)`,
                                transitionDuration: isSettled ? '0ms' : (isSpinning ? '3000ms' : '0ms'),
                                opacity: isSettled && !isFirstOfOutcome ? 0 : 1
                            }}
                        >
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-1/2 origin-bottom flex justify-center">
                                {isSettled && isFirstOfOutcome && count > 1 ? (
                                    <div 
                                        className="absolute w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-[10px] font-bold text-black border border-white shadow-[0_0_10px_rgba(251,191,36,0.8)] animate-in zoom-in"
                                        style={{ top: '32px', transform: 'rotate(180deg)' }}
                                    >
                                        x{count}
                                    </div>
                                ) : (
                                    <div 
                                        className="absolute w-3 h-3 bg-white rounded-full shadow-[0_0_10px_#fff] transition-all duration-500"
                                        style={{ 
                                            top: isSettled ? '36px' : (isQuantum ? '120px' : '4px'),
                                            opacity: isQuantum ? 0 : 1,
                                            transform: isQuantum ? 'scale(0.1)' : 'scale(1)'
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Center Cap with Quantum Effect */}
            {(phase === 'quantum' || phase === 'spinning') && (
                <>
                    <div className="absolute top-1/2 left-1/2 w-12 h-12 rounded-full bg-[#00f0ff]/40 mix-blend-screen z-[9] animate-ghost-1" />
                    <div className="absolute top-1/2 left-1/2 w-12 h-12 rounded-full bg-[#00f0ff]/40 mix-blend-screen z-[9] animate-ghost-2" />
                </>
            )}
            <div className={cn(
                "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full z-10 flex items-center justify-center font-display font-bold text-black shadow-xl border-2",
                phase === 'quantum' 
                    ? "bg-primary border-white animate-quantum-jitter" 
                    : "bg-yellow-500 border-yellow-300"
            )}>
                Q
            </div>
        </div>
    );
}
