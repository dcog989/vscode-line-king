import * as assert from 'assert';
import * as vscode from 'vscode';
import * as cleaner from '../../lib/cleaner';
import * as sorter from '../../lib/sorter';

suite('Line King Test Suite', () => {
    vscode.window.showInformationMessage('Starting Line King Tests');

    test('Sorter: Ascending', () => {
        const input = ['b', 'a', 'c'];
        const expected = ['a', 'b', 'c'];
        assert.deepStrictEqual(sorter.sortAsc(input), expected);
    });

    test('Sorter: Natural', () => {
        const input = ['file10', 'file2', 'file1'];
        const expected = ['file1', 'file2', 'file10'];
        assert.deepStrictEqual(sorter.sortNatural(input), expected);
    });

    test('Cleaner: Remove Blanks', () => {
        const input = ['a', '   ', 'b', '', 'c'];
        const expected = ['a', 'b', 'c'];
        assert.deepStrictEqual(cleaner.removeBlankLines(input), expected);
    });

    test('Cleaner: Remove Duplicates', () => {
        const input = ['a', 'b', 'a', 'c'];
        const expected = ['a', 'b', 'c'];
        assert.deepStrictEqual(cleaner.removeDuplicates(input), expected);
    });

    test('Extension Command Registration', async () => {
        // Just verify commands are registered in VS Code
        const allCommands = await vscode.commands.getCommands(true);
        const kingCommands = allCommands.filter(c => c.startsWith('lineKing.'));
        assert.ok(kingCommands.length > 5, 'Line King commands should be registered');
    });
});
