import * as vscode from 'vscode';

type LineProcessor = (lines: string[]) => string[];

/**
 * Applies a transformation function to the text.
 * - If text is selected, expands to full lines and applies to that range.
 * - If no text is selected, applies to the entire document.
 */
export async function applyLineAction(editor: vscode.TextEditor, processor: LineProcessor) {
    const document = editor.document;
    const selections = editor.selections;

    // Sort selections to process from bottom to top to preserve ranges during edits
    const sortedSelections = [...selections].sort((a, b) => b.start.compareTo(a.start));

    await editor.edit(editBuilder => {
        let hasSelection = false;

        for (const selection of sortedSelections) {
            if (!selection.isEmpty) {
                hasSelection = true;
                const startLine = document.lineAt(selection.start.line);
                const endLine = document.lineAt(selection.end.line);

                // Expand to full lines
                const range = new vscode.Range(startLine.range.start, endLine.range.end);
                const text = document.getText(range);

                // Handle different line endings (CRLF vs LF) by normalizing split
                // We use the editor's EOL setting to rejoin later
                const lines = text.split(/\r?\n/);
                const processedLines = processor(lines);
                const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';

                editBuilder.replace(range, processedLines.join(eol));
            }
        }

        // Fallback: No selection => Process entire document
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
 * Gets the configured join separator from settings.
 */
export function getJoinSeparator(): string {
    return vscode.workspace.getConfiguration('lineKing').get<string>('joinSeparator', ' ');
}
