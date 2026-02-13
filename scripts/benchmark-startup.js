import path from 'node:path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const RESULTS_DIR = path.join(ROOT_DIR, '.benchmark-results');
const RESULTS_FILE = path.join(RESULTS_DIR, 'startup-results.json');

function ensureResultsDir() {
    if (!existsSync(RESULTS_DIR)) {
        mkdirSync(RESULTS_DIR, { recursive: true });
    }
}

function saveResults(results) {
    ensureResultsDir();

    const timestamp = new Date().toISOString();
    const gitSha = process.env.GITHUB_SHA || 'local';
    const gitRef = process.env.GITHUB_REF_NAME || 'local';

    const fullResults = {
        timestamp,
        gitSha,
        gitRef,
        ...results,
    };

    writeFileSync(RESULTS_FILE, JSON.stringify(fullResults, null, 2));
    // eslint-disable-next-line no-console
    console.log(`\n✅ Results saved to: ${RESULTS_FILE}`);

    return fullResults;
}

function formatOutput(results) {
    // eslint-disable-next-line no-console
    console.log(`\n${'='.repeat(60)}`);
    // eslint-disable-next-line no-console
    console.log('📊 LINE KING STARTUP BENCHMARK RESULTS');
    // eslint-disable-next-line no-console
    console.log('='.repeat(60));

    for (const [key, value] of Object.entries(results)) {
        if (typeof value === 'object' && value.avg !== undefined) {
            // eslint-disable-next-line no-console
            console.log(`\n${key}:`);
            // eslint-disable-next-line no-console
            console.log(`  Average: ${value.avg}ms`);
            // eslint-disable-next-line no-console
            console.log(`  Min:     ${value.min}ms`);
            // eslint-disable-next-line no-console
            console.log(`  Max:     ${value.max}ms`);
            // eslint-disable-next-line no-console
            console.log(`  Std Dev: ${value.stdDev}ms`);
        }
    }

    // eslint-disable-next-line no-console
    console.log(`\n${'='.repeat(60)}`);
}

function compareWithBaseline(newResults) {
    if (!existsSync(RESULTS_FILE)) {
        // eslint-disable-next-line no-console
        console.log('\nℹ️  No baseline found for comparison');
        return null;
    }

    try {
        const baseline = JSON.parse(readFileSync(RESULTS_FILE, 'utf8'));
        // eslint-disable-next-line no-console
        console.log('\n📈 Comparison with baseline:');
        // eslint-disable-next-line no-console
        console.log(`Baseline: ${baseline.timestamp}`);

        for (const [key, newValue] of Object.entries(newResults)) {
            if (typeof newValue === 'object' && newValue.avg !== undefined) {
                const baselineValue = baseline[key]?.avg;
                if (baselineValue) {
                    const diff = newValue.avg - baselineValue;
                    const percentChange = ((diff / baselineValue) * 100).toFixed(2);
                    const sign = diff > 0 ? '+' : '';
                    const status = Math.abs(diff) < 0.5 ? '✓' : diff > 0 ? '⚠️' : '⚡';
                    // eslint-disable-next-line no-console
                    console.log(
                        `  ${status} ${key}: ${sign}${diff.toFixed(3)}ms (${sign}${percentChange}%)`,
                    );
                }
            }
        }
    } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('\n⚠️  Could not compare with baseline:', e.message);
    }
}

// Simple benchmark that doesn't require importing extension
// It assumes metrics will be written to a file by extension activation
async function runBenchmark() {
    ensureResultsDir();

    // eslint-disable-next-line no-console
    console.log('🚀 Starting Line King startup benchmark...');
    // eslint-disable-next-line no-console
    console.log('Looking for metrics from VS Code extension activation...\n');

    // Look for metrics in various possible locations
    const possibleLocations = [
        path.join(RESULTS_DIR, 'metrics.json'),
        path.join(ROOT_DIR, 'dist/extension.js.benchmark-results/metrics.json'),
        path.join(ROOT_DIR, 'dist/extension.js.benchmark-metrics.json'),
    ];

    let metrics = null;
    for (const loc of possibleLocations) {
        if (existsSync(loc)) {
            try {
                metrics = JSON.parse(readFileSync(loc, 'utf8'));
                // eslint-disable-next-line no-console
                console.log(`✅ Found metrics in: ${loc}`);
                break;
            } catch {
                // Continue to next location
            }
        }
    }

    if (!metrics) {
        // eslint-disable-next-line no-console
        console.error('❌ No benchmark metrics found.');
        // eslint-disable-next-line no-console
        console.log('   Run tests in VS Code with VSCODE_BENCHMARK_MODE=1 to capture metrics.');
        // eslint-disable-next-line no-console
        console.log('   Or use the unit tests to verify functionality.');

        // Show a sample of what metrics would look like
        // eslint-disable-next-line no-console
        console.log('\n📋 Sample metrics format:');
        // eslint-disable-next-line no-console
        console.log(
            JSON.stringify(
                {
                    startTime: 0,
                    loggerInit: 0.1,
                    commandsRegistered: 1.5,
                    saveHandlerRegistered: 1.6,
                    contextDeferred: 1.7,
                    total: 1.7,
                },
                null,
                2,
            ),
        );
        process.exit(1);
    }

    // eslint-disable-next-line no-console
    console.log(`\n📊 Current metrics:`);
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(metrics, null, 2));

    // Create fake aggregated for single run
    const aggregated = {};
    for (const [key, value] of Object.entries(metrics)) {
        if (typeof value === 'number') {
            aggregated[key] = {
                avg: Number(value.toFixed(3)),
                min: Number(value.toFixed(3)),
                max: Number(value.toFixed(3)),
                stdDev: 0,
            };
        }
    }

    formatOutput(aggregated);
    compareWithBaseline(aggregated);

    saveResults({
        runs: 1,
        aggregated,
    });
}

runBenchmark().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Benchmark failed:', error);
    process.exit(1);
});
