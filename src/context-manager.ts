import * as vscode from 'vscode';
import { CONTEXT_KEYS } from './constants';
import { isLineEndingsVisible, updateDecorations } from './lib/visualizer';

export class ContextManager {
    private context: vscode.ExtensionContext;
    private selectionTimeout: NodeJS.Timeout | undefined;

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
                    updateDecorations(vscode.window.activeTextEditor);
                }
            })
        );

        // Safety update after delay
        setTimeout(() => this.update(), 100);
    }

    public update(): void {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.commands.executeCommand('setContext', CONTEXT_KEYS.IS_MULTI_LINE, false);
            vscode.commands.executeCommand('setContext', CONTEXT_KEYS.LINE_ENDINGS_VISIBLE, false);
            return;
        }

        const hasMultipleSelections = editor.selections.length > 1;
        const hasMultiLineSelection = editor.selections.some(s => s.start.line !== s.end.line);
        const isMulti = hasMultipleSelections || hasMultiLineSelection;

        vscode.commands.executeCommand('setContext', CONTEXT_KEYS.IS_MULTI_LINE, isMulti);
        vscode.commands.executeCommand('setContext', CONTEXT_KEYS.LINE_ENDINGS_VISIBLE, isLineEndingsVisible());
    }

    private onSelectionChange(e: vscode.TextEditorSelectionChangeEvent): void {
        if (this.selectionTimeout) {
            clearTimeout(this.selectionTimeout);
        }
        this.selectionTimeout = setTimeout(() => {
            this.update();
        }, 50);
    }
}
