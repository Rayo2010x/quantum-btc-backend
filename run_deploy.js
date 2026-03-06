const { execSync } = require('child_process');
const fs = require('fs');

try {
    console.log("Adding files...");
    execSync('git add .');

    console.log("Committing changes...");
    execSync('git commit -m "feat(statistics): add last bets selector"');

    console.log("Pushing to main...");
    execSync('git push origin main');

    console.log("Deployment triggered successfully. Git log:");
    const log = execSync('git log -1').toString();
    fs.writeFileSync('deploy_log.txt', log);
} catch (e) {
    console.error("Error running git commands:", e.stdout ? e.stdout.toString() : e, e.stderr ? e.stderr.toString() : '');
    fs.writeFileSync('deploy_log.txt', "Error: " + e.message);
}
