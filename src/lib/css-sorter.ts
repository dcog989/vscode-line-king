import * as vscode from 'vscode';
import { CONFIG } from '../constants';
import { configCache } from '../utils/config-cache';
import { splitLines, getEOL } from '../utils/text-utils';

// Pre-compiled regexes for performance
const PROPERTY_REGEX = /^\s*[a-zA-Z0-9_-]+\s*:[^;{}]*;.*$/;
const COMMENT_REGEX = /^\s*(\/\/|\/\*)/;

/**
 * Sorts CSS properties within rule blocks
 * Supports both alphabetical and length-based sorting strategies
 */
export async function sortCssProperties(editor: vscode.TextEditor): Promise<void> {
    const document = editor.document;
    const text = document.getText();
    const strategy = configCache.get<string>(CONFIG.CSS_SORT_STRATEGY, 'alphabetical');
    const edits: vscode.TextEdit[] = [];
    const lines = splitLines(text);
    const eol = getEOL(document);

    let propertyBlockStart = -1;
    let propertyBlockEnd = -1;

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
        if (PROPERTY_REGEX.test(line) && !COMMENT_REGEX.test(line)) {
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
