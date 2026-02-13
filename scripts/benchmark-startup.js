const path = require('node:path');
const { execSync } = require('node:child_process');
const { existsSync, readFileSync, writeFileSync, mkdirSync } = require('node:fs');

const ROOT_DIR = path.join(__dirname, '..');
const RESULTS_DIR = path.join(ROOT_DIR, '.benchmark-results');
const RESULTS_FILE = path.join(RESULTS_DIR, 'startup-results.json');

function ensureResultsDir() {
    if (!existsSync(RESULTS_DIR)) {
        mkdirSync(RESULTS_DIR, { recursive: true });
    }
}

function parseMetrics(output) {
    const match = output.match(/STARTUP_METRICS:\s*({.*})/);
    if (match) {
        try {
            return JSON.parse(match[1]);
        } catch (e) {
            console.warn('Failed to parse metrics:', e);
        }
    }
    return null;
}

function aggregateResults(allMetrics) {
    const metricsKeys = Object.keys(allMetrics[0]);
    const aggregated = {};

    for (const key of metricsKeys) {
        const values = allMetrics.map((m) => m[key]);
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const variance =
            values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        aggregated[key] = {
            avg: Number(avg.toFixed(3)),
            min: Number(min.toFixed(3)),
            max: Number(max.toFixed(3)),
            stdDev: Number(stdDev.toFixed(3)),
        };
    }

    return aggregated;
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
    console.log(`\n✅ Results saved to: ${RESULTS_FILE}`);

    return fullResults;
}

function formatOutput(results) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 LINE KING STARTUP BENCHMARK RESULTS');
    console.log('='.repeat(60));

    for (const [key, value] of Object.entries(results)) {
        if (typeof value === 'object' && value.avg !== undefined) {
            console.log(`\n${key}:`);
            console.log(`  Average: ${value.avg}ms`);
            console.log(`  Min:     ${value.min}ms`);
            console.log(`  Max:     ${value.max}ms`);
            console.log(`  Std Dev: ${value.stdDev}ms`);
        }
    }

    console.log('\n' + '='.repeat(60));
}

function compareWithBaseline(newResults) {
    if (!existsSync(RESULTS_FILE)) {
        console.log('\nℹ️  No baseline found for comparison');
        return null;
    }

    try {
        const baseline = JSON.parse(readFileSync(RESULTS_FILE, 'utf8'));
        console.log('\n📈 Comparison with baseline:');
        console.log(`Baseline: ${baseline.timestamp}`);

        for (const [key, newValue] of Object.entries(newResults)) {
            if (typeof newValue === 'object' && newValue.avg !== undefined) {
                const baselineValue = baseline[key]?.avg;
                if (baselineValue) {
                    const diff = newValue.avg - baselineValue;
                    const percentChange = ((diff / baselineValue) * 100).toFixed(2);
                    const sign = diff > 0 ? '+' : '';
                    const status = Math.abs(diff) < 0.5 ? '✓' : diff > 0 ? '⚠️' : '⚡';
                    console.log(
                        `  ${status} ${key}: ${sign}${diff.toFixed(3)}ms (${sign}${percentChange}%)`,
                    );
                }
            }
        }
    } catch (e) {
        console.warn('\n⚠️  Could not compare with baseline:', e.message);
    }
}

// Simple benchmark that doesn't require importing extension
// It assumes metrics will be written to a file by extension activation
async function runBenchmark() {
    ensureResultsDir();

    console.log('🚀 Starting Line King startup benchmark...');
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
                console.log(`✅ Found metrics in: ${loc}`);
                break;
            } catch (e) {
                // Continue to next location
            }
        }
    }

    if (!metrics) {
        console.error('❌ No benchmark metrics found.');
        console.log('   Run tests in VS Code with VSCODE_BENCHMARK_MODE=1 to capture metrics.');
        console.log('   Or use the unit tests to verify functionality.');

        // Show a sample of what metrics would look like
        console.log('\n📋 Sample metrics format:');
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

    console.log(`\n📊 Current metrics:`);
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
    console.error('Benchmark failed:', error);
    process.exit(1);
});
