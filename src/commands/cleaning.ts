import * as vscode from 'vscode';
import { createCommandFactory } from './factory.js';
import * as cleaner from '../lib/cleaner.js';

/**
 * Registers all cleaning/tidying commands
 */
export function registerCleaningCommands(context: vscode.ExtensionContext): void {
    const factory = createCommandFactory(context);

    factory.registerLineCommands(
        [
            { id: 'lineKing.tidy.removeBlank', processor: cleaner.removeBlankLines },
            { id: 'lineKing.tidy.condenseBlank', processor: cleaner.condenseBlankLines },
            { id: 'lineKing.tidy.removeDuplicates', processor: cleaner.removeDuplicateLines },
            { id: 'lineKing.tidy.keepDuplicates', processor: cleaner.keepOnlyDuplicates },
            { id: 'lineKing.tidy.trimTrailing', processor: cleaner.trimTrailingWhitespace },
            { id: 'lineKing.tidy.trimLeading', processor: cleaner.trimLeadingWhitespace },
            { id: 'lineKing.tidy.trimBoth', processor: cleaner.trimBothEnds },
        ],
        true,
    );
}
