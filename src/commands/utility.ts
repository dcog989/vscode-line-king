import * as vscode from 'vscode';
import { COMMANDS } from '../constants.js';
import { createCommandFactory } from './factory.js';
import { createLazyProxy } from '../utils/lazy-proxy.js';

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
    const lazyVisualizer =
        createLazyProxy<typeof import('../lib/visualizer.js')>('../lib/visualizer.js');

    // EOL conversion commands (no heavy dependencies)
    factory.registerAsyncCommands([
        {
            id: COMMANDS.CONVERT_LF,
            handler: async (editor): Promise<void> => {
                await editor.edit((eb) => eb.setEndOfLine(vscode.EndOfLine.LF));
            },
        },
        {
            id: COMMANDS.CONVERT_CRLF,
            handler: async (editor): Promise<void> => {
                await editor.edit((eb) => eb.setEndOfLine(vscode.EndOfLine.CRLF));
            },
        },
    ]);

    // Whitespace visualization (non-editor commands) - lazy load visualizer
    factory.registerAsyncCommands([
        {
            id: COMMANDS.SHOW_ALL_CHARS,
            handler: async (): Promise<void> => {
                await lazyVisualizer.toggleWhitespaceChars(true);
                updateContextCallback();
            },
        },
        {
            id: COMMANDS.HIDE_ALL_CHARS,
            handler: async (): Promise<void> => {
                await lazyVisualizer.toggleWhitespaceChars(false);
                updateContextCallback();
            },
        },
    ]);

    // Debug command (no dependencies)
    factory.registerAsyncCommand({
        id: COMMANDS.DEBUG_CONTEXT,
        handler: (): void => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage('No active editor');
                return;
            }
            vscode.window.showInformationMessage(
                'Context Debug: See Debug Console for details (Functionality moved to simplified view)',
            );
        },
    });
}
