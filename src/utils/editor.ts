import * as vscode from 'vscode';
import { CONFIG } from '../constants.js';
import { configCache } from './config-cache.js';
import { getEOL, joinLinesEfficient, shouldUseStreaming, splitLines, streamLines } from './text-utils.js';

type LineProcessor = (lines: string[]) => string[];
type StreamLineProcessor = (lines: Iterable<string>) => Generator<string, void, undefined>;

export interface LineActionOptions {
    expandSelection?: boolean;
}

/**
 * Threshold for switching to chunk-based processing (in lines)
 * Reduced from 100k to 50k for better memory management
 * Files with more lines than this will be processed with optimization
 */
const LARGE_FILE_THRESHOLD = 50000;

/**
 * Threshold for using streaming processing (in bytes)
 * Files larger than 1MB will use streaming to minimize memory allocations
 */
const STREAMING_THRESHOLD = 1024 * 1024;

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
    options: LineActionOptions = { expandSelection: true }
): Promise<void> {
    const document = editor.document;
    const selections = editor.selections;

    // Sort selections to process from bottom to top
    // This preserves ranges during edits when there are multiple selections
    const sortedSelections = [...selections].sort((a, b) => b.start.compareTo(a.start));

    // Collect changes before applying to avoid marking document as changed if nothing changes
    const changes: Array<{ range: vscode.Range; newText: string }> = [];
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
                const newText = await processTextStreaming(text, processor, document);
                if (text !== newText) {
                    changes.push({ range, newText });
                }
            } else {
                const lines = splitLines(text);
                const processedLines = processor(lines);
                const eol = getEOL(document);
                const newText = processedLines.join(eol);

                if (text !== newText) {
                    changes.push({ range, newText });
                }
            }
        }
    }

    // Fallback: No selection means process the entire document
    if (!hasSelection) {
        const lineCount = document.lineCount;
        const text = document.getText();

        // For very large files, use optimized processing
        if (lineCount > LARGE_FILE_THRESHOLD || shouldUseStreaming(text)) {
            await processLargeDocument(editor, processor);
            return;
        }

        // For smaller files, use the standard in-memory approach
        const lines = splitLines(text);
        const processedLines = processor(lines);
        const eol = getEOL(document);
        const newText = processedLines.join(eol);

        // Only add to changes if text actually changed
        if (text !== newText) {
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(text.length)
            );
            changes.push({ range: fullRange, newText });
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
 * Process text using streaming to minimize memory allocations
 * Used for selections or documents larger than STREAMING_THRESHOLD
 */
async function processTextStreaming(
    text: string,
    processor: LineProcessor,
    document: vscode.TextDocument
): Promise<string> {
    const eol = getEOL(document);

    // Check if the processor has a streaming variant
    const processorName = processor.name;
    let streamProcessor: StreamLineProcessor | null = null;

    // Try to import streaming version dynamically
    try {
        const cleanerModule = await import('../lib/cleaner.js');
        const streamFunctionName = `${processorName}Stream`;

        if (streamFunctionName in cleanerModule) {
            streamProcessor = (cleanerModule as any)[streamFunctionName];
        }
    } catch (error) {
        // Streaming version not available, fall back to array processing
    }

    if (streamProcessor) {
        // Use streaming processor for maximum memory efficiency
        const lineStream = streamLines(text);
        const processedStream = streamProcessor(lineStream);
        return joinLinesEfficient(processedStream, eol);
    } else {
        // Fall back to standard array processing
        const lines = splitLines(text);
        const processedLines = processor(lines);
        return processedLines.join(eol);
    }
}

/**
 * Processes large documents with optimized memory usage
 * Reads line-by-line and performs single-pass processing
 */
async function processLargeDocument(
    editor: vscode.TextEditor,
    processor: LineProcessor
): Promise<void> {
    const document = editor.document;
    const lineCount = document.lineCount;
    const eol = getEOL(document);
    const text = document.getText();

    // Estimate if we should use streaming
    if (shouldUseStreaming(text)) {
        const newText = await processTextStreaming(text, processor, document);

        // Check if anything changed
        if (text !== newText) {
            await editor.edit(editBuilder => {
                const fullRange = new vscode.Range(
                    document.positionAt(0),
                    document.positionAt(text.length)
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
    const processedLines = processor(allLines);

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
    await editor.edit(editBuilder => {
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(text.length)
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
