import * as vscode from 'vscode';

type LineProcessor = (lines: string[]) => string[];

/**
 * Applies a transformation function to selected lines or the entire document
 *
 * Behavior:
 * - If text is selected: Expands to full lines and applies transformation to that range
 * - If no text is selected: Applies transformation to the entire document
 * - Handles multiple selections
 * - Preserves the document's line ending format (LF or CRLF)
 *
 * @param editor The active text editor
 * @param processor Function that transforms an array of lines and returns the result
 */
export interface LineActionOptions {
    expandSelection?: boolean;
}

export async function applyLineAction(
    editor: vscode.TextEditor,
    processor: LineProcessor,
    options: LineActionOptions = { expandSelection: true }
): Promise<void> {
    const document = editor.document;
    const selections = editor.selections;

    // Sort selections to process from bottom to top
    // This preserves ranges during edits when there are multiple selections
    const sortedSelections = [...selections].sort((a, b) => b.start.compareTo(a.start));

    await editor.edit(editBuilder => {
        let hasSelection = false;

        for (const selection of sortedSelections) {
            if (!selection.isEmpty) {
                hasSelection = true;

                let range: vscode.Range;

                if (options.expandSelection) {
                    // Get the full lines for the selection
                    const startLine = document.lineAt(selection.start.line);
                    const endLine = document.lineAt(selection.end.line);
                    range = new vscode.Range(startLine.range.start, endLine.range.end);
                } else {
                    // Use the exact selection range
                    range = selection;
                }

                const text = document.getText(range);

                // Split into lines (handles both CRLF and LF)
                const lines = text.split(/\r?\n/);

                // Apply the transformation
                const processedLines = processor(lines);

                // Use the document's line ending format
                const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';

                editBuilder.replace(range, processedLines.join(eol));
            }
        }

        // Fallback: No selection means process the entire document
        if (!hasSelection) {
            const text = document.getText();
            const lines = text.split(/\r?\n/);
            const processedLines = processor(lines);
            const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';

            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(text.length)
            );
            editBuilder.replace(fullRange, processedLines.join(eol));
        }
    });
}

/**
 * Gets the configured join separator from extension settings
 * Default is a space character
 */
export function getJoinSeparator(): string {
    return vscode.workspace.getConfiguration('lineKing').get<string>('joinSeparator', ' ');
}
