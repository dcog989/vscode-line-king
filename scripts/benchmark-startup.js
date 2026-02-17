import path from 'node:path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const RESULTS_DIR = path.join(ROOT_DIR, '.benchmark-results');
const RESULTS_FILE = path.join(RESULTS_DIR, 'benchmark-results.json');

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
    console.log('📊 LINE KING BENCHMARK RESULTS');
    // eslint-disable-next-line no-console
    console.log('='.repeat(60));

    for (const [key, value] of Object.entries(results)) {
        if (typeof value === 'object' && value.avg !== undefined) {
            // eslint-disable-next-line no-console
            console.log(`\n${key}:`);
            // eslint-disable-next-line no-console
            console.log(`  Average: ${value.avg.toFixed(3)}ms`);
            // eslint-disable-next-line no-console
            console.log(`  Min:     ${value.min.toFixed(3)}ms`);
            // eslint-disable-next-line no-console
            console.log(`  Max:     ${value.max.toFixed(3)}ms`);
            // eslint-disable-next-line no-console
            console.log(`  Std Dev: ${value.stdDev.toFixed(3)}ms`);
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
                if (baselineValue !== undefined) {
                    const diff = newValue.avg - baselineValue;
                    const percentChange =
                        baselineValue > 0 ? ((diff / baselineValue) * 100).toFixed(2) : '0';
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

function generateTestData(lineCount) {
    const lines = [];
    for (let i = 0; i < lineCount; i++) {
        lines.push(`Line ${Math.random().toString(36).substring(7)} ${i}`);
    }
    return lines;
}

function measure(fn, iterations = 100) {
    const times = [];

    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        fn();
        times.push(performance.now() - start);
    }

    times.sort((a, b) => a - b);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = times[0];
    const max = times[times.length - 1];
    const stdDev = Math.sqrt(
        times.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / times.length,
    );

    return { avg, min, max, stdDev };
}

async function runBenchmark() {
    ensureResultsDir();

    // eslint-disable-next-line no-console
    console.log('🚀 Starting Line King benchmarks...\n');

    // Import lib modules
    const sorter = await import('../src/lib/sorter.ts');
    const cleaner = await import('../src/lib/cleaner.ts');
    const transformer = await import('../src/lib/transformer.ts');

    // Generate test data
    const smallData = generateTestData(100);
    const mediumData = generateTestData(1000);
    const largeData = generateTestData(10000);

    // eslint-disable-next-line no-console
    console.log('Test data sizes: 100, 1000, 10000 lines\n');

    const results = {};

    // Sorting benchmarks
    results.sortAsc_100 = measure(() => sorter.sortAsc([...smallData]), 1000);
    results.sortAsc_1000 = measure(() => sorter.sortAsc([...mediumData]), 500);
    results.sortAsc_10000 = measure(() => sorter.sortAsc([...largeData]), 100);

    results.sortDesc_100 = measure(() => sorter.sortDesc([...smallData]), 1000);
    results.sortDesc_1000 = measure(() => sorter.sortDesc([...mediumData]), 500);

    results.sortNaturalAsc_100 = measure(() => sorter.sortNaturalAsc([...smallData]), 500);
    results.sortNaturalAsc_1000 = measure(() => sorter.sortNaturalAsc([...mediumData]), 200);

    results.sortIP_100 = measure(() => sorter.sortIP([...smallData]), 500);

    results.sortShuffle_1000 = measure(() => sorter.sortShuffle([...mediumData]), 200);

    // Cleaning benchmarks
    results.removeBlankLines_1000 = measure(() => cleaner.removeBlankLines([...mediumData]), 1000);
    results.removeDuplicateLines_1000 = measure(
        () => cleaner.removeDuplicateLines([...mediumData]),
        500,
    );
    results.trimTrailingWhitespace_1000 = measure(
        () => cleaner.trimTrailingWhitespace([...mediumData]),
        1000,
    );

    // Transformer benchmarks (case changes)
    const caseData = mediumData.map((l) => l.toUpperCase());
    results.toLowerCase_1000 = measure(() => caseData.map((l) => l.toLowerCase()), 500);
    results.toUpperCase_1000 = measure(() => mediumData.map((l) => l.toUpperCase()), 500);

    // Slice/copy benchmark (baseline)
    results.sliceCopy_10000 = measure(() => [...largeData], 1000);

    formatOutput(results);
    compareWithBaseline(results);

    saveResults({
        runs: 100,
        aggregated: results,
    });
}

runBenchmark().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Benchmark failed:', error);
    process.exit(1);
});
