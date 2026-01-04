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
    return process.env.VSCODE_TEST_MODE === '1' || 
           process.env.NODE_ENV === 'test' ||
           typeof (global as any).it === 'function';
};

export async function activate(context: vscode.ExtensionContext) {
    try {
        console.log('[Line King] Starting activation...');

        // 1. Validate configuration on startup (for user feedback)
        // Await to ensure cache is populated before any commands run
        await configCache.validateAll();

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
            contextManager.update();
        });

        // 3. Register Save Handler (only if cleanup is enabled)
        context.subscriptions.push(vscode.workspace.onWillSaveTextDocument(event => {
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
                } catch (error) {
                    console.error('[Line King] Error during save cleanup:', error);
                }
            })();

            event.waitUntil(promise);
        }));

        // 4. Initialize Context Manager lazily - only when needed
        // Skip entirely in test environment
        if (!isTestEnvironment()) {
            const initContextOnce = vscode.window.onDidChangeActiveTextEditor(() => {
                try {
                    if (!contextManager) {
                        console.log('[Line King] Initializing context manager on editor change...');
                        contextManager = new ContextManager(context);
                        contextManager.register();
                    }
                    initContextOnce.dispose();
                } catch (error) {
                    console.error('[Line King] Error initializing context manager:', error);
                    initContextOnce.dispose();
                }
            });
            context.subscriptions.push(initContextOnce);

            // Also initialize if there's already an active editor, but defer it
            if (vscode.window.activeTextEditor) {
                setTimeout(() => {
                    try {
                        if (!contextManager) {
                            console.log('[Line King] Initializing context manager for active editor...');
                            contextManager = new ContextManager(context);
                            contextManager.register();
                        }
                    } catch (error) {
                        console.error('[Line King] Error initializing context manager on activation:', error);
                    }
                }, 500);
            }
        } else {
            console.log('[Line King] Running in test environment - skipping context manager initialization');
        }

        console.log('[Line King] Extension activated successfully');
    } catch (error) {
        console.error('[Line King] Error during activation:', error);
        vscode.window.showErrorMessage(`Line King failed to activate: ${error}`);
    }
}

/**
 * Line King Extension Deactivation Entry Point
 */
export function deactivate() {
    try {
        console.log('[Line King] Starting deactivation...');
        
        // Dispose context manager
        if (contextManager) {
            contextManager.dispose();
            contextManager = undefined;
        }
        
        // Dispose config cache
        disposeConfigCache();
        
        console.log('[Line King] Extension deactivated successfully');
    } catch (error) {
        console.error('[Line King] Error during deactivation:', error);
    }
}
