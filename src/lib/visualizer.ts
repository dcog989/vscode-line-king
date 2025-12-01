import * as vscode from 'vscode';
import { LINE_ENDINGS } from '../constants';

class WhitespaceCharsVisualizer {
    private lfDecoration: vscode.TextEditorDecorationType | undefined;
    private crlfDecoration: vscode.TextEditorDecorationType | undefined;
    private spaceDecoration: vscode.TextEditorDecorationType | undefined;
    private tabDecoration: vscode.TextEditorDecorationType | undefined;
    private _isEnabled = false;

    public get isEnabled(): boolean {
        return this._isEnabled;
    }

    /**
     * Toggles visibility state
     */
    public toggle(forceState?: boolean): void {
        const previousState = this._isEnabled;
        this._isEnabled = forceState !== undefined ? forceState : !this._isEnabled;

        if (this._isEnabled) {
            this.update(vscode.window.activeTextEditor);
            vscode.window.showInformationMessage('Whitespace Characters: Visible');
        } else {
            // Only clear if we were previously enabled
            if (previousState) {
                this.clear();
            }
            vscode.window.showInformationMessage('Whitespace Characters: Hidden');
        }
    }

    /**
     * Updates decorations for the specific editor based on visible ranges
     */
    public update(editor: vscode.TextEditor | undefined): void {
        if (!editor || !this._isEnabled) {
            return;
        }

        this.initDecorations();

        const lfRanges: vscode.Range[] = [];
        const crlfRanges: vscode.Range[] = [];
        const spaceRanges: vscode.Range[] = [];
        const tabRanges: vscode.Range[] = [];
        const document = editor.document;
        const lastLineIndex = document.lineCount - 1;

        // Optimization: Only process lines that are currently visible to the user
        for (const visibleRange of editor.visibleRanges) {
            for (let i = visibleRange.start.line; i <= Math.min(visibleRange.end.line, lastLineIndex); i++) {
                const line = document.lineAt(i);
                const lineText = line.text;
                const endPos = line.range.end;
                const lineEndDecorationRange = new vscode.Range(endPos, endPos);

                // Detect spaces and tabs in the line
                for (let charIndex = 0; charIndex < lineText.length; charIndex++) {
                    const char = lineText[charIndex];
                    if (char === ' ') {
                        const pos = new vscode.Position(i, charIndex);
                        spaceRanges.push(new vscode.Range(pos, pos));
                    } else if (char === '\t') {
                        const pos = new vscode.Position(i, charIndex);
                        tabRanges.push(new vscode.Range(pos, pos));
                    }
                }

                // Detect line ending type
                if (i < lastLineIndex) {
                    const nextLineStart = new vscode.Position(i + 1, 0);
                    const lineEndOffset = document.offsetAt(nextLineStart) - document.offsetAt(line.range.end);

                    if (lineEndOffset === LINE_ENDINGS.CRLF_BYTE_LENGTH) {
                        crlfRanges.push(lineEndDecorationRange);
                    } else if (lineEndOffset === LINE_ENDINGS.LF_BYTE_LENGTH) {
                        lfRanges.push(lineEndDecorationRange);
                    }
                } else {
                    // Last line - check if it has a line ending
                    const lineEndPos = document.offsetAt(line.range.end);
                    const docEndPos = document.offsetAt(new vscode.Position(lastLineIndex + 1, 0));
                    const lineEndOffset = docEndPos - lineEndPos;

                    if (lineEndOffset === LINE_ENDINGS.CRLF_BYTE_LENGTH) {
                        crlfRanges.push(lineEndDecorationRange);
                    } else if (lineEndOffset === LINE_ENDINGS.LF_BYTE_LENGTH) {
                        lfRanges.push(lineEndDecorationRange);
                    }
                }
            }
        }

        if (this.lfDecoration) editor.setDecorations(this.lfDecoration, lfRanges);
        if (this.crlfDecoration) editor.setDecorations(this.crlfDecoration, crlfRanges);
        if (this.spaceDecoration) editor.setDecorations(this.spaceDecoration, spaceRanges);
        if (this.tabDecoration) editor.setDecorations(this.tabDecoration, tabRanges);
    }

    private clear(): void {
        const editors = vscode.window.visibleTextEditors;
        for (const editor of editors) {
            if (this.lfDecoration) editor.setDecorations(this.lfDecoration, []);
            if (this.crlfDecoration) editor.setDecorations(this.crlfDecoration, []);
            if (this.spaceDecoration) editor.setDecorations(this.spaceDecoration, []);
            if (this.tabDecoration) editor.setDecorations(this.tabDecoration, []);
        }
    }

    private initDecorations(): void {
        if (this.lfDecoration && this.crlfDecoration && this.spaceDecoration && this.tabDecoration) return;

        const color = new vscode.ThemeColor('editorCodeLens.foreground');
        const lineEndOptions = (text: string): vscode.DecorationRenderOptions => ({
            after: {
                contentText: text,
                color: color,
                margin: '0 0 0 3px',
                fontWeight: 'bold'
            }
        });

        const charOptions = (text: string): vscode.DecorationRenderOptions => ({
            before: {
                contentText: text,
                color: color,
                fontWeight: 'bold'
            }
        });

        this.lfDecoration = vscode.window.createTextEditorDecorationType(lineEndOptions('↓'));
        this.crlfDecoration = vscode.window.createTextEditorDecorationType(lineEndOptions('↵'));
        this.spaceDecoration = vscode.window.createTextEditorDecorationType(charOptions('·'));
        this.tabDecoration = vscode.window.createTextEditorDecorationType(charOptions('→'));
    }
}

// Export Singleton Instance
export const visualizer = new WhitespaceCharsVisualizer();

// --- Export Wrappers for Compatibility ---
export function iswhitespaceCharsVisible(): boolean {
    return visualizer.isEnabled;
}

export function toggleWhitespaceChars(forceState?: boolean): void {
    visualizer.toggle(forceState);
}

export function updateDecorations(editor: vscode.TextEditor | undefined): void {
    visualizer.update(editor);
}
