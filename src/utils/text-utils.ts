import * as vscode from 'vscode';

/**
 * Shared text processing utilities
 * Optimized for memory efficiency with large files
 */

// Line ending detection regex (compiled once)
export const LINE_SPLIT_REGEX = /\r?\n/;

/**
 * Threshold for switching to streaming line processing
 * Files larger than this will use memory-efficient streaming approach
 */
const STREAMING_THRESHOLD = 1024 * 1024; // 1MB

/**
 * Gets the appropriate line ending string for a document
 */
export function getEOL(document: vscode.TextDocument): string {
    return document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
}

/**
 * Splits text into lines using the standard line split regex
 * For small to medium files (< 1MB), uses standard split
 * For large files, consider using streamLines() instead
 */
export function splitLines(text: string): string[] {
    return text.split(LINE_SPLIT_REGEX);
}

/**
 * Memory-efficient line iterator for large texts
 * Yields lines one at a time without creating a massive array
 * 
 * @param text - The text to split into lines
 * @yields Individual lines without line endings
 * 
 * Example:
 * ```typescript
 * for (const line of streamLines(text)) {
 *     if (line.trim().length > 0) {
 *         process(line);
 *     }
 * }
 * ```
 */
export function* streamLines(text: string): Generator<string, void, undefined> {
    let start = 0;
    let pos = 0;
    const len = text.length;
    
    while (pos < len) {
        const char = text[pos];
        
        if (char === '\n') {
            // Check for \r\n (CRLF)
            const end = (pos > 0 && text[pos - 1] === '\r') ? pos - 1 : pos;
            yield text.substring(start, end);
            start = pos + 1;
        }
        
        pos++;
    }
    
    // Yield the last line if there's content after the last newline
    if (start < len) {
        yield text.substring(start);
    }
}

/**
 * Splits text into lines with automatic strategy selection
 * - Small files (< 1MB): Uses fast split()
 * - Large files (>= 1MB): Uses memory-efficient streaming
 */
export function splitLinesAuto(text: string): string[] | Generator<string, void, undefined> {
    if (text.length < STREAMING_THRESHOLD) {
        return text.split(LINE_SPLIT_REGEX);
    } else {
        return streamLines(text);
    }
}

/**
 * Collects lines from a generator into an array
 * Only use when you actually need the full array in memory
 */
export function collectLines(lineIterator: Generator<string, void, undefined>): string[] {
    return Array.from(lineIterator);
}

/**
 * Joins lines using the appropriate line ending for the document
 */
export function joinLines(lines: string[], document: vscode.TextDocument): string {
    return lines.join(getEOL(document));
}

/**
 * Memory-efficient line joining for large arrays
 * Uses chunks to reduce memory pressure during concatenation
 * 
 * @param lines - Array or iterable of lines
 * @param eol - End of line string
 * @param chunkSize - Number of lines to join at once (default: 10000)
 */
export function joinLinesEfficient(
    lines: Iterable<string>, 
    eol: string, 
    chunkSize: number = 10000
): string {
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let count = 0;
    
    for (const line of lines) {
        currentChunk.push(line);
        count++;
        
        if (count >= chunkSize) {
            chunks.push(currentChunk.join(eol));
            currentChunk = [];
            count = 0;
        }
    }
    
    // Add remaining lines
    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(eol));
    }
    
    return chunks.join(eol);
}

/**
 * Determines if a text is large enough to benefit from streaming
 */
export function shouldUseStreaming(text: string): boolean {
    return text.length >= STREAMING_THRESHOLD;
}

/**
 * Estimates line count without splitting
 * Useful for progress indicators or deciding processing strategy
 */
export function estimateLineCount(text: string): number {
    let count = 1; // Always at least one line
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '\n') {
            count++;
        }
    }
    return count;
}
