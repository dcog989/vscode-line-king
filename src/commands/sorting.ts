import * as vscode from 'vscode';
import { COMMANDS } from '../constants.js';
import { createCommandFactory } from './factory.js';

/**
 * Create a lazy proxy for sorter functions
 * This ensures the sorter module is only loaded when actually used
 */
function createLazySorterProxy() {
    let sorterModule: typeof import('../lib/sorter.js') | null = null;

    const loadSorter = async () => {
        if (!sorterModule) {
            sorterModule = await import('../lib/sorter.js');
        }
        return sorterModule;
    };

    return {
        sortAsc: async (...args: Parameters<typeof import('../lib/sorter.js').sortAsc>) => {
            const sorter = await loadSorter();
            return sorter.sortAsc(...args);
        },
        sortAscInsensitive: async (
            ...args: Parameters<typeof import('../lib/sorter.js').sortAscInsensitive>
        ) => {
            const sorter = await loadSorter();
            return sorter.sortAscInsensitive(...args);
        },
        sortDesc: async (...args: Parameters<typeof import('../lib/sorter.js').sortDesc>) => {
            const sorter = await loadSorter();
            return sorter.sortDesc(...args);
        },
        sortDescInsensitive: async (
            ...args: Parameters<typeof import('../lib/sorter.js').sortDescInsensitive>
        ) => {
            const sorter = await loadSorter();
            return sorter.sortDescInsensitive(...args);
        },
        sortUnique: async (...args: Parameters<typeof import('../lib/sorter.js').sortUnique>) => {
            const sorter = await loadSorter();
            return sorter.sortUnique(...args);
        },
        sortUniqueInsensitive: async (
            ...args: Parameters<typeof import('../lib/sorter.js').sortUniqueInsensitive>
        ) => {
            const sorter = await loadSorter();
            return sorter.sortUniqueInsensitive(...args);
        },
        sortNatural: async (...args: Parameters<typeof import('../lib/sorter.js').sortNatural>) => {
            const sorter = await loadSorter();
            return sorter.sortNatural(...args);
        },
        sortLengthAsc: async (
            ...args: Parameters<typeof import('../lib/sorter.js').sortLengthAsc>
        ) => {
            const sorter = await loadSorter();
            return sorter.sortLengthAsc(...args);
        },
        sortLengthDesc: async (
            ...args: Parameters<typeof import('../lib/sorter.js').sortLengthDesc>
        ) => {
            const sorter = await loadSorter();
            return sorter.sortLengthDesc(...args);
        },
        sortReverse: async (...args: Parameters<typeof import('../lib/sorter.js').sortReverse>) => {
            const sorter = await loadSorter();
            return sorter.sortReverse(...args);
        },
        sortIP: async (...args: Parameters<typeof import('../lib/sorter.js').sortIP>) => {
            const sorter = await loadSorter();
            return sorter.sortIP(...args);
        },
        sortShuffle: async (...args: Parameters<typeof import('../lib/sorter.js').sortShuffle>) => {
            const sorter = await loadSorter();
            return sorter.sortShuffle(...args);
        },
    };
}

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
    const lazySorter = createLazySorterProxy();

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
