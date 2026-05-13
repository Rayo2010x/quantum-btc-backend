const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/game/SpinWheel.tsx', 'utf8');

content = content.replace("transitionDuration: isSettled ? '0ms' : (isSpinning ? ${durations[i]}ms : '0ms'),", "transitionDuration: isSettled ? '0ms' : (isSpinning ? `${durations[i]}ms` : '0ms'),");

fs.writeFileSync('frontend/src/components/game/SpinWheel.tsx', content);
