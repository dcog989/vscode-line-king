import * as vscode from 'vscode';
import { COMMANDS } from '../constants.js';
import { toggleWhitespaceChars } from '../lib/visualizer.js';
import { createCommandFactory } from './factory.js';

/**
 * Registers utility commands (EOL conversion, whitespace visualization, debug)
 * Uses CommandFactory for consistent registration
 */
export function registerUtilityCommands(context: vscode.ExtensionContext, updateContextCallback: () => void): void {
    const factory = createCommandFactory(context);

    // EOL conversion commands
    factory.registerAsyncCommands([
        {
            id: COMMANDS.CONVERT_LF,
            handler: async (editor) => {
                await editor.edit(eb => eb.setEndOfLine(vscode.EndOfLine.LF));
            }
        },
        {
            id: COMMANDS.CONVERT_CRLF,
            handler: async (editor) => {
                await editor.edit(eb => eb.setEndOfLine(vscode.EndOfLine.CRLF));
            }
        }
    ]);

    // Whitespace visualization (non-editor commands)
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMANDS.SHOW_ALL_CHARS, () => {
            toggleWhitespaceChars(true);
            updateContextCallback();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(COMMANDS.HIDE_ALL_CHARS, () => {
            toggleWhitespaceChars(false);
            updateContextCallback();
        })
    );

    // Debug command
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMANDS.DEBUG_CONTEXT, () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage('No active editor');
                return;
            }
            vscode.window.showInformationMessage('Context Debug: See Debug Console for details (Functionality moved to simplified view)');
        })
    );
}
