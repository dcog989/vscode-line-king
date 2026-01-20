import { glob } from 'glob';
import Mocha from 'mocha';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function run(): Promise<void> {
    // Initialize Mocha with ESM-friendly settings
    const mocha = new Mocha({
        ui: 'tdd',
        color: true,
        // Increased timeout for benchmark tests and CI environments
        // Benchmarks with 100k lines can take significant time on slower CPUs
        timeout: 60000, // 60 seconds (was 20 seconds)
        // Allow tests to run slower in CI without failing
        slow: 10000, // Mark tests as slow if they take > 10s
        // ESM loader configuration - critical for proper module resolution
        require: [], // Don't use require hooks in ESM mode
    });

    const testsRoot = path.resolve(__dirname, '..');

    // Find all test files using glob
    const files = await glob('**/**.test.js', {
        cwd: testsRoot,
        absolute: true,
        // Ensure we're getting platform-specific paths
        windowsPathsNoEscape: true,
    });

    if (files.length === 0) {
        throw new Error(`No test files found in ${testsRoot}`);
    }

    // IMPORTANT: Manually inject Mocha globals (suite, test, etc.) into the global namespace
    // This is required because we are manually importing files in an ESM context
    // instead of using Mocha's internal file loader.
    mocha.suite.emit('pre-require', global, 'nofile', mocha);

    // For ESM, we need to convert file paths to file:// URLs
    // and dynamically import them rather than using Mocha's file loader
    for (const file of files) {
        // Convert Windows paths to file:// URLs for ESM import
        const fileUrl = pathToFileURL(file).href;

        // Dynamic import will properly resolve .js extensions in ESM
        await import(fileUrl);
    }

    // Run the tests after all modules are loaded
    return new Promise((resolve, reject) => {
        mocha.run((failures) => {
            if (failures > 0) {
                reject(new Error(`${failures} tests failed.`));
            } else {
                resolve();
            }
        });
    });
}
