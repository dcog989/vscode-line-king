import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sorter from '../../lib/sorter';

suite('Line King Performance Benchmarks', () => {

    // Large datasets
    const LINE_COUNT = 100_000;
    const INTEGRATION_COUNT = 10_000; // Smaller set for real editor operations
    let randomLines: string[] = [];
    let ipAddresses: string[] = [];
    let duplicateLines: string[] = [];

    suiteSetup(() => {
        console.log('--- GENERATING DATASETS ---');
        // 1. Random strings
        for (let i = 0; i < LINE_COUNT; i++) {
            randomLines.push(`Line Entry ${Math.random().toString(36).substring(7)}`);
        }

        // 2. IPs
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

    // --- ALGORITHM BENCHMARKS (Pure Speed) ---

    test('Algorithm: Standard Sort (100k lines)', () => {
        const start = performance.now();
        const result = sorter.sortAsc(randomLines);
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
        // (This runs in the core process, so it will always be faster)
        const startNative = performance.now();
        await vscode.commands.executeCommand('editor.action.sortLinesAscending');
        const durNative = performance.now() - startNative;

        // Reset text for next run
        await editor.edit(eb => {
            const fullRange = new vscode.Range(0, 0, doc.lineCount, 0);
            eb.replace(fullRange, content);
        });

        // 3. Benchmark Line King Command
        // (This has overhead: Text -> Extension Host -> Sort -> Text Edit -> Renderer)
        const startKing = performance.now();
        await vscode.commands.executeCommand('lineKing.sort.asc');
        const durKing = performance.now() - startKing;

        console.log(`[Integration 10k] Native: ${durNative.toFixed(2)}ms | Line King: ${durKing.toFixed(2)}ms`);

        // Close editor
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

        // Assertion: Line King should be within 200ms of Native + Overhead
        // (Native is usually ~30ms, Line King ~100ms due to IPC overhead)
        // We just want to ensure it isn't catastrophically slow (> 1 second).
        assert.ok(durKing < 1000, `Line King integration test took too long: ${durKing.toFixed(2)}ms`);
    });
});
