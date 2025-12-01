import * as vscode from 'vscode';
import { CONTEXT_KEYS, TIMING } from './constants';
import { iswhitespaceCharsVisible, updateDecorations } from './lib/visualizer';

export class ContextManager {
    private context: vscode.ExtensionContext;
    private selectionTimeout: NodeJS.Timeout | undefined;
    private decorationTimeout: NodeJS.Timeout | undefined;

    // Cache to prevent redundant context updates
    private lastIsMultiLine: boolean | undefined;
    private lastAllCharsVisible: boolean | undefined;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public register(): void {
        // Initial update
        this.update();

        // Register event listeners
        this.context.subscriptions.push(
            vscode.window.onDidChangeTextEditorSelection(e => this.onSelectionChange(e)),
            vscode.window.onDidChangeActiveTextEditor(editor => {
                this.update();
                updateDecorations(editor);
            }),
            // Update decorations when scrolling
            vscode.window.onDidChangeTextEditorVisibleRanges(e => {
                if (e.textEditor === vscode.window.activeTextEditor) {
                    updateDecorations(e.textEditor);
                }
            }),
            vscode.workspace.onDidChangeTextDocument(e => {
                if (vscode.window.activeTextEditor && e.document === vscode.window.activeTextEditor.document) {
                    // Debounce decoration updates during typing
                    this.scheduleDecorationUpdate(vscode.window.activeTextEditor);
                }
            }),
            // Cleanup on disposal
            { dispose: () => this.dispose() }
        );

        // Safety update after delay
        setTimeout(() => this.update(), TIMING.CONTEXT_INIT_DELAY_MS);
    }

    private scheduleDecorationUpdate(editor: vscode.TextEditor): void {
        if (this.decorationTimeout) {
            clearTimeout(this.decorationTimeout);
        }
        this.decorationTimeout = setTimeout(() => {
            updateDecorations(editor);
        }, TIMING.DECORATION_DEBOUNCE_MS);
    }

    private dispose(): void {
        if (this.selectionTimeout) {
            clearTimeout(this.selectionTimeout);
            this.selectionTimeout = undefined;
        }
        if (this.decorationTimeout) {
            clearTimeout(this.decorationTimeout);
            this.decorationTimeout = undefined;
        }
    }

    public update(): void {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            if (this.lastIsMultiLine !== false) {
                vscode.commands.executeCommand('setContext', CONTEXT_KEYS.IS_MULTI_LINE, false);
                this.lastIsMultiLine = false;
            }
            if (this.lastAllCharsVisible !== false) {
                vscode.commands.executeCommand('setContext', CONTEXT_KEYS.ALL_CHARS_VISIBLE, false);
                this.lastAllCharsVisible = false;
            }
            return;
        }

        const hasMultipleSelections = editor.selections.length > 1;
        const hasMultiLineSelection = editor.selections.some(s => s.start.line !== s.end.line);
        const isMulti = hasMultipleSelections || hasMultiLineSelection;

        if (isMulti !== this.lastIsMultiLine) {
            vscode.commands.executeCommand('setContext', CONTEXT_KEYS.IS_MULTI_LINE, isMulti);
            this.lastIsMultiLine = isMulti;
        }

        const areCharsVisible = iswhitespaceCharsVisible();
        if (areCharsVisible !== this.lastAllCharsVisible) {
            vscode.commands.executeCommand('setContext', CONTEXT_KEYS.ALL_CHARS_VISIBLE, areCharsVisible);
            this.lastAllCharsVisible = areCharsVisible;
        }
    }

    private onSelectionChange(e: vscode.TextEditorSelectionChangeEvent): void {
        if (this.selectionTimeout) {
            clearTimeout(this.selectionTimeout);
        }
        this.selectionTimeout = setTimeout(() => {
            this.update();
            this.selectionTimeout = undefined;
        }, TIMING.SELECTION_DEBOUNCE_MS);
    }
}
