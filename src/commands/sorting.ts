import * as vscode from 'vscode';
import { COMMANDS } from '../constants.js';
import { createCommandFactory } from './factory.js';
import { createLazyProxy } from '../utils/lazy-proxy.js';

/**
 * Registers all sorting-related commands
 * Uses CommandFactory for consistent registration
 *
 * PERFORMANCE CRITICAL: All dependencies are lazy-loaded
 * - sorter.js is only loaded when a sort command is used
 * - css-sorter.js (and PostCSS) only loaded when CSS sorting is used
 */
export function registerSortingCommands(context: vscode.ExtensionContext): void {
    const factory = createCommandFactory(context);
    const lazySorter = createLazyProxy<typeof import('../lib/sorter.js')>('../lib/sorter.js');

    // All sorting commands expand selection to full lines by default
    factory.registerLineCommands(
        [
            // Basic sorting
            { id: 'lineKing.sort.asc', processor: lazySorter.sortAsc },
            { id: 'lineKing.sort.asc.insensitive', processor: lazySorter.sortAscInsensitive },
            { id: 'lineKing.sort.desc', processor: lazySorter.sortDesc },
            { id: 'lineKing.sort.desc.insensitive', processor: lazySorter.sortDescInsensitive },

            // Advanced sorting
            { id: 'lineKing.sort.unique', processor: lazySorter.sortUnique },
            { id: 'lineKing.sort.unique.insensitive', processor: lazySorter.sortUniqueInsensitive },
            { id: 'lineKing.sort.natural', processor: lazySorter.sortNatural },
            { id: 'lineKing.sort.length.asc', processor: lazySorter.sortLengthAsc },
            { id: 'lineKing.sort.length.desc', processor: lazySorter.sortLengthDesc },
            { id: 'lineKing.sort.reverse', processor: lazySorter.sortReverse },
            { id: 'lineKing.sort.ip', processor: lazySorter.sortIP },
            { id: 'lineKing.sort.shuffle', processor: lazySorter.sortShuffle },
        ],
        true,
    ); // expandSelection: true (process full lines)

    // CSS property sorting (special case - uses custom handler with lazy loading)
    factory.registerAsyncCommand({
        id: COMMANDS.SORT_CSS,
        handler: async (editor) => {
            // Lazy load CSS sorter (which will then lazy load PostCSS)
            const { sortCssProperties } = await import('../lib/css-sorter.js');
            return sortCssProperties(editor);
        },
    });
}
