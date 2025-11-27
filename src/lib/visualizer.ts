import * as vscode from 'vscode';

let lfDecoration: vscode.TextEditorDecorationType | undefined;
let crlfDecoration: vscode.TextEditorDecorationType | undefined;
let isEnabled = false;

export function toggleLineEndings() {
    isEnabled = !isEnabled;
    if (isEnabled) {
        updateDecorations(vscode.window.activeTextEditor);
        vscode.window.showInformationMessage('Line Endings Visibility: ON');
    } else {
        clearDecorations();
        vscode.window.showInformationMessage('Line Endings Visibility: OFF');
    }
}

function initDecorations() {
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

function clearDecorations() {
    const editors = vscode.window.visibleTextEditors;
    for (const editor of editors) {
        if (lfDecoration) editor.setDecorations(lfDecoration, []);
        if (crlfDecoration) editor.setDecorations(crlfDecoration, []);
    }
}

export function updateDecorations(editor: vscode.TextEditor | undefined) {
    if (!editor || !isEnabled) return;
    initDecorations();

    const lfRanges: vscode.Range[] = [];
    const crlfRanges: vscode.Range[] = [];
    const text = editor.document.getText();

    // We scan the text manually because document.eol is global for the file,
    // but we want to visualize mixed endings if they exist.
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

    if (lfDecoration) editor.setDecorations(lfDecoration, lfRanges);
    if (crlfDecoration) editor.setDecorations(crlfDecoration, crlfRanges);
}
