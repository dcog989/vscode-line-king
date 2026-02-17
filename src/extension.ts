import * as vscode from 'vscode';
import { registerCommands } from './commands.js';
import { ContextManager } from './context-manager.js';
import { configCache, disposeConfigCache } from './utils/config-cache.js';
import { Logger } from './utils/Logger.js';

let contextManager: ContextManager | undefined;

const isTestEnvironment = (): boolean => {
    return (
        process.env.VSCODE_TEST_MODE === '1' ||
        process.env.NODE_ENV === 'test' ||
        typeof (global as { it?: unknown }).it === 'function'
    );
};

const startupMetrics = {
    startTime: 0,
    loggerInit: 0,
    commandsRegistered: 0,
    saveHandlerRegistered: 0,
    contextDeferred: 0,
    total: 0,
};

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    startupMetrics.startTime = performance.now();

    Logger.initialize(context);
    startupMetrics.loggerInit = performance.now();

    try {
        await configCache.initialize();

        registerCommands(context, () => {
            if (isTestEnvironment()) {
                return;
            }

            if (contextManager) {
                void contextManager.update();
            }
        });
        startupMetrics.commandsRegistered = performance.now();

        context.subscriptions.push(
            vscode.workspace.onWillSaveTextDocument((event) => {
                const action = configCache.getCleanupAction();
                if (action === 'none') return;

                const editor = vscode.window.activeTextEditor;
                if (!editor || event.document !== editor.document) return;

                const promise = (async () => {
                    try {
                        const cleanerModule = await import('./lib/cleaner.js');
                        const cssSorterModule = await import('./lib/css-sorter.js');

                        const { applyLineAction } = await import('./utils/editor.js');

                        if (action === 'removeBlankLines') {
                            await applyLineAction(editor, cleanerModule.removeBlankLines);
                        } else if (action === 'trimTrailingWhitespace') {
                            await applyLineAction(editor, cleanerModule.trimTrailingWhitespace);
                        } else if (action === 'sortCssProperties') {
                            await cssSorterModule.sortCssProperties(editor);
                        }
                    } catch (e) {
                        Logger.error('Error during save cleanup', e);
                    }
                })();

                event.waitUntil(promise);
            }),
        );
        startupMetrics.saveHandlerRegistered = performance.now();

        if (!isTestEnvironment()) {
            const initContextOnce = vscode.window.onDidChangeTextEditorSelection(() => {
                try {
                    if (!contextManager) {
                        contextManager = new ContextManager(context);
                        contextManager.register();
                    }
                    initContextOnce.dispose();
                } catch (e) {
                    Logger.error('Error initializing context manager', e);
                    initContextOnce.dispose();
                }
            });
            context.subscriptions.push(initContextOnce);
        }
        startupMetrics.contextDeferred = performance.now();

        startupMetrics.total = performance.now() - startupMetrics.startTime;

        if (process.env.VSCODE_BENCHMARK_MODE === '1') {
            // eslint-disable-next-line no-console
            console.log('STARTUP_METRICS:', JSON.stringify(startupMetrics));
            const fs = await import('node:fs');
            const path = await import('node:path');
            const resultsPath = path.join(
                context.extensionPath,
                '.benchmark-results',
                'metrics.json',
            );
            try {
                fs.writeFileSync(resultsPath, JSON.stringify(startupMetrics, null, 2));
            } catch {
                // Ignore write errors
            }
        }
    } catch (error) {
        Logger.error('Activation failed', error);
        vscode.window.showErrorMessage(`Line King failed to activate: ${error}`);
    }
}

export function deactivate(): void {
    try {
        if (contextManager) {
            contextManager.dispose();
            contextManager = undefined;
        }

        disposeConfigCache();
    } catch (e) {
        Logger.error('Error during deactivation', e);
    }
}
