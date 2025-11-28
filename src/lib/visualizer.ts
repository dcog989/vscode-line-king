import * as vscode from 'vscode';

let lfDecoration: vscode.TextEditorDecorationType | undefined;
let crlfDecoration: vscode.TextEditorDecorationType | undefined;
let isEnabled = false;

/**
 * Returns whether line endings are currently visible
 */
export function isLineEndingsVisible(): boolean {
    return isEnabled;
}

/**
 * Toggles or sets the visibility of line ending characters
 * Shows LF (↓) and CRLF (↵) markers at the end of each line
 * @param forceState Optional boolean to force enable (true) or disable (false)
 */
export function toggleLineEndings(forceState?: boolean): void {
    isEnabled = forceState !== undefined ? forceState : !isEnabled;

    if (isEnabled) {
        updateDecorations(vscode.window.activeTextEditor);
        vscode.window.showInformationMessage('Line Endings: Visible');
    } else {
        clearDecorations();
        vscode.window.showInformationMessage('Line Endings: Hidden');
    }
}

/**
 * Initializes the decoration types for line ending markers
 */
function initDecorations(): void {
    if (lfDecoration && crlfDecoration) return;

    const color = new vscode.ThemeColor('editorCodeLens.foreground');

    lfDecoration = vscode.window.createTextEditorDecorationType({
        after: {
            contentText: '↓',
            color: color,
            margin: '0 0 0 3px',
            fontWeight: 'bold'
        }
    });

    crlfDecoration = vscode.window.createTextEditorDecorationType({
        after: {
            contentText: '↵',
            color: color,
            margin: '0 0 0 3px',
            fontWeight: 'bold'
        }
    });
}

/**
 * Clears line ending decorations from all visible editors
 */
function clearDecorations(): void {
    const editors = vscode.window.visibleTextEditors;
    for (const editor of editors) {
        if (lfDecoration) {
            editor.setDecorations(lfDecoration, []);
        }
        if (crlfDecoration) {
            editor.setDecorations(crlfDecoration, []);
        }
    }
}

/**
 * Updates line ending decorations for the given editor
 * Detects and visualizes both LF and CRLF line endings at the END of lines
 * Optimized: Only processes visible ranges
 *
 * @param editor The text editor to update decorations for
 */
export function updateDecorations(editor: vscode.TextEditor | undefined): void {
    if (!editor || !isEnabled) {
        if (!isEnabled) {
            clearDecorations();
        }
        return;
    }

    initDecorations();

    const lfRanges: vscode.Range[] = [];
    const crlfRanges: vscode.Range[] = [];
    const document = editor.document;

    // Only process lines that are currently visible to the user
    for (const visibleRange of editor.visibleRanges) {
        // Iterate through lines in this visible range
        for (let i = visibleRange.start.line; i <= visibleRange.end.line; i++) {
            // Safety check for invalid lines
            if (i >= document.lineCount) continue;

            const line = document.lineAt(i);

            // Place decoration at the end of visible text
            const endPos = line.range.end;
            const decorationRange = new vscode.Range(endPos, endPos);

            // Detect line ending type
            if (i < document.lineCount - 1) {
                // Check the actual line ending in the document
                const nextLineStart = new vscode.Position(i + 1, 0);
                const lineEndOffset = document.offsetAt(nextLineStart) - document.offsetAt(line.range.end);

                if (lineEndOffset === 2) {
                    // CRLF (\r\n)
                    crlfRanges.push(decorationRange);
                } else if (lineEndOffset === 1) {
                    // LF (\n)
                    lfRanges.push(decorationRange);
                }
            } else {
                // Last line - check if file ends with a newline
                const text = document.getText();
                if (text.endsWith('\r\n')) {
                    crlfRanges.push(decorationRange);
                } else if (text.endsWith('\n')) {
                    lfRanges.push(decorationRange);
                }
            }
        }
    }

    // Apply decorations
    if (lfDecoration) {
        editor.setDecorations(lfDecoration, lfRanges);
    }
    if (crlfDecoration) {
        editor.setDecorations(crlfDecoration, crlfRanges);
    }
}
