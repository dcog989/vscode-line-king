import * as vscode from 'vscode';
import { COMMANDS } from '../constants.js';
import * as sorter from '../lib/sorter.js';
import { sortCssProperties } from '../lib/css-sorter.js';
import { createCommandFactory } from './factory.js';

/**
 * Registers all sorting-related commands
 * Uses CommandFactory for consistent registration
 */
export function registerSortingCommands(context: vscode.ExtensionContext): void {
    const factory = createCommandFactory(context);

    // All sorting commands expand selection to full lines by default
    factory.registerLineCommands([
        // Basic sorting
        { id: 'lineKing.sort.asc', processor: sorter.sortAsc },
        { id: 'lineKing.sort.asc.insensitive', processor: sorter.sortAscInsensitive },
        { id: 'lineKing.sort.desc', processor: sorter.sortDesc },
        { id: 'lineKing.sort.desc.insensitive', processor: sorter.sortDescInsensitive },

        // Advanced sorting
        { id: 'lineKing.sort.unique', processor: sorter.sortUnique },
        { id: 'lineKing.sort.unique.insensitive', processor: sorter.sortUniqueInsensitive },
        { id: 'lineKing.sort.natural', processor: sorter.sortNatural },
        { id: 'lineKing.sort.length.asc', processor: sorter.sortLengthAsc },
        { id: 'lineKing.sort.length.desc', processor: sorter.sortLengthDesc },
        { id: 'lineKing.sort.reverse', processor: sorter.sortReverse },
        { id: 'lineKing.sort.ip', processor: sorter.sortIP },
        { id: 'lineKing.sort.shuffle', processor: sorter.sortShuffle },
    ], true); // expandSelection: true (process full lines)

    // CSS property sorting (special case - uses custom handler)
    factory.registerAsyncCommand({
        id: COMMANDS.SORT_CSS,
        handler: async (editor) => sortCssProperties(editor)
    });
}
