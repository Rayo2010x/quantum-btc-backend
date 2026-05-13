import { useEffect, useRef, useState, useCallback } from 'react';

export const MULTIPLIERS = {
    low: [16, 9, 2, 1.5, 1.2, 1.0, 1.0, 0.9, 0.95, 0.9, 1.0, 1.0, 1.2, 1.5, 2, 9, 16],
    medium: [110, 41, 10, 5, 3, 1.4, 1, 0.5, 0.3, 0.5, 1, 1.4, 3, 5, 10, 41, 110],
    high: [1000, 130, 26, 9, 4, 1.9, 0.2, 0.2, 0.2, 0.2, 0.2, 1.9, 4, 9, 26, 130, 1000]
};

export interface BallData {
    path: number[];
    slot: number;
}

interface PlinkoBoardProps {
    isDropping: boolean;
    balls: BallData[];
    risk: 'low' | 'medium' | 'high';
    wager: number;
    runsCount: number;
    onDropFinish: () => void;
}

// Color helpers
function getBallColor(index: number, total: number): string {
    if (total === 1) return '#00f0ff'; // Original cyan for single-ball
    const hue = 180 + index * 15;     // Spread from 180° (cyan) forward
    return `hsl(${hue}, 100%, 60%)`;
}

function getBallGlow(index: number, total: number): string {
    if (total === 1) return 'rgba(0, 240, 255, 0.6)';
    const hue = 180 + index * 15;
    return `hsl(${hue}, 100%, 60%)`;
}

function getMultiplierColor(val: number) {
    if (val <= 1) return '#9ca3af'; // gray-400
    if (val <= 3) return '#4ade80'; // green-400
    if (val <= 10) return '#fbbf24'; // amber-400
    if (val <= 50) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
}

interface BallAnimState {
    currentRow: number;
    progress: number;
    x: number;
    y: number;
    launched: boolean;
    landed: boolean;
}

const STAGGER_DELAY_MS = 250;
const BALL_SPEED = 0.08;
const ROWS = 16;

