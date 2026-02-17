import * as vscode from 'vscode';
import { CONFIG, PERFORMANCE } from '../constants.js';
import { configCache } from './config-cache.js';
import { Logger } from './logger.js';
import {
    getEOL,
    joinLinesEfficient,
    shouldUseStreaming,
    splitLinesByEOL,
    streamLines,
} from './text-utils.js';

type LineProcessor = (lines: string[]) => string[] | Promise<string[]>;
type StreamLineProcessor = (lines: Iterable<string>) => Generator<string, void, undefined>;

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
 * - For large files, uses optimized streaming processing to minimize memory allocations
 *
 * @param editor The active text editor
 * @param processor Function that transforms an array of lines and returns the result
 * @param options Configuration options for the action
 */
export async function applyLineAction(
    editor: vscode.TextEditor,
    processor: LineProcessor,
    options: LineActionOptions = { expandSelection: true },
): Promise<void> {
    try {
        await applyLineActionInternal(editor, processor, options);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        Logger.error(`Failed to apply line action: ${message}`, error);
        vscode.window.showErrorMessage(`Line King: Operation failed - ${message}`);
    }
}

async function applyLineActionInternal(
    editor: vscode.TextEditor,
    processor: LineProcessor,
    options: LineActionOptions = { expandSelection: true },
): Promise<void> {
    const document = editor.document;
    const selections = editor.selections;
    const eol = getEOL(document); // Cache EOL once

    // Sort selections to process from bottom to top
    // This preserves ranges during edits when there are multiple selections
    const sortedSelections = [...selections].sort((a, b) => b.start.compareTo(a.start));

    // Collect changes before applying to avoid marking document as changed if nothing changes
    const changes: Array<{ range: vscode.Range; newText: string }> = [];
    // Map original selections to their corresponding changes for updating selections later
    const selectionChangeMap = new Map<
        vscode.Selection,
        { range: vscode.Range; newText: string }
    >();
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

            // Use streaming for large selections
            if (shouldUseStreaming(text)) {
                const newText = await processTextStreaming(text, processor, eol);
                if (text !== newText) {
                    changes.push({ range, newText });
                    selectionChangeMap.set(selection, { range, newText });
                }
            } else {
                const lines = splitLinesByEOL(text, eol);
                const processedLines = await Promise.resolve(processor(lines));
                const newText = processedLines.join(eol);

                if (text !== newText) {
                    changes.push({ range, newText });
                    selectionChangeMap.set(selection, { range, newText });
                }
            }
        }
    }

    // Fallback: No selection means process the entire document
    if (!hasSelection) {
        const lineCount = document.lineCount;
        const text = document.getText();

        // For very large files, use optimized processing
        if (lineCount > PERFORMANCE.LARGE_FILE_LINE_THRESHOLD || shouldUseStreaming(text)) {
            await processLargeDocument(editor, processor, eol);
            return;
        }

        // For smaller files, use the standard in-memory approach
        const lines = splitLinesByEOL(text, eol);
        const processedLines = await Promise.resolve(processor(lines));
        const newText = processedLines.join(eol);

        // Only add to changes if text actually changed
        if (text !== newText) {
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(text.length),
            );
            changes.push({ range: fullRange, newText });
        }
    }

    // Only perform edit if there are actual changes
    if (changes.length > 0) {
        // Calculate line count changes for each change (before applying)
        const lineChanges = changes.map((change) => {
            const originalLines = change.range.end.line - change.range.start.line + 1;
            const newLines = splitLinesByEOL(change.newText, eol).length;
            return newLines - originalLines;
        });

        await editor.edit((editBuilder) => {
            for (const change of changes) {
                editBuilder.replace(change.range, change.newText);
            }
        });

        // After edit, document has been modified - recalculate selection positions
        // We need to track cumulative line shifts from all previous changes
        const newSelections: vscode.Selection[] = [];
        const sortedOriginalSelections = [...selections].sort((a, b) => b.start.compareTo(a.start));

        for (let i = 0; i < sortedOriginalSelections.length; i++) {
            const selection = sortedOriginalSelections[i];
            const change = selectionChangeMap.get(selection);

            if (change) {
                // Calculate cumulative line shift from changes that were below this one
                // (since we process from bottom to top, changes with lower indices are below)
                let lineShift = 0;
                for (let j = 0; j < i; j++) {
                    lineShift += lineChanges[j];
                }

                const newTextLines = splitLinesByEOL(change.newText, eol);
                const adjustedStartLine = change.range.start.line + lineShift;

                // Ensure the adjusted line is within document bounds
                const safeStartLine = Math.max(
                    0,
                    Math.min(adjustedStartLine, document.lineCount - 1),
                );
                const newStart = document.lineAt(safeStartLine).range.start;

                if (newTextLines.length === 1) {
                    // Single line result - select the entire line content
                    const lineText = document.lineAt(safeStartLine).text;
                    const newEnd = new vscode.Position(safeStartLine, lineText.length);
                    newSelections.push(new vscode.Selection(newStart, newEnd));
                } else {
                    // Multiple lines - select from start to end of last line
                    const lastLineNum = safeStartLine + newTextLines.length - 1;
                    const safeLastLine = Math.min(lastLineNum, document.lineCount - 1);
                    const lastLine = document.lineAt(safeLastLine);
                    newSelections.push(new vscode.Selection(newStart, lastLine.range.end));
                }
            } else {
                // No change for this selection, keep it as is
                newSelections.push(selection);
            }
        }

        editor.selections = newSelections;
    }
}

