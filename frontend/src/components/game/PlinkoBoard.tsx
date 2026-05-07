import { useEffect, useRef, useState } from 'react';

export const MULTIPLIERS = {
    low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
    high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
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
    
    // Generate a physics path when drop starts
    useEffect(() => {
        if (isDropping && targetSlot !== null) {
            // targetSlot is 0-16. This means we need exactly `targetSlot` Right moves out of 16.
            const moves = Array(16).fill(0); // 0 = Left, 1 = Right
            for (let i = 0; i < targetSlot; i++) moves[i] = 1;
            
            // Shuffle
            for (let i = moves.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [moves[i], moves[j]] = [moves[j], moves[i]];
            }
            setPath(moves);
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
            for (let r = 2; r <= rows; r++) {
                const cols = r + 1;
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

            // Draw Ball if dropping
            if (isDropping && path.length > 0) {
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
                        let currentCols = currentRow + 2;
                        let startXRow = (width - (currentCols - 1) * colWidth) / 2;
                        
                        // Count previous rights to know current column index
                        let currentC = 0;
                        for(let i=0; i<currentRow; i++) currentC += path[i];
                        
                        let startXPos = startXRow + currentC * colWidth;
                        let startYPos = (currentRow + 1) * rowHeight;
                        
                        // Calculate end X/Y for next row
                        let nextCols = currentRow + 3;
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

            if (isDropping) {
                animationFrameId = requestAnimationFrame(render);
            }
        };

        render();

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [isDropping, path, risk, targetSlot]);

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
