import * as vscode from 'vscode';
import { registerCleaningCommands } from './commands/cleaning.js';
import { registerSortingCommands } from './commands/sorting.js';
import { registerTransformationCommands } from './commands/transformation.js';
import { registerUtilityCommands } from './commands/utility.js';

export function registerCommands(
    context: vscode.ExtensionContext,
    updateContextCallback: () => void,
): void {
    registerSortingCommands(context);
    registerCleaningCommands(context);
    registerTransformationCommands(context);
    registerUtilityCommands(context, updateContextCallback);
}
