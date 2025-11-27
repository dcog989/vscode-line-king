import * as assert from 'assert';
import * as cleaner from '../../lib/cleaner';
import * as sorter from '../../lib/sorter';

suite('Line King Performance Benchmarks', () => {

    // Large datasets
    const LINE_COUNT = 100_000;
    let randomLines: string[] = [];
    let ipAddresses: string[] = [];
    let duplicateLines: string[] = [];

    suiteSetup(() => {
        console.log('--- GENERATING DATASETS ---');
        // 1. Random strings
        for (let i = 0; i < LINE_COUNT; i++) {
            randomLines.push(`Line Entry ${Math.random().toString(36).substring(7)}`);
        }

        // 2. IPs (for regex sort testing) - 10k items (simulating a large log file)
        for (let i = 0; i < 10000; i++) {
            ipAddresses.push(`${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`);
        }

        // 3. Duplicates
        duplicateLines = new Array(LINE_COUNT).fill('Duplicate Content');
        for (let i = 0; i < LINE_COUNT / 2; i++) {
            duplicateLines[i] = `Unique ${i}`;
        }
        console.log('--- DATASETS READY ---');
    });

    test('Benchmark: Standard Sort (100k lines)', () => {
        const start = performance.now();
        const result = sorter.sortAsc(randomLines);
        const duration = performance.now() - start;

        console.log(`[Sort Asc] 100k lines: ${duration.toFixed(2)}ms`);
        assert.strictEqual(result.length, LINE_COUNT);
        assert.ok(duration < 1000, `Sort took too long: ${duration.toFixed(2)}ms`);
    });

    test('Benchmark: Natural Sort (100k lines)', () => {
        // Optimized with Intl.Collator
        const start = performance.now();
        sorter.sortNatural(randomLines);
        const duration = performance.now() - start;

        console.log(`[Sort Natural] 100k lines: ${duration.toFixed(2)}ms`);
        // Should be < 10s. Usually ~2-4s on modern CPUs with Collator.
        assert.ok(duration < 10000, `Natural sort took too long: ${duration.toFixed(2)}ms`);
    });

    test('Benchmark: IP Address Sort (10k IPs)', () => {
        // Regex + Splitting logic is heavy
        const start = performance.now();
        sorter.sortIP(ipAddresses);
        const duration = performance.now() - start;

        console.log(`[Sort IP] 10k lines: ${duration.toFixed(2)}ms`);
        assert.ok(duration < 2000, `IP sort too slow: ${duration.toFixed(2)}ms`);
    });

    test('Benchmark: Remove Duplicates (100k lines)', () => {
        const start = performance.now();
        const result = cleaner.removeDuplicates(duplicateLines);
        const duration = performance.now() - start;

        console.log(`[Dedupe] 100k lines: ${duration.toFixed(2)}ms`);
        assert.ok(duration < 500, `Dedupe too slow: ${duration.toFixed(2)}ms`);
        assert.strictEqual(result.length, (LINE_COUNT / 2) + 1);
    });
});
