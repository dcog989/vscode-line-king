import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { CONFIG } from './constants';
import { ContextManager } from './context-manager';
import * as cleaner from './lib/cleaner';
import { sortCssProperties } from './lib/css-sorter';
import { applyLineAction } from './utils/editor';
import { configCache, disposeConfigCache } from './utils/config-cache';

export function activate(context: vscode.ExtensionContext) {

    // 1. Initialize Context Manager (Handles events, keys, visualizer)
    const contextManager = new ContextManager(context);
    contextManager.register();

    // 2. Register all Commands
    // Pass the update callback so commands can force a context refresh if needed
    registerCommands(context, () => contextManager.update());

    // 3. Register Save Handler
    context.subscriptions.push(vscode.workspace.onWillSaveTextDocument(event => {
        const action = configCache.get<string>(CONFIG.CLEANUP_ON_SAVE, 'none');
        const editor = vscode.window.activeTextEditor;

        if (!editor || event.document !== editor.document || action === 'none') return;

        const promise = (async () => {
            if (action === 'removeBlankLines') await applyLineAction(editor, cleaner.removeBlankLines);
            else if (action === 'trimTrailingWhitespace') await applyLineAction(editor, cleaner.trimTrailingWhitespace);
            else if (action === 'sortCssProperties') await sortCssProperties(editor);
        })();

        event.waitUntil(promise);
    }));
}

export function deactivate() {
    disposeConfigCache();
}
