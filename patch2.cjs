const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/game/SpinWheel.tsx', 'utf8');

const target = `    useEffect(() => {
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
    }, [isSpinning, runResults, onFinish]);`;

const replacement = `    const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

    useEffect(() => {
        if (isSpinning && !hasSpun.current && runResults.length > 0) {
            hasSpun.current = true;
            
            // Randomize spins for each ball so they don't move exactly together
            const newSpins = runResults.map(() => 360 * (3 + Math.floor(Math.random() * 3)));
            setSpins(newSpins);

            setPhase('quantum');

            timeoutsRef.current = [
                setTimeout(() => setPhase('spinning'), 1500),
                setTimeout(() => setPhase('settled'), 4500),
                setTimeout(() => {
                    onFinish?.();
                    hasSpun.current = false;
                }, 5000) // Small delay after settling before overlay shows
            ];
        }
    }, [isSpinning, runResults, onFinish]);

    useEffect(() => {
        return () => timeoutsRef.current.forEach(clearTimeout);
    }, []);`;

// Replace handling standard newlines
const normalizedTarget = target.replace(/\r\n/g, '\n');
const normalizedReplacement = replacement.replace(/\r\n/g, '\n');

let normalizedContent = content.replace(/\r\n/g, '\n');
normalizedContent = normalizedContent.replace(normalizedTarget, normalizedReplacement);

fs.writeFileSync('frontend/src/components/game/SpinWheel.tsx', normalizedContent);