export function PlinkoBoard({ isDropping, balls, risk, wager, runsCount, onDropFinish }: PlinkoBoardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dropState, setDropState] = useState<'idle' | 'quantum' | 'falling' | 'finished'>('idle');
    const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
    const quantumTimerRef = useRef<number | null>(null);
    
    // Mutable refs for animation state (avoids React re-render per frame)
    const ballStatesRef = useRef<BallAnimState[]>([]);
    const slotHitsRef = useRef<number[]>(new Array(17).fill(0));
    const launchTimestampRef = useRef<number>(0);
    const onDropFinishRef = useRef(onDropFinish);
    onDropFinishRef.current = onDropFinish;

    // Initialize animation when balls change
    useEffect(() => {
        if (isDropping && balls.length > 0) {
            // Reset state
            ballStatesRef.current = balls.map(() => ({
                currentRow: 0,
                progress: 0,
                x: 0,
                y: 20,
                launched: false,
                landed: false,
            }));
            slotHitsRef.current = new Array(17).fill(0);
            launchTimestampRef.current = 0;

            // Start quantum phase
            setDropState('quantum');

            // After 1.5s quantum effect, start falling
            if (quantumTimerRef.current) clearTimeout(quantumTimerRef.current);
            quantumTimerRef.current = setTimeout(() => {
                launchTimestampRef.current = performance.now();
                // Launch first ball immediately
                if (ballStatesRef.current.length > 0) {
                    ballStatesRef.current[0].launched = true;
                }
                setDropState('falling');
            }, 1500);
        } else if (!isDropping) {
            setDropState('idle');
            if (quantumTimerRef.current) clearTimeout(quantumTimerRef.current);
        }
    }, [isDropping, balls]);

    // Main animation loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const pegRadius = 4;
        const ballRadius = balls.length > 5 ? 6 : 8;
        
        const rowHeight = (height - 60) / ROWS;
        const colWidth = width / (ROWS + 2);

        let animationFrameId: number;
        
        const render = (timestamp: number) => {
            ctx.clearRect(0, 0, width, height);
            
            // Draw Pegs
            ctx.fillStyle = '#4b5563';
            for (let r = 1; r <= ROWS; r++) {
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
            const slotStartX = (width - (17 - 1) * colWidth) / 2;
            
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            for (let i = 0; i < 17; i++) {
                const mx = slotStartX + i * colWidth;
                const my = height - 20;
                
                // Highlight active slots for single-ball completed state
                const isActive = dropState === 'finished' && balls.length === 1 && balls[0]?.slot === i;
                
                ctx.fillStyle = isActive ? '#00f0ff' : '#1f2937';
                ctx.beginPath();
                ctx.roundRect(mx - colWidth/2 + 2, my - 15, colWidth - 4, 30, 4);
                ctx.fill();
                
                // Hover outline
                if (hoveredSlot === i && dropState === 'idle') {
                    ctx.strokeStyle = '#00f0ff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
                
                ctx.fillStyle = isActive ? '#000' : getMultiplierColor(multipliers[i]);
                ctx.fillText(`${multipliers[i]}x`, mx, my);
                
                // Tooltip for hovered slot
                if (hoveredSlot === i && dropState === 'idle') {
                    const perRunWager = Math.floor(wager / runsCount);
                    const prize = Math.floor(perRunWager * multipliers[i]);
                    const tipText = runsCount > 1 ? `${prize} SATS/run` : `${prize} SATS`;
                    ctx.font = 'bold 12px font-display';
                    const textWidth = ctx.measureText(tipText).width;
                    
                    const tipX = mx;
                    const tipY = my - 35;
                    
                    ctx.fillStyle = '#000000';
                    ctx.beginPath();
                    ctx.roundRect(tipX - textWidth/2 - 8, tipY - 14, textWidth + 16, 28, 4);
                    ctx.fill();
                    ctx.strokeStyle = '#00f0ff';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    
                    ctx.fillStyle = prize > perRunWager ? '#4ade80' : prize < perRunWager ? '#ef4444' : '#fbbf24';
                    ctx.fillText(tipText, tipX, tipY);
                    
                    ctx.font = 'bold 12px monospace';
                }
            }

            // Draw slot counter badges after all balls landed (multi-ball mode)
            if (dropState === 'finished' && balls.length > 1) {
                const hits = slotHitsRef.current;
                ctx.font = 'bold 11px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                for (let i = 0; i < 17; i++) {
                    if (hits[i] === 0) continue;
                    
                    const mx = slotStartX + i * colWidth;
                    const my = height - 20;
                    
                    // Determine badge color based on multiplier
                    const mult = multipliers[i];
                    let badgeBg = '#374151'; // gray
                    let badgeFg = '#9ca3af';
                    if (mult > 1) { badgeBg = '#166534'; badgeFg = '#4ade80'; }
                    if (mult < 1) { badgeBg = '#7f1d1d'; badgeFg = '#f87171'; }
                    
                    // Badge circle on top of slot
                    const badgeX = mx;
                    const badgeY = my - 28;
                    const badgeR = 10;
                    
                    ctx.fillStyle = badgeBg;
                    ctx.beginPath();
                    ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = badgeFg;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                    
                    ctx.fillStyle = badgeFg;
                    ctx.fillText(hits[i].toString(), badgeX, badgeY);
                }
            }

            // Draw Balls based on state
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
                for (let i = 0; i < 5; i++) {
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
            } else if (dropState === 'falling') {
                const elapsed = timestamp - launchTimestampRef.current;
                let allLanded = true;
                
                // Launch balls with stagger
                for (let b = 0; b < balls.length; b++) {
                    const launchAt = b * STAGGER_DELAY_MS;
                    if (elapsed >= launchAt && !ballStatesRef.current[b].launched) {
                        ballStatesRef.current[b].launched = true;
                    }
                }
                
                // Update and draw each ball
                for (let b = 0; b < balls.length; b++) {
                    const state = ballStatesRef.current[b];
                    const ballPath = balls[b].path;
                    const color = getBallColor(b, balls.length);
                    
                    if (!state.launched) {
                        allLanded = false;
                        // Draw queued ball at top with reduced opacity
                        ctx.globalAlpha = 0.3;
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.arc(width / 2, 20, ballRadius, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.globalAlpha = 1;
                        continue;
                    }
                    
                    if (state.landed) continue; // Already done
                    
                    allLanded = false;
                    
                    // Animate this ball
                    state.progress += BALL_SPEED;
                    if (state.progress >= 1) {
                        state.progress = 0;
                        state.currentRow++;
                    }
                    
                    if (state.currentRow < ROWS) {
                        const move = ballPath[state.currentRow]; // 0 or 1
                        
                        // Start position for this row
                        const startCols = state.currentRow + 1;
                        const startXRow = (width - (startCols - 1) * colWidth) / 2;
                        
                        // Count previous rights
                        let currentC = 0;
                        for (let j = 0; j < state.currentRow; j++) currentC += ballPath[j];
                        
                        const startXPos = startXRow + currentC * colWidth;
                        const startYPos = (state.currentRow + 1) * rowHeight;
                        
                        // End position for next row
                        const nextCols = state.currentRow + 2;
                        const nextStartXRow = (width - (nextCols - 1) * colWidth) / 2;
                        const nextC = currentC + move;
                        
                        const nextXPos = nextStartXRow + nextC * colWidth;
                        const nextYPos = (state.currentRow + 2) * rowHeight;
                        
                        // Bounce interpolation
                        const bounce = Math.sin(state.progress * Math.PI) * 15;
                        
                        state.x = startXPos + (nextXPos - startXPos) * state.progress;
                        state.y = startYPos + (nextYPos - startYPos) * state.progress - bounce;
                    } else {
                        // Ball reached bottom
                        state.landed = true;
                        slotHitsRef.current[balls[b].slot]++;
                        continue;
                    }
                    
                    // Draw the ball
                    ctx.fillStyle = color;
                    ctx.shadowColor = getBallGlow(b, balls.length);
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(state.x, state.y, ballRadius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
                
                // All balls have landed
                if (allLanded) {
                    setDropState('finished');
                    onDropFinishRef.current();
                }
            } else if (dropState === 'finished') {
                // Draw settled balls at their final slot positions
                const slotPositions: number[][] = Array.from({ length: 17 }, () => []);
                balls.forEach((ball, idx) => slotPositions[ball.slot].push(idx));
                
                for (let slot = 0; slot < 17; slot++) {
                    const indices = slotPositions[slot];
                    if (indices.length === 0) continue;
                    
                    const mx = slotStartX + slot * colWidth;
                    const bottomY = height - 42;
                    
                    indices.forEach((ballIdx, stackIdx) => {
                        const color = getBallColor(ballIdx, balls.length);
                        const yPos = bottomY - stackIdx * (ballRadius * 1.8);
                        const r = ballRadius * 0.8;
                        
                        // Draw ball circle
                        ctx.fillStyle = color;
                        ctx.shadowColor = getBallGlow(ballIdx, balls.length);
                        ctx.shadowBlur = 6;
                        ctx.beginPath();
                        ctx.arc(mx, yPos, r, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.shadowBlur = 0;

                        // Draw slot outcome label on the ball
                        ctx.font = `bold ${Math.max(8, r)}px monospace`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = '#000';
                        ctx.fillText(slot.toString(), mx, yPos);
                    });
                }
            }

            // Continue animation loop if not idle
            if (dropState !== 'idle') {
                animationFrameId = requestAnimationFrame(render);
            }
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [dropState, balls, risk, hoveredSlot, wager, runsCount]);

    // Handle hover
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (dropState !== 'idle') {
            setHoveredSlot(null);
            return;
        }
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        
        if (mouseY > canvas.height - 40 && mouseY < canvas.height) {
            const colWidth = canvas.width / (ROWS + 2);
            const startX = (canvas.width - (17 - 1) * colWidth) / 2;
            
            let found = null;
            for (let i = 0; i < 17; i++) {
                const mx = startX + i * colWidth;
                if (Math.abs(mouseX - mx) <= colWidth / 2) {
                    found = i;
                    break;
                }
            }
            setHoveredSlot(found);
        } else {
            setHoveredSlot(null);
        }
    }, [dropState]);
    
    const handleMouseLeave = useCallback(() => {
        setHoveredSlot(null);
    }, []);

    return (
        <div className="w-full flex justify-center py-8">
            <canvas 
                ref={canvasRef} 
                width={800} 
                height={600} 
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="max-w-full h-auto bg-black/20 rounded-xl border border-white/5 shadow-2xl"
            />
        </div>
    );
}
