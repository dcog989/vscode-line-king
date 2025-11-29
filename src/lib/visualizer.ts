import * as vscode from 'vscode';
import { LINE_ENDINGS } from '../constants';

class LineEndingVisualizer {
    private lfDecoration: vscode.TextEditorDecorationType | undefined;
    private crlfDecoration: vscode.TextEditorDecorationType | undefined;
    private _isEnabled = false;

    public get isEnabled(): boolean {
        return this._isEnabled;
    }

    /**
     * Toggles visibility state
     */
    public toggle(forceState?: boolean): void {
        this._isEnabled = forceState !== undefined ? forceState : !this._isEnabled;

        if (this._isEnabled) {
            this.update(vscode.window.activeTextEditor);
            vscode.window.showInformationMessage('Line Endings: Visible');
        } else {
            this.clear();
            vscode.window.showInformationMessage('Line Endings: Hidden');
        }
    }

    /**
     * Updates decorations for the specific editor based on visible ranges
     */
    public update(editor: vscode.TextEditor | undefined): void {
        if (!editor || !this._isEnabled) {
            if (!this._isEnabled) {
                this.clear();
            }
            return;
        }

        this.initDecorations();

        const lfRanges: vscode.Range[] = [];
        const crlfRanges: vscode.Range[] = [];
        const document = editor.document;
        const lastLineIndex = document.lineCount - 1;

        // Optimization: Only process lines that are currently visible to the user
        for (const visibleRange of editor.visibleRanges) {
            for (let i = visibleRange.start.line; i <= Math.min(visibleRange.end.line, lastLineIndex); i++) {
                const line = document.lineAt(i);
                const endPos = line.range.end;
                const decorationRange = new vscode.Range(endPos, endPos);

                // Detect line ending type
                if (i < lastLineIndex) {
                    const nextLineStart = new vscode.Position(i + 1, 0);
                    const lineEndOffset = document.offsetAt(nextLineStart) - document.offsetAt(line.range.end);

                    if (lineEndOffset === LINE_ENDINGS.CRLF_BYTE_LENGTH) {
                        crlfRanges.push(decorationRange);
                    } else if (lineEndOffset === LINE_ENDINGS.LF_BYTE_LENGTH) {
                        lfRanges.push(decorationRange);
                    }
                } else {
                    // Last line - check if it has a line ending
                    const lineEndPos = document.offsetAt(line.range.end);
                    const docEndPos = document.offsetAt(new vscode.Position(lastLineIndex + 1, 0));
                    const lineEndOffset = docEndPos - lineEndPos;
                    
                    if (lineEndOffset === LINE_ENDINGS.CRLF_BYTE_LENGTH) {
                        crlfRanges.push(decorationRange);
                    } else if (lineEndOffset === LINE_ENDINGS.LF_BYTE_LENGTH) {
                        lfRanges.push(decorationRange);
                    }
                    // If lineEndOffset === 0, no line ending on last line (don't decorate)
                }
            }
        }

        if (this.lfDecoration) editor.setDecorations(this.lfDecoration, lfRanges);
        if (this.crlfDecoration) editor.setDecorations(this.crlfDecoration, crlfRanges);
    }

    private clear(): void {
        const editors = vscode.window.visibleTextEditors;
        for (const editor of editors) {
            if (this.lfDecoration) editor.setDecorations(this.lfDecoration, []);
            if (this.crlfDecoration) editor.setDecorations(this.crlfDecoration, []);
        }
    }

    private initDecorations(): void {
        if (this.lfDecoration && this.crlfDecoration) return;

        const color = new vscode.ThemeColor('editorCodeLens.foreground');
        const options = (text: string): vscode.DecorationRenderOptions => ({
            after: {
                contentText: text,
                color: color,
                margin: '0 0 0 3px',
                fontWeight: 'bold'
            }
        });

        this.lfDecoration = vscode.window.createTextEditorDecorationType(options('↓'));
        this.crlfDecoration = vscode.window.createTextEditorDecorationType(options('↵'));
    }
}

// Export Singleton Instance
export const visualizer = new LineEndingVisualizer();

// --- Export Wrappers for Compatibility ---
export function isLineEndingsVisible(): boolean {
    return visualizer.isEnabled;
}

export function toggleLineEndings(forceState?: boolean): void {
    visualizer.toggle(forceState);
}

export function updateDecorations(editor: vscode.TextEditor | undefined): void {
    visualizer.update(editor);
}
