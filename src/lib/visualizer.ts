import * as vscode from 'vscode';

let lfDecoration: vscode.TextEditorDecorationType | undefined;
let crlfDecoration: vscode.TextEditorDecorationType | undefined;
let isEnabled = false;

/**
 * Toggles the visibility of line ending characters
 * Shows LF (↓) and CRLF (↵) markers at the end of each line
 */
export function toggleLineEndings(): void {
    isEnabled = !isEnabled;
    
    if (isEnabled) {
        updateDecorations(vscode.window.activeTextEditor);
        vscode.window.showInformationMessage('Line Endings Visibility: ON');
    } else {
        clearDecorations();
        vscode.window.showInformationMessage('Line Endings Visibility: OFF');
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
 * Detects and visualizes both LF and CRLF line endings
 * 
 * @param editor The text editor to update decorations for
 */
export function updateDecorations(editor: vscode.TextEditor | undefined): void {
    if (!editor || !isEnabled) return;
    
    initDecorations();

    const lfRanges: vscode.Range[] = [];
    const crlfRanges: vscode.Range[] = [];
    const text = editor.document.getText();

    // Scan the text manually to detect line endings
    // This allows us to visualize mixed endings if they exist in the file
    // (document.eol only represents the file's primary line ending)
    const regex = /\r\n|\n/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
        const startPos = editor.document.positionAt(match.index);
        const endPos = editor.document.positionAt(match.index + match[0].length);
        const range = new vscode.Range(startPos, endPos);

        if (match[0] === '\r\n') {
            crlfRanges.push(range);
        } else {
            lfRanges.push(range);
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
