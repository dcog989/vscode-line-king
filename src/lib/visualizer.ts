import * as vscode from 'vscode';
import { LINE_ENDINGS } from '../constants.js';

class WhitespaceCharsVisualizer {
    private lfDecoration: vscode.TextEditorDecorationType | undefined;
    private crlfDecoration: vscode.TextEditorDecorationType | undefined;
    private spaceDecoration: vscode.TextEditorDecorationType | undefined;
    private tabDecoration: vscode.TextEditorDecorationType | undefined;
    private _isEnabled = false;
    private updateScheduled = false;
    private lastUpdateTime = 0;
    private readonly THROTTLE_MS = 50; // Throttle updates to max 20fps

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
            this.initDecorations();
            this.update(vscode.window.activeTextEditor);
            vscode.window.showInformationMessage('Whitespace Characters: Visible');
        } else {
            // Only clear if we were previously enabled
            if (previousState) {
                this.clear();
                this.disposeDecorations();
            }
            vscode.window.showInformationMessage('Whitespace Characters: Hidden');
        }
    }

    /**
     * Updates decorations for the specific editor based on visible ranges
     * Throttled to prevent excessive updates during rapid scrolling/typing
     */
    public update(editor: vscode.TextEditor | undefined): void {
        if (!editor || !this._isEnabled) {
            return;
        }

        // Throttle rapid updates
        const now = Date.now();
        if (this.updateScheduled || (now - this.lastUpdateTime) < this.THROTTLE_MS) {
            return;
        }
        
        this.updateScheduled = true;
        this.lastUpdateTime = now;

        // Use requestAnimationFrame-like behavior with setTimeout
        setTimeout(() => {
            this.performUpdate(editor);
            this.updateScheduled = false;
        }, 0);
    }

    /**
     * Performs the actual decoration update
     * Processes only visible ranges for better performance
     */
    private performUpdate(editor: vscode.TextEditor): void {
        if (!editor || !this._isEnabled) {
            return;
        }

        const lfRanges: vscode.Range[] = [];
        const crlfRanges: vscode.Range[] = [];
        const spaceRanges: vscode.Range[] = [];
        const tabRanges: vscode.Range[] = [];
        const document = editor.document;
        const lastLineIndex = document.lineCount - 1;

        // Optimization: Only process lines that are currently visible to the user
        for (const visibleRange of editor.visibleRanges) {
            const startLine = visibleRange.start.line;
            const endLine = Math.min(visibleRange.end.line, lastLineIndex);

            for (let i = startLine; i <= endLine; i++) {
                const line = document.lineAt(i);
                const lineText = line.text;
                const endPos = line.range.end;

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
                const lineEndDecorationRange = new vscode.Range(endPos, endPos);
                
                if (i < lastLineIndex) {
                    const nextLineStart = new vscode.Position(i + 1, 0);
                    const lineEndOffset = document.offsetAt(nextLineStart) - document.offsetAt(endPos);

                    if (lineEndOffset === LINE_ENDINGS.CRLF_BYTE_LENGTH) {
                        crlfRanges.push(lineEndDecorationRange);
                    } else if (lineEndOffset === LINE_ENDINGS.LF_BYTE_LENGTH) {
                        lfRanges.push(lineEndDecorationRange);
                    }
                } else {
                    // Last line - check if it has a line ending
                    const lineEndPos = document.offsetAt(endPos);
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

        // Apply decorations
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

    private disposeDecorations(): void {
        this.lfDecoration?.dispose();
        this.crlfDecoration?.dispose();
        this.spaceDecoration?.dispose();
        this.tabDecoration?.dispose();
        this.lfDecoration = undefined;
        this.crlfDecoration = undefined;
        this.spaceDecoration = undefined;
        this.tabDecoration = undefined;
    }

    private initDecorations(): void {
        if (this.lfDecoration && this.crlfDecoration && this.spaceDecoration && this.tabDecoration) {
            return;
        }

        // Clean up any existing decorations first
        this.disposeDecorations();

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

export function isWhitespaceCharsVisible(): boolean {
    return visualizer.isEnabled;
}

export function toggleWhitespaceChars(forceState?: boolean): void {
    visualizer.toggle(forceState);
}

export function updateDecorations(editor: vscode.TextEditor | undefined): void {
    visualizer.update(editor);
}
