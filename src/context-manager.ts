import * as vscode from 'vscode';
import { CONTEXT_KEYS, TIMING } from './constants.js';
import { Logger } from './utils/logger.js';

/**
 * PERFORMANCE: visualizer is lazy-loaded to avoid loading it during extension activation
 */
let visualizerModule: typeof import('./lib/visualizer.js') | null = null;
async function getVisualizer(): Promise<typeof import('./lib/visualizer.js')> {
    if (!visualizerModule) {
        visualizerModule = await import('./lib/visualizer.js');
    }
    return visualizerModule;
}

export class ContextManager {
    private context: vscode.ExtensionContext;
    private selectionTimeout: NodeJS.Timeout | undefined;
    private decorationTimeout: NodeJS.Timeout | undefined;
    private disposables: vscode.Disposable[] = [];
    private isDisposed = false;
    private isRegistered = false;

    // Cache to prevent redundant context updates
    private lastIsMultiLine: boolean | undefined;
    private lastAllCharsVisible: boolean | undefined;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public register(): void {
        if (this.isDisposed || this.isRegistered) {
            return;
        }

        this.isRegistered = true;

        // Defer initial update to avoid blocking
        setImmediate(async () => {
            if (!this.isDisposed) {
                await this.update();
            }
        });

        // Register event listeners
        this.disposables.push(
            vscode.window.onDidChangeTextEditorSelection(() => {
                this.scheduleUpdate();
            }),
            vscode.window.onDidChangeActiveTextEditor((editor) => {
                if (!this.isDisposed) {
                    this.scheduleUpdate();
                    if (editor) {
                        this.scheduleDecorationUpdate(editor);
                    }
                }
            }),
            // Update decorations when scrolling
            vscode.window.onDidChangeTextEditorVisibleRanges((e) => {
                if (!this.isDisposed && e.textEditor === vscode.window.activeTextEditor) {
                    this.scheduleDecorationUpdate(e.textEditor);
                }
            }),
            vscode.workspace.onDidChangeTextDocument((e) => {
                if (this.isDisposed) {
                    return;
                }
                const editor = vscode.window.activeTextEditor;
                if (editor && e.document === editor.document) {
                    this.scheduleDecorationUpdate(editor);
                }
            }),
            // Update context when workspace folders change
            vscode.workspace.onDidChangeWorkspaceFolders(() => {
                if (!this.isDisposed) {
                    this.scheduleUpdate();
                }
            }),
            // Update context when configuration changes
            vscode.workspace.onDidChangeConfiguration((e) => {
                if (!this.isDisposed && e.affectsConfiguration('lineKing')) {
                    this.scheduleUpdate();
                }
            }),
        );

        // Register the disposables with the extension context
        this.context.subscriptions.push(...this.disposables);
    }

    private scheduleUpdate(): void {
        if (this.isDisposed) {
            return;
        }

        if (this.selectionTimeout) {
            clearTimeout(this.selectionTimeout);
        }

        this.selectionTimeout = setTimeout(async () => {
            if (!this.isDisposed) {
                await this.update();
            }
        }, TIMING.SELECTION_DEBOUNCE_MS);
    }

    private scheduleDecorationUpdate(editor: vscode.TextEditor): void {
        if (this.isDisposed) {
            return;
        }

        if (this.decorationTimeout) {
            clearTimeout(this.decorationTimeout);
        }

        this.decorationTimeout = setTimeout(async () => {
            if (!this.isDisposed) {
                const visualizer = await getVisualizer();
                visualizer.updateDecorations(editor);
            }
        }, TIMING.DECORATION_DEBOUNCE_MS);
    }

    public dispose(): void {
        if (this.isDisposed) {
            return;
        }

        this.isDisposed = true;

        if (this.selectionTimeout) {
            clearTimeout(this.selectionTimeout);
            this.selectionTimeout = undefined;
        }

        if (this.decorationTimeout) {
            clearTimeout(this.decorationTimeout);
            this.decorationTimeout = undefined;
        }

        // Dispose all registered listeners
        for (const disposable of this.disposables) {
            try {
                disposable.dispose();
            } catch (error) {
                Logger.error('Error disposing listener', error);
            }
        }
        this.disposables = [];
    }

    public async update(): Promise<void> {
        if (this.isDisposed) {
            return;
        }

        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                this.setContext(CONTEXT_KEYS.IS_MULTI_LINE, false);
                this.setContext(CONTEXT_KEYS.ALL_CHARS_VISIBLE, false);
                return;
            }

            const hasMultipleSelections = editor.selections.length > 1;
            const hasMultiLineSelection = editor.selections.some(
                (s) => s.start.line !== s.end.line,
            );
            const isMulti = hasMultipleSelections || hasMultiLineSelection;

            this.setContext(CONTEXT_KEYS.IS_MULTI_LINE, isMulti);

            // Lazy load visualizer for whitespace check
            const visualizer = await getVisualizer();
            const areCharsVisible = visualizer.isWhitespaceCharsVisible();
            this.setContext(CONTEXT_KEYS.ALL_CHARS_VISIBLE, areCharsVisible);
        } catch (error) {
            Logger.error('Failed to update context', error);
        }
    }

    private setContext(key: string, value: boolean): void {
        if (this.isDisposed) {
            return;
        }

        const cacheKey =
            key === CONTEXT_KEYS.IS_MULTI_LINE ? 'lastIsMultiLine' : 'lastAllCharsVisible';
        const lastValue = this[cacheKey as 'lastIsMultiLine' | 'lastAllCharsVisible'];

        if (value !== lastValue) {
            // Use void to explicitly ignore the promise
            void vscode.commands.executeCommand('setContext', key, value);
            this[cacheKey as 'lastIsMultiLine' | 'lastAllCharsVisible'] = value;
        }
    }
}
