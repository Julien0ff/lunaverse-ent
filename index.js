const { spawn } = require('child_process');

/**
 * Pterodactyl expects an 'index.js' file by default as the startup entry point.
 * This script acts as a bridge to run the Discord Bot using the command defined in package.json.
 */

console.log('🚀 [ENT LunaVerse] Initializing Discord Bot...');

const botProcess = spawn('npm', ['run', 'bot'], {
    stdio: 'inherit',
    shell: true
});

botProcess.on('close', (code) => {
    if (code !== 0) {
        console.error(`❌ Bot process exited with code ${code}`);
    } else {
        console.log('✅ Bot process finished successfully.');
    }
    process.exit(code);
});

botProcess.on('error', (err) => {
    console.error('❌ Failed to start bot process:', err);
    process.exit(1);
});
