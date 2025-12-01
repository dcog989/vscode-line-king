import * as vscode from 'vscode';
import { CONFIG } from '../constants';
import { configCache } from './config-cache';
import { splitLines, joinLines } from './text-utils';

type LineProcessor = (lines: string[]) => string[];

export interface LineActionOptions {
    expandSelection?: boolean;
}

/**
 * Applies a transformation function to selected lines or the entire document
 *
 * Behavior:
 * - If text is selected: Expands to full lines (unless disabled in options) and applies transformation
 * - If no text is selected: Applies transformation to the entire document
 * - Handles multiple selections
 * - Preserves the document's line ending format (LF or CRLF)
 *
 * @param editor The active text editor
 * @param processor Function that transforms an array of lines and returns the result
 * @param options Configuration options for the action
 */
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

    // Collect changes before applying to avoid marking document as changed if nothing changes
    const changes: Array<{ range: vscode.Range; oldText: string; newText: string }> = [];
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
            const lines = splitLines(text);

            // Apply the transformation
            const processedLines = processor(lines);

            // Use the document's line ending format
            const newText = joinLines(processedLines, document);

            // Only add to changes if text actually changed
            if (text !== newText) {
                changes.push({ range, oldText: text, newText });
            }
        }
    }

    // Fallback: No selection means process the entire document
    if (!hasSelection) {
        const text = document.getText();
        const lines = splitLines(text);
        const processedLines = processor(lines);
        const newText = joinLines(processedLines, document);

        // Only add to changes if text actually changed
        if (text !== newText) {
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(text.length)
            );
            changes.push({ range: fullRange, oldText: text, newText });
        }
    }

    // Only perform edit if there are actual changes
    if (changes.length > 0) {
        await editor.edit(editBuilder => {
            for (const change of changes) {
                editBuilder.replace(change.range, change.newText);
            }
        });
    }
}

/**
 * Gets the configured join separator from extension settings
 * Default is a space character
 */
export function getJoinSeparator(): string {
    return configCache.get<string>(CONFIG.JOIN_SEPARATOR, ' ');
}
