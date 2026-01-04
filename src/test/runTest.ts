import { runTests } from '@vscode/test-electron';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    try {
        const extensionDevelopmentPath = path.resolve(__dirname, '../../');
        const extensionTestsPath = path.resolve(__dirname, './suite/index.js');

        // Ensure unique user data directory to prevent profile locks
        const userDataDir = path.join(tmpdir(), `vscode-test-king-${Date.now()}`);

        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            version: '1.107.1',
            launchArgs: [
                `--user-data-dir=${userDataDir}`,
                '--disable-gpu',
                '--disable-updates',
                '--skip-welcome',
                '--skip-release-notes',
                '--disable-workspace-trust'
            ],
            // Environment variables to assist with ESM stability and mark test mode
            extensionTestsEnv: {
                VSCODE_TEST_MODE: '1'
            }
        });
    } catch (err) {
        console.error('Failed to run tests', err);
        process.exit(1);
    }
}

main();
