import * as vscode from 'vscode';
import { COMMANDS } from '../constants.js';
import { createCommandFactory } from './factory.js';

/**
 * Registers utility commands (EOL conversion, whitespace visualization, debug)
 * Uses CommandFactory for consistent registration
 *
 * PERFORMANCE CRITICAL: visualizer module is lazy-loaded
 */
export function registerUtilityCommands(
    context: vscode.ExtensionContext,
    updateContextCallback: () => void,
): void {
    const factory = createCommandFactory(context);

    // EOL conversion commands (no heavy dependencies)
    factory.registerAsyncCommands([
        {
            id: COMMANDS.CONVERT_LF,
            handler: async (editor) => {
                await editor.edit((eb) => eb.setEndOfLine(vscode.EndOfLine.LF));
            },
        },
        {
            id: COMMANDS.CONVERT_CRLF,
            handler: async (editor) => {
                await editor.edit((eb) => eb.setEndOfLine(vscode.EndOfLine.CRLF));
            },
        },
    ]);

    // Whitespace visualization (non-editor commands) - lazy load visualizer
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMANDS.SHOW_ALL_CHARS, async () => {
            const { toggleWhitespaceChars } = await import('../lib/visualizer.js');
            toggleWhitespaceChars(true);
            updateContextCallback();
        }),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(COMMANDS.HIDE_ALL_CHARS, async () => {
            const { toggleWhitespaceChars } = await import('../lib/visualizer.js');
            toggleWhitespaceChars(false);
            updateContextCallback();
        }),
    );

    // Debug command (no dependencies)
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMANDS.DEBUG_CONTEXT, () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage('No active editor');
                return;
            }
            vscode.window.showInformationMessage(
                'Context Debug: See Debug Console for details (Functionality moved to simplified view)',
            );
        }),
    );
}
