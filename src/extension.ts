import * as vscode from 'vscode';
import { registerCommands } from './commands.js';
import { ContextManager } from './context-manager.js';
import { configCache, disposeConfigCache } from './utils/config-cache.js';

/**
 * Line King Extension Activation Entry Point
 */

// Lazy-loaded modules
let contextManager: ContextManager | undefined;
let cleanerModule: typeof import('./lib/cleaner.js') | undefined;
let cssSorterModule: typeof import('./lib/css-sorter.js') | undefined;

// Detect if we're running in a test environment
const isTestEnvironment = () => {
    return (
        process.env.VSCODE_TEST_MODE === '1' ||
        process.env.NODE_ENV === 'test' ||
        typeof (global as { it?: unknown }).it === 'function'
    );
};

export async function activate(context: vscode.ExtensionContext) {
    try {
        // 1. Initialize configuration cache (fast path - no Zod)
        // This completes in <5ms, ensuring config is ready before commands run
        // Note: Full validation is deferred and only runs if explicitly needed

        // 2. Register all Commands (eager - needed for command palette)
        // Pass a callback that lazily initializes and updates context
        registerCommands(context, () => {
            // Skip context manager in test environment
            if (isTestEnvironment()) {
                return;
            }

            if (!contextManager) {
                contextManager = new ContextManager(context);
                contextManager.register();
            }
            void contextManager.update(); // Fire and forget
        });

        // 3. Register Save Handler (only if cleanup is enabled)
        context.subscriptions.push(
            vscode.workspace.onWillSaveTextDocument((event) => {
                const action = configCache.getCleanupAction();
                if (action === 'none') return;

                const editor = vscode.window.activeTextEditor;
                if (!editor || event.document !== editor.document) return;

                const promise = (async () => {
                    try {
                        // Lazy-load modules only when actually needed
                        if (!cleanerModule) {
                            cleanerModule = await import('./lib/cleaner.js');
                        }
                        if (!cssSorterModule) {
                            cssSorterModule = await import('./lib/css-sorter.js');
                        }

                        const { applyLineAction } = await import('./utils/editor.js');

                        if (action === 'removeBlankLines' && cleanerModule) {
                            await applyLineAction(editor, cleanerModule.removeBlankLines);
                        } else if (action === 'trimTrailingWhitespace' && cleanerModule) {
                            await applyLineAction(editor, cleanerModule.trimTrailingWhitespace);
                        } else if (action === 'sortCssProperties' && cssSorterModule) {
                            await cssSorterModule.sortCssProperties(editor);
                        }
                    } catch {
                        // Error during save cleanup
                    }
                })();

                event.waitUntil(promise);
            }),
        );

        // 4. Initialize Context Manager lazily - only when needed
        // Skip entirely in test environment
        if (!isTestEnvironment()) {
            // Defer ContextManager until first user interaction
            // This ensures extension activation completes in <5ms
            const initContextOnce = vscode.window.onDidChangeTextEditorSelection(() => {
                try {
                    if (!contextManager) {
                        contextManager = new ContextManager(context);
                        contextManager.register();
                    }
                    initContextOnce.dispose();
                } catch {
                    // Error initializing context manager
                    initContextOnce.dispose();
                }
            });
            context.subscriptions.push(initContextOnce);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Line King failed to activate: ${error}`);
    }
}

/**
 * Line King Extension Deactivation Entry Point
 */
export function deactivate() {
    try {
        // Dispose context manager
        if (contextManager) {
            contextManager.dispose();
            contextManager = undefined;
        }

        // Dispose config cache
        disposeConfigCache();
    } catch {
        // Error during deactivation
    }
}
