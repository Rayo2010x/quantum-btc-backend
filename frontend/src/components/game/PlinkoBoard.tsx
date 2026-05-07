import { useEffect, useRef, useState } from 'react';

export const MULTIPLIERS = {
    low: [16, 9, 2, 1.5, 1.2, 1.0, 1.0, 0.9, 0.95, 0.9, 1.0, 1.0, 1.2, 1.5, 2, 9, 16],
    medium: [110, 41, 10, 5, 3, 1.4, 1, 0.5, 0.3, 0.5, 1, 1.4, 3, 5, 10, 41, 110],
    high: [1000, 130, 26, 9, 4, 1.9, 0.2, 0.2, 0.2, 0.2, 0.2, 1.9, 4, 9, 26, 130, 1000]
};

interface PlinkoBoardProps {
    isDropping: boolean;
    targetSlot: number | null;
    risk: 'low' | 'medium' | 'high';
    onDropFinish: () => void;
}

export function PlinkoBoard({ isDropping, targetSlot, risk, onDropFinish }: PlinkoBoardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [path, setPath] = useState<number[]>([]);
    const [dropState, setDropState] = useState<'idle' | 'quantum' | 'falling'>('idle');
    const quantumTimerRef = useRef<number | null>(null);
    
    // Generate a physics path when drop starts
    useEffect(() => {
        if (isDropping && targetSlot !== null) {
            setDropState('quantum');

            // targetSlot is 0-16. This means we need exactly `targetSlot` Right moves out of 16.
            const moves = Array(16).fill(0); // 0 = Left, 1 = Right
            for (let i = 0; i < targetSlot; i++) moves[i] = 1;
            
            // Shuffle
            for (let i = moves.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [moves[i], moves[j]] = [moves[j], moves[i]];
            }
            setPath(moves);

            // Wait 1.5s in quantum superposition before collapsing into a path
            if (quantumTimerRef.current) clearTimeout(quantumTimerRef.current);
            quantumTimerRef.current = setTimeout(() => {
                setDropState('falling');
            }, 1500);
        } else {
            setDropState('idle');
            if (quantumTimerRef.current) clearTimeout(quantumTimerRef.current);
        }
    }, [isDropping, targetSlot]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const rows = 16;
        const pegRadius = 4;
        const ballRadius = 8;
        
        const rowHeight = (height - 60) / rows;
        const colWidth = width / (rows + 2);

        let animationFrameId: number;
        
        let ballX = width / 2;
        let ballY = 20;
        let currentRow = 0;
        let progress = 0; // 0 to 1 between rows
        
        const render = () => {
            ctx.clearRect(0, 0, width, height);
            
            // Draw Pegs
            ctx.fillStyle = '#4b5563';
            for (let r = 1; r <= rows; r++) {
                const cols = r;
                const startX = (width - (cols - 1) * colWidth) / 2;
                for (let c = 0; c < cols; c++) {
                    ctx.beginPath();
                    ctx.arc(startX + c * colWidth, r * rowHeight, pegRadius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Draw Multipliers at bottom
            const multipliers = MULTIPLIERS[risk];
            const startX = (width - (17 - 1) * colWidth) / 2;
            
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            for (let i = 0; i < 17; i++) {
                const mx = startX + i * colWidth;
                const my = height - 20;
                
                // Highlight active slot
                const isActive = !isDropping && targetSlot === i;
                
                ctx.fillStyle = isActive ? '#00f0ff' : '#1f2937';
                ctx.beginPath();
                ctx.roundRect(mx - colWidth/2 + 2, my - 15, colWidth - 4, 30, 4);
                ctx.fill();
                
                ctx.fillStyle = isActive ? '#000' : getMultiplierColor(multipliers[i]);
                ctx.fillText(`${multipliers[i]}x`, mx, my);
            }

            // Draw Ball based on state
            if (dropState === 'idle') {
                // Static ball waiting at the top
                ctx.fillStyle = '#00f0ff';
                ctx.shadowColor = '#00f0ff';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(width / 2, 20, ballRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            } else if (dropState === 'quantum') {
                // Quantum superposition effect (vibrating/glitching)
                
                // Draw multiple ghost balls
                for(let i = 0; i < 5; i++) {
                    const offsetX = (Math.random() - 0.5) * 12;
                    const offsetY = (Math.random() - 0.5) * 12;
                    
                    ctx.fillStyle = `rgba(0, 240, 255, ${Math.random() * 0.4 + 0.1})`;
                    ctx.beginPath();
                    ctx.arc(width / 2 + offsetX, 20 + offsetY, ballRadius, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Core ball with pulsating glow
                ctx.fillStyle = '#00f0ff';
                ctx.shadowColor = '#00f0ff';
                ctx.shadowBlur = 15 + Math.random() * 15;
                ctx.beginPath();
                ctx.arc(width / 2, 20, ballRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            } else if (dropState === 'falling' && path.length > 0) {
                // Animate ball
                if (currentRow < 16) {
                    progress += 0.08; // speed
                    if (progress >= 1) {
                        progress = 0;
                        currentRow++;
                    }
                    
                    if (currentRow < 16) {
                        // Interpolate position
                        const move = path[currentRow]; // 0 or 1
                        
                        // Calculate start X/Y for this row
                        let startCols = currentRow + 1;
                        let startXRow = (width - (startCols - 1) * colWidth) / 2;
                        
                        // Count previous rights to know current column index
                        let currentC = 0;
                        for(let i=0; i<currentRow; i++) currentC += path[i];
                        
                        let startXPos = startXRow + currentC * colWidth;
                        let startYPos = (currentRow + 1) * rowHeight;
                        
                        // Calculate end X/Y for next row
                        let nextCols = currentRow + 2;
                        let nextStartXRow = (width - (nextCols - 1) * colWidth) / 2;
                        let nextC = currentC + move;
                        
                        let nextXPos = nextStartXRow + nextC * colWidth;
                        let nextYPos = (currentRow + 2) * rowHeight;
                        
                        // Simple bounce interpolation
                        const bounce = Math.sin(progress * Math.PI) * 15;
                        
                        ballX = startXPos + (nextXPos - startXPos) * progress;
                        ballY = startYPos + (nextYPos - startYPos) * progress - bounce;
                    } else {
                        // Reached bottom
                        onDropFinish();
                    }
                }
                
                ctx.fillStyle = '#00f0ff';
                ctx.shadowColor = '#00f0ff';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            // Continue animation loop if not idle
            if (dropState !== 'idle') {
                animationFrameId = requestAnimationFrame(render);
            }
        };

        render();

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [dropState, path, risk, targetSlot]);

    return (
        <div className="w-full flex justify-center py-8">
            <canvas 
                ref={canvasRef} 
                width={800} 
                height={600} 
                className="max-w-full h-auto bg-black/20 rounded-xl border border-white/5 shadow-2xl"
            />
        </div>
    );
}

function getMultiplierColor(val: number) {
    if (val <= 1) return '#9ca3af'; // gray-400
    if (val <= 3) return '#4ade80'; // green-400
    if (val <= 10) return '#fbbf24'; // amber-400
    if (val <= 50) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
}
