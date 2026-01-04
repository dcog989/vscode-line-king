import * as assert from 'assert';
import { performance } from 'node:perf_hooks';
import * as vscode from 'vscode';
import * as sorter from '../../lib/sorter.js';
import { generateIPs, generateRandomLines } from '../utils/data-generator.js';

suite('Line King Performance Benchmarks', () => {

    // Large datasets
    const LINE_COUNT = 100_000;
    const INTEGRATION_COUNT = 10_000;
    let randomLines: string[] = [];
    let ipAddresses: string[] = [];

    suiteSetup(async () => {
        console.log('--- GENERATING DATASETS ---');
        randomLines = generateRandomLines(LINE_COUNT);
        ipAddresses = generateIPs(10_000);
        console.log('--- DATASETS READY ---');

        // Explicitly activate the extension before running integration tests
        // This ensures all commands are registered
        const ext = vscode.extensions.getExtension('dcog989.line-king');
        if (ext) {
            console.log('Activating extension for tests...');
            await ext.activate();
        }
    });

    test('Algorithm: Standard Sort (100k lines)', function () {
        // Set explicit timeout for this test - CI environments may be slower
        this.timeout(1500);

        const start = performance.now();
        sorter.sortAsc(randomLines);
        const duration = performance.now() - start;

        console.log(`Sort Asc 100k lines: ${duration.toFixed(2)}ms`);

        // More lenient assertion for CI environments
        // Standard sort should still be reasonably fast even on slower CPUs
        assert.ok(duration < 5000, `Sort took ${duration}ms, expected < 5000ms`);
    });

    test('Algorithm: Natural Sort (100k lines)', function () {
        // Natural sort is inherently slower - allow more time
        this.timeout(5000);

        const start = performance.now();
        sorter.sortNatural(randomLines);
        const duration = performance.now() - start;

        console.log(`Sort Natural 100k lines: ${duration.toFixed(2)}ms`);

        // Natural sort is complex - be generous with CI
        assert.ok(duration < 2000, `Natural sort took ${duration}ms, expected < 2000ms`);
    });

    test('Algorithm: IP Address Sort (10k IPs)', function () {
        // IP sorting has custom logic - allow reasonable time
        this.timeout(1500);

        const start = performance.now();
        sorter.sortIP(ipAddresses);
        const duration = performance.now() - start;

        console.log(`Sort IP 10k lines: ${duration.toFixed(2)}ms`);

        // IP parsing and sorting - allow time for slower CPUs
        assert.ok(duration < 5000, `IP sort took ${duration}ms, expected < 5000ms`);
    });

    test('Integration: Native VS Code vs Line King (10k lines)', async function () {
        // Integration tests with VS Code commands can be slow
        this.timeout(3000);

        const content = randomLines.slice(0, INTEGRATION_COUNT).join('\n');
        const doc = await vscode.workspace.openTextDocument({ content, language: 'plaintext' });
        const editor = await vscode.window.showTextDocument(doc);

        const startNative = performance.now();
        await vscode.commands.executeCommand('editor.action.sortLinesAscending');
        const durNative = performance.now() - startNative;

        // Reset content
        await editor.edit(eb => {
            const fullRange = new vscode.Range(0, 0, doc.lineCount, 0);
            eb.replace(fullRange, content);
        });

        const startKing = performance.now();
        await vscode.commands.executeCommand('lineKing.sort.asc');
        const durKing = performance.now() - startKing;

        console.log(`Integration 10k: Native = ${durNative.toFixed(2)}ms | Line King = ${durKing.toFixed(2)}ms`);

        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

        // Integration tests involve UI operations - be lenient
        assert.ok(durKing < 1000, `Line King sort took ${durKing}ms, expected < 1000ms`);
    });
});