/**
 * Process text using streaming to minimize memory allocations
 * Used for selections or documents larger than STREAMING_THRESHOLD
 */
async function processTextStreaming(
    text: string,
    processor: LineProcessor,
    eol: string,
): Promise<string> {
    // Check if the processor has a streaming variant
    const processorName = processor.name;
    let streamProcessor: StreamLineProcessor | null = null;

    // Try to import streaming version dynamically
    try {
        const cleanerModule = await import('../lib/cleaner.js');
        const streamFunctionName = `${processorName}Stream`;

        if (streamFunctionName in cleanerModule) {
            streamProcessor = (cleanerModule as { [key: string]: unknown })[
                streamFunctionName
            ] as StreamLineProcessor;
        }
    } catch {
        // Streaming version not available, fall back to array processing
    }

    if (streamProcessor) {
        // Use streaming processor for maximum memory efficiency
        const lineStream = streamLines(text);
        const processedStream = streamProcessor(lineStream);
        return joinLinesEfficient(processedStream, eol);
    } else {
        // Fall back to standard array processing
        const lines = splitLinesByEOL(text, eol);
        const processedLines = await Promise.resolve(processor(lines));
        return processedLines.join(eol);
    }
}

/**
 * Processes large documents with optimized memory usage
 * Reads line-by-line and performs single-pass processing
 */
async function processLargeDocument(
    editor: vscode.TextEditor,
    processor: LineProcessor,
    eol: string,
): Promise<void> {
    const document = editor.document;
    const lineCount = document.lineCount;
    const text = document.getText();

    // Estimate if we should use streaming
    if (shouldUseStreaming(text)) {
        const newText = await processTextStreaming(text, processor, eol);

        // Check if anything changed
        if (text !== newText) {
            await editor.edit((editBuilder) => {
                const fullRange = new vscode.Range(
                    document.positionAt(0),
                    document.positionAt(text.length),
                );
                editBuilder.replace(fullRange, newText);
            });
        }
        return;
    }

    // For files that are large in line count but not byte size,
    // use iterative line reading
    const allLines: string[] = [];
    for (let i = 0; i < lineCount; i++) {
        allLines.push(document.lineAt(i).text);
    }

    // Process the lines
    const processedLines = await Promise.resolve(processor(allLines));

    // Check if anything changed (early exit optimization)
    if (allLines.length === processedLines.length) {
        let hasChanges = false;
        for (let i = 0; i < allLines.length; i++) {
            if (allLines[i] !== processedLines[i]) {
                hasChanges = true;
                break;
            }
        }
        if (!hasChanges) {
            return;
        }
    }

    // Apply changes - replace entire document
    await editor.edit((editBuilder) => {
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(text.length),
        );
        editBuilder.replace(fullRange, processedLines.join(eol));
    });
}

/**
 * Gets the configured join separator from extension settings
 * Default is a space character
 */
export function getJoinSeparator(): string {
    return configCache.get(CONFIG.JOIN_SEPARATOR, ' ');
}
