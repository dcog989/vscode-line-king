import * as vscode from 'vscode';
import * as cleaner from '../lib/cleaner.js';
import { createCommandFactory } from './factory.js';

/**
 * Registers all cleaning/tidying commands
 * Uses CommandFactory for consistent registration
 */
export function registerCleaningCommands(context: vscode.ExtensionContext): void {
    const factory = createCommandFactory(context);

    // All cleaning commands expand selection to full lines by default
    factory.registerLineCommands([
        // Blank line operations
        { id: 'lineKing.tidy.removeBlank', processor: cleaner.removeBlankLines },
        { id: 'lineKing.tidy.condenseBlank', processor: cleaner.condenseBlankLines },

        // Duplicate operations
        { id: 'lineKing.tidy.removeDuplicates', processor: cleaner.removeDuplicateLines },
        { id: 'lineKing.tidy.keepDuplicates', processor: cleaner.keepOnlyDuplicates },

        // Whitespace operations
        { id: 'lineKing.tidy.trimTrailing', processor: cleaner.trimTrailingWhitespace },
        { id: 'lineKing.tidy.trimLeading', processor: cleaner.trimLeadingWhitespace },
        { id: 'lineKing.tidy.trimBoth', processor: cleaner.trimBothWhitespace },
    ], true); // expandSelection: true (process full lines)
}
