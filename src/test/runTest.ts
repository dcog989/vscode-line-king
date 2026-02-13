import { runTests } from '@vscode/test-electron';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function run() {
    try {
        const extensionDevelopmentPath = path.resolve(__dirname, '../../');
        const extensionTestsPath = path.resolve(__dirname, '../../dist/test/suite/index.js');
        const logFile = path.resolve(__dirname, '../../dist/test/runTest.log');

        // Ensure unique user data directory to prevent profile locks
        const userDataDir = path.join(tmpdir(), `vscode-test-king-${Date.now()}`);

        // Capture stdout for benchmark metrics
        // eslint-disable-next-line no-console
        const originalLog = console.log;
        const logOutput: string[] = [];

        // eslint-disable-next-line no-console
        console.log = (...args: unknown[]) => {
            logOutput.push(args.map((a) => String(a)).join(' '));
            originalLog(...args);
        };

        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            version: '1.109.1',
            launchArgs: [
                `--user-data-dir=${userDataDir}`,
                '--disable-gpu',
                '--disable-updates',
                '--skip-welcome',
                '--skip-release-notes',
                '--disable-workspace-trust',
            ],
            // Environment variables to assist with ESM stability and mark test mode
            extensionTestsEnv: {
                VSCODE_TEST_MODE: '1',
                VSCODE_BENCHMARK_MODE: process.env.VSCODE_BENCHMARK_MODE || '0',
            },
        });

        // eslint-disable-next-line no-console
        console.log = originalLog;

        // Write log file for benchmark parsing
        if (process.env.VSCODE_BENCHMARK_MODE === '1') {
            writeFileSync(logFile, logOutput.join('\n'), 'utf8');
        }
    } catch {
        process.exit(1);
    }
}
