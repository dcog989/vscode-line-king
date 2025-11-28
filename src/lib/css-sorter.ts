import * as vscode from 'vscode';
import { CONFIG } from '../constants';

/**
 * Sorts CSS properties within rule blocks
 * Supports both alphabetical and length-based sorting strategies
 */
export async function sortCssProperties(editor: vscode.TextEditor): Promise<void> {
    const document = editor.document;
    const text = document.getText();
    const config = vscode.workspace.getConfiguration(CONFIG.NAMESPACE);
    const strategy = config.get<string>(CONFIG.CSS_SORT_STRATEGY, 'alphabetical');
    const edits: vscode.TextEdit[] = [];
    const lines = text.split(/\r?\n/);

    let propertyBlockStart = -1;
    let propertyBlockEnd = -1;

    // Regex for a CSS property line
    // Matches: property: value; followed by optional comments or whitespace
    const propertyRegex = /^\s*[a-zA-Z0-9_-]+\s*:[^;{}]*;.*$/;

    // Regex to exclude comments
    const commentRegex = /^\s*(\/\/|\/\*)/;

    /**
     * Sorts and applies the current property block
     */
    const flushBlock = () => {
        if (propertyBlockStart > -1 && propertyBlockEnd > propertyBlockStart) {
            // Extract the property lines
            const slice = lines.slice(propertyBlockStart, propertyBlockEnd + 1);

            // Apply the selected sorting strategy
            if (strategy === 'length') {
                slice.sort((a, b) => a.trim().length - b.trim().length);
            } else {
                // Default: Alphabetical sorting
                slice.sort((a, b) => a.trim().localeCompare(b.trim()));
            }

            // Create a text edit for this block
            const range = new vscode.Range(
                new vscode.Position(propertyBlockStart, 0),
                new vscode.Position(propertyBlockEnd, lines[propertyBlockEnd].length)
            );

            const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
            const newText = slice.join(eol);
            edits.push(vscode.TextEdit.replace(range, newText));
        }

        // Reset block tracking
        propertyBlockStart = -1;
        propertyBlockEnd = -1;
    };

    // Scan through all lines
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if line is a valid property AND not a comment
        if (propertyRegex.test(line) && !commentRegex.test(line)) {
            // This line is a CSS property
            if (propertyBlockStart === -1) {
                propertyBlockStart = i;
            }
            propertyBlockEnd = i;
        } else {
            // Non-property line encountered
            // Only flush if it's not an empty line (empty lines within a block are ok)
            if (line.trim().length > 0) {
                flushBlock();
            }
        }
    }

    // Flush any remaining property block at the end of the file
    flushBlock();

    // Apply all edits
    if (edits.length > 0) {
        await editor.edit(editBuilder => {
            for (const edit of edits) {
                editBuilder.replace(edit.range, edit.newText);
            }
        });
    }
}
