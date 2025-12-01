import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { CONFIG } from './constants';
import { ContextManager } from './context-manager';
import { configCache, disposeConfigCache } from './utils/config-cache';

// Lazy-loaded modules
let contextManager: ContextManager | undefined;
let cleanerModule: typeof import('./lib/cleaner') | undefined;
let cssSorterModule: typeof import('./lib/css-sorter') | undefined;

export function activate(context: vscode.ExtensionContext) {

    // 1. Register all Commands (eager - needed for command palette)
    // Pass a callback that lazily initializes and updates context
    registerCommands(context, () => {
        if (!contextManager) {
            contextManager = new ContextManager(context);
            contextManager.register();
        }
        contextManager.update();
    });

    // 2. Register Save Handler (only if cleanup is enabled)
    // This checks config dynamically, so it's always registered but does nothing if config is 'none'
    context.subscriptions.push(vscode.workspace.onWillSaveTextDocument(event => {
        const action = configCache.get<string>(CONFIG.CLEANUP_ON_SAVE, 'none');
        if (action === 'none') return;

        const editor = vscode.window.activeTextEditor;
        if (!editor || event.document !== editor.document) return;

        const promise = (async () => {
            // Lazy-load modules only when actually needed
            if (!cleanerModule) {
                cleanerModule = await import('./lib/cleaner');
            }
            if (!cssSorterModule) {
                cssSorterModule = await import('./lib/css-sorter');
            }

            const { applyLineAction } = await import('./utils/editor');

            if (action === 'removeBlankLines') {
                await applyLineAction(editor, cleanerModule.removeBlankLines);
            } else if (action === 'trimTrailingWhitespace') {
                await applyLineAction(editor, cleanerModule.trimTrailingWhitespace);
            } else if (action === 'sortCssProperties') {
                await cssSorterModule.sortCssProperties(editor);
            }
        })();

        event.waitUntil(promise);
    }));

    // 3. Initialize Context Manager on first editor interaction
    // This ensures multi-line detection works without manual command invocation
    const initContextOnce = vscode.window.onDidChangeActiveTextEditor(() => {
        if (!contextManager) {
            contextManager = new ContextManager(context);
            contextManager.register();
        }
        initContextOnce.dispose();
    });
    context.subscriptions.push(initContextOnce);

    // Also initialize if there's already an active editor
    if (vscode.window.activeTextEditor && !contextManager) {
        contextManager = new ContextManager(context);
        contextManager.register();
    }
}

export function deactivate() {
    disposeConfigCache();
}
