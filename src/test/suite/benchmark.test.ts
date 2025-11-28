import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sorter from '../../lib/sorter';
import { generateIPs, generateRandomLines } from '../utils/data-generator';

suite('Line King Performance Benchmarks', () => {

    // Large datasets
    const LINE_COUNT = 100_000;
    const INTEGRATION_COUNT = 10_000; // Smaller set for real editor operations
    let randomLines: string[] = [];
    let ipAddresses: string[] = [];

    suiteSetup(() => {
        console.log('--- GENERATING DATASETS ---');
        randomLines = generateRandomLines(LINE_COUNT);
        ipAddresses = generateIPs(10_000);
        console.log('--- DATASETS READY ---');
    });

    // --- ALGORITHM BENCHMARKS (Pure Speed) ---

    test('Algorithm: Standard Sort (100k lines)', () => {
        const start = performance.now();
        sorter.sortAsc(randomLines);
        const duration = performance.now() - start;

        console.log(`[Algo: Sort Asc] 100k lines: ${duration.toFixed(2)}ms`);
        assert.ok(duration < 1000);
    });

    test('Algorithm: Natural Sort (100k lines)', () => {
        const start = performance.now();
        sorter.sortNatural(randomLines);
        const duration = performance.now() - start;

        console.log(`[Algo: Sort Natural] 100k lines: ${duration.toFixed(2)}ms`);
        assert.ok(duration < 10000);
    });

    test('Algorithm: IP Address Sort (10k IPs)', () => {
        const start = performance.now();
        sorter.sortIP(ipAddresses);
        const duration = performance.now() - start;

        console.log(`[Algo: Sort IP] 10k lines: ${duration.toFixed(2)}ms`);
        assert.ok(duration < 2000);
    });

    // --- INTEGRATION BENCHMARKS (Real Editor vs Native) ---

    test('Integration: Native VS Code vs Line King (10k lines)', async () => {
        // 1. Prepare Content
        const content = randomLines.slice(0, INTEGRATION_COUNT).join('\n');
        const doc = await vscode.workspace.openTextDocument({ content, language: 'plaintext' });
        const editor = await vscode.window.showTextDocument(doc);

        // 2. Benchmark Native VS Code Command
        const startNative = performance.now();
        await vscode.commands.executeCommand('editor.action.sortLinesAscending');
        const durNative = performance.now() - startNative;

        // Reset text
        await editor.edit(eb => {
            const fullRange = new vscode.Range(0, 0, doc.lineCount, 0);
            eb.replace(fullRange, content);
        });

        // 3. Benchmark Line King Command
        const startKing = performance.now();
        await vscode.commands.executeCommand('lineKing.sort.asc');
        const durKing = performance.now() - startKing;

        console.log(`[Integration 10k] Native: ${durNative.toFixed(2)}ms | Line King: ${durKing.toFixed(2)}ms`);

        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

        // Allow for overhead
        assert.ok(durKing < 2000);
    });
});
