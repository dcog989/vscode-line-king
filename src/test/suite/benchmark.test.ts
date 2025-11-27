import * as assert from 'assert';
import * as cleaner from '../../lib/cleaner';
import * as sorter from '../../lib/sorter';

suite('Line King Performance Benchmarks', () => {

    // Setup large datasets
    const LINE_COUNT = 100_000;
    let randomLines: string[] = [];
    let duplicateLines: string[] = [];

    suiteSetup(() => {
        console.log('--- GENERATING DATASETS ---');
        // Generate random strings
        for (let i = 0; i < LINE_COUNT; i++) {
            randomLines.push(`Line Entry ${Math.random().toString(36).substring(7)}`);
        }

        // Generate dataset with 50% duplicates
        duplicateLines = new Array(LINE_COUNT).fill('Duplicate Content');
        for (let i = 0; i < LINE_COUNT / 2; i++) {
            duplicateLines[i] = `Unique ${i}`;
        }
        console.log(`Generated ${LINE_COUNT} lines for benchmarking.`);
    });

    test('Benchmark: Standard Sort (100k lines)', () => {
        const start = performance.now();
        const result = sorter.sortAsc(randomLines);
        const end = performance.now();
        const duration = end - start;

        console.log(`[Sort Asc] 100k lines: ${duration.toFixed(2)}ms`);

        assert.strictEqual(result.length, LINE_COUNT);
        // Expect standard V8 sort to be very fast (< 300ms typical)
        assert.ok(duration < 1000, `Sort took too long: ${duration}ms`);
    });

    test('Benchmark: Natural Sort (100k lines)', () => {
        // Natural sort is more expensive due to complex localeCompare
        const start = performance.now();
        sorter.sortNatural(randomLines);
        const end = performance.now();
        const duration = end - start;

        console.log(`[Sort Natural] 100k lines: ${duration.toFixed(2)}ms`);

        // This is usually 5-10x slower than standard sort
        assert.ok(duration < 5000, `Natural sort took too long: ${duration}ms`);
    });

    test('Benchmark: Remove Duplicates (100k lines)', () => {
        const start = performance.now();
        const result = cleaner.removeDuplicates(duplicateLines);
        const end = performance.now();
        const duration = end - start;

        console.log(`[Dedupe] 100k lines (50% dupes): ${duration.toFixed(2)}ms`);

        // Set implementation should be extremely fast (< 100ms)
        assert.ok(duration < 500, `Dedupe took too long: ${duration}ms`);
        assert.strictEqual(result.length, (LINE_COUNT / 2) + 1);
    });
});
