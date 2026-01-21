import * as vscode from 'vscode';
import { createCommandFactory } from './factory.js';
import { createLazyProxy } from '../utils/lazy-proxy.js';

/**
 * Registers all cleaning/tidying commands
 * Uses CommandFactory for consistent registration
 *
 * PERFORMANCE CRITICAL: cleaner module is lazy-loaded
 */
export function registerCleaningCommands(context: vscode.ExtensionContext): void {
    const factory = createCommandFactory(context);
    const lazyCleaner = createLazyProxy<typeof import('../lib/cleaner.js')>('../lib/cleaner.js');

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
