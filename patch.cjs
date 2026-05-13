const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/game/SpinWheel.tsx', 'utf8');

content = content.replace('{phase !== \'idle\' && phase !== \'quantum\' && runResults.map', '{phase !== \'idle\' && runResults.map');

content = content.replace(`const finalRotation = baseAngle + (spins[i] || 0);\r
                    const isSettled = phase === 'settled';`, `const finalRotation = baseAngle + (spins[i] || 0);\r
                    const isQuantum = phase === 'quantum';\r
                    const isSpinning = phase === 'spinning';\r
                    const isSettled = phase === 'settled';\r
                    const currentRotation = isQuantum ? baseAngle : finalRotation;`);

content = content.replace(`const finalRotation = baseAngle + (spins[i] || 0);\n                    const isSettled = phase === 'settled';`, `const finalRotation = baseAngle + (spins[i] || 0);\n                    const isQuantum = phase === 'quantum';\n                    const isSpinning = phase === 'spinning';\n                    const isSettled = phase === 'settled';\n                    const currentRotation = isQuantum ? baseAngle : finalRotation;`);

content = content.replace('transform: `rotate(${finalRotation}deg)`,\r\n                                transitionDuration: isSettled ? \'0ms\' : \'3000ms\',', 'transform: `rotate(${currentRotation}deg)`,\r\n                                transitionDuration: isSettled ? \'0ms\' : (isSpinning ? \'3000ms\' : \'0ms\'),');
content = content.replace('transform: `rotate(${finalRotation}deg)`,\n                                transitionDuration: isSettled ? \'0ms\' : \'3000ms\',', 'transform: `rotate(${currentRotation}deg)`,\n                                transitionDuration: isSettled ? \'0ms\' : (isSpinning ? \'3000ms\' : \'0ms\'),');

content = content.replace(`top: isSettled ? '36px' : '4px'`, `top: isSettled ? '36px' : (isQuantum ? '120px' : '4px'),\r\n                                            opacity: isQuantum ? 0 : 1,\r\n                                            transform: isQuantum ? 'scale(0.1)' : 'scale(1)'`);

fs.writeFileSync('frontend/src/components/game/SpinWheel.tsx', content);
