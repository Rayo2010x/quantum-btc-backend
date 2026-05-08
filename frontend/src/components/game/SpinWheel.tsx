
import { useEffect, useState, useRef } from 'react';
import { cn } from './BetControls';

interface SpinWheelProps {
    targetNumber: number | null;
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

export function SpinWheel({ targetNumber, isSpinning, onFinish }: SpinWheelProps) {
    const [rotation, setRotation] = useState(0);
    const [quantumEffect, setQuantumEffect] = useState(false);
    const wheelRef = useRef<HTMLDivElement>(null);
    const hasSpun = useRef(false);

    useEffect(() => {
        if (targetNumber !== null && isSpinning && !hasSpun.current) {
            hasSpun.current = true;

            // Start quantum effect
            setQuantumEffect(true);

            // Wait 1.5s then spin
            setTimeout(() => {
                setQuantumEffect(false);

                // 1. Calculate the rotation to land on the target number
                // Each number is 360 / 37 degrees
                const degreesPerSegment = 360 / 37;
                const targetIndex = WHEEL_NUMBERS.indexOf(targetNumber);
                const targetDegrees = targetIndex * degreesPerSegment;

                // 2. Add extra spins for effect (e.g., 5 full rotations)
                const extraSpins = 360 * 5;

                // 3. The wheel spins clockwise, so we need to rotate counter-clockwise to bring the number to the top (0 degrees)
                // Or if we rotate the inner wheel, we rotate it negative.
                // Let's assume standard CSS rotation. 0 is top.
                // If 0 is at index 0, to keep 0 at top, rot is 0.
                // If we want index 1 (32) at top, we rotate -degreesPerSegment.
                const finalRotation = -(extraSpins + targetDegrees);

                setRotation(finalRotation);

                // Trigger callback after animation
                setTimeout(() => {
                    onFinish?.();
                    hasSpun.current = false; // Reset for next time if component reused
                }, 4000); // 4s animation
            }, 1500); // 1.5s quantum superposition delay
        }
    }, [targetNumber, isSpinning, onFinish]);

    return (
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto overflow-hidden rounded-full border-4 border-yellow-600/50 shadow-[0_0_50px_rgba(255,215,0,0.1)] bg-black">
            <style>{QUANTUM_STYLES}</style>

            {/* The Rotating Wheel */}
            <div
                ref={wheelRef}
                className="w-full h-full relative transition-transform duration-[4000ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                style={{ transform: `rotate(${rotation}deg)` }}
            >
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
            </div>

            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-t-[20px] border-t-yellow-400 border-r-[10px] border-r-transparent z-10 drop-shadow-lg" />

            {/* Center Cap with Quantum Effect */}
            {quantumEffect && (
                <>
                    <div className="absolute top-1/2 left-1/2 w-12 h-12 rounded-full bg-[#00f0ff]/40 mix-blend-screen z-[9] animate-ghost-1" />
                    <div className="absolute top-1/2 left-1/2 w-12 h-12 rounded-full bg-[#00f0ff]/40 mix-blend-screen z-[9] animate-ghost-2" />
                </>
            )}
            <div className={cn(
                "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full z-10 flex items-center justify-center font-bold border transition-colors duration-100",
                quantumEffect 
                    ? "bg-[#00f0ff] border-white text-white animate-quantum-jitter shadow-[0_0_20px_rgba(0,240,255,1)]" 
                    : "bg-gradient-to-br from-yellow-500 to-yellow-700 border-yellow-200 text-black shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]"
            )}>
                Q
            </div>
        </div>
    );
}
