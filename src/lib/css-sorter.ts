import * as vscode from 'vscode';

export async function sortCssProperties(editor: vscode.TextEditor) {
    const document = editor.document;
    const text = document.getText();
    const config = vscode.workspace.getConfiguration('lineKing');
    const strategy = config.get<string>('cssSortStrategy', 'alphabetical');

    const edits: vscode.TextEdit[] = [];
    const lines = text.split(/\r?\n/);

    let propertyBlockStart = -1;
    let propertyBlockEnd = -1;

    // Regex for a CSS property: padding: 0; or --var: 10px;
    // Must not contain { or }
    const propertyRegex = /^\s*[a-zA-Z0-9-]+\s*:[^;{}]*;\s*$/;

    const flushBlock = () => {
        if (propertyBlockStart > -1 && propertyBlockEnd > propertyBlockStart) {
            // Get the slice
            const slice = lines.slice(propertyBlockStart, propertyBlockEnd + 1);

            // Apply sorting strategy
            if (strategy === 'length') {
                slice.sort((a, b) => a.trim().length - b.trim().length);
            } else {
                // Default: Alphabetical
                slice.sort((a, b) => a.trim().localeCompare(b.trim()));
            }

            // Create edit
            const range = new vscode.Range(
                new vscode.Position(propertyBlockStart, 0),
                new vscode.Position(propertyBlockEnd, lines[propertyBlockEnd].length)
            );

            const newText = slice.join(document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n');
            edits.push(vscode.TextEdit.replace(range, newText));
        }
        propertyBlockStart = -1;
        propertyBlockEnd = -1;
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (propertyRegex.test(line)) {
            if (propertyBlockStart === -1) {
                propertyBlockStart = i;
            }
            propertyBlockEnd = i;
        } else {
            // Non-property line
            if (line.trim().length > 0) {
                flushBlock();
            }
        }
    }
    flushBlock(); // Final flush

    if (edits.length > 0) {
        await editor.edit(editBuilder => {
            for (const edit of edits) {
                editBuilder.replace(edit.range, edit.newText);
            }
        });
    }
}
