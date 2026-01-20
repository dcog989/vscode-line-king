import * as vscode from 'vscode';
import { createCommandFactory } from './factory.js';

/**
 * Create a lazy proxy for cleaner functions
 * Ensures the cleaner module is only loaded when actually used
 */
function createLazyCleanerProxy() {
    let cleanerModule: typeof import('../lib/cleaner.js') | null = null;

    const loadCleaner = async () => {
        if (!cleanerModule) {
            cleanerModule = await import('../lib/cleaner.js');
        }
        return cleanerModule;
    };

    return {
        removeBlankLines: async (
            ...args: Parameters<typeof import('../lib/cleaner.js').removeBlankLines>
        ) => {
            const cleaner = await loadCleaner();
            return cleaner.removeBlankLines(...args);
        },
        condenseBlankLines: async (
            ...args: Parameters<typeof import('../lib/cleaner.js').condenseBlankLines>
        ) => {
            const cleaner = await loadCleaner();
            return cleaner.condenseBlankLines(...args);
        },
        removeDuplicateLines: async (
            ...args: Parameters<typeof import('../lib/cleaner.js').removeDuplicateLines>
        ) => {
            const cleaner = await loadCleaner();
            return cleaner.removeDuplicateLines(...args);
        },
        keepOnlyDuplicates: async (
            ...args: Parameters<typeof import('../lib/cleaner.js').keepOnlyDuplicates>
        ) => {
            const cleaner = await loadCleaner();
            return cleaner.keepOnlyDuplicates(...args);
        },
        trimTrailingWhitespace: async (
            ...args: Parameters<typeof import('../lib/cleaner.js').trimTrailingWhitespace>
        ) => {
            const cleaner = await loadCleaner();
            return cleaner.trimTrailingWhitespace(...args);
        },
        trimLeadingWhitespace: async (
            ...args: Parameters<typeof import('../lib/cleaner.js').trimLeadingWhitespace>
        ) => {
            const cleaner = await loadCleaner();
            return cleaner.trimLeadingWhitespace(...args);
        },
        trimBothEnds: async (
            ...args: Parameters<typeof import('../lib/cleaner.js').trimBothEnds>
        ) => {
            const cleaner = await loadCleaner();
            return cleaner.trimBothEnds(...args);
        },
    };
}

/**
 * Registers all cleaning/tidying commands
 * Uses CommandFactory for consistent registration
 *
 * PERFORMANCE CRITICAL: cleaner module is lazy-loaded
 */
export function registerCleaningCommands(context: vscode.ExtensionContext): void {
    const factory = createCommandFactory(context);
    const lazyCleaner = createLazyCleanerProxy();

    // All cleaning commands expand selection to full lines by default
    factory.registerLineCommands(
        [
            // Blank line operations
            { id: 'lineKing.tidy.removeBlank', processor: lazyCleaner.removeBlankLines },
            { id: 'lineKing.tidy.condenseBlank', processor: lazyCleaner.condenseBlankLines },

            // Duplicate operations
            { id: 'lineKing.tidy.removeDuplicates', processor: lazyCleaner.removeDuplicateLines },
            { id: 'lineKing.tidy.keepDuplicates', processor: lazyCleaner.keepOnlyDuplicates },

            // Whitespace trimming
            { id: 'lineKing.tidy.trimTrailing', processor: lazyCleaner.trimTrailingWhitespace },
            { id: 'lineKing.tidy.trimLeading', processor: lazyCleaner.trimLeadingWhitespace },
            { id: 'lineKing.tidy.trimBoth', processor: lazyCleaner.trimBothEnds },
        ],
        true,
    ); // expandSelection: true (process full lines)
}
