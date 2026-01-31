
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

export function SpinWheel({ targetNumber, isSpinning, onFinish }: SpinWheelProps) {
    const [rotation, setRotation] = useState(0);
    const wheelRef = useRef<HTMLDivElement>(null);
    const hasSpun = useRef(false);

    useEffect(() => {
        if (targetNumber !== null && isSpinning && !hasSpun.current) {
            hasSpun.current = true;

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
        }
    }, [targetNumber, isSpinning, onFinish]);

    return (
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto overflow-hidden rounded-full border-4 border-yellow-600/50 shadow-[0_0_50px_rgba(255,215,0,0.1)] bg-black">

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

            {/* Center Cap */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)] z-10 flex items-center justify-center text-black font-bold border border-yellow-200">
                Q
            </div>
        </div>
    );
}
