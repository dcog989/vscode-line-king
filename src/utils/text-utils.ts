import * as vscode from 'vscode';

/**
 * Shared text processing utilities
 */

// Line ending detection regex (compiled once)
export const LINE_SPLIT_REGEX = /\r?\n/;

/**
 * Gets the appropriate line ending string for a document
 */
export function getEOL(document: vscode.TextDocument): string {
    return document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
}

/**
 * Splits text into lines using the standard line split regex
 */
export function splitLines(text: string): string[] {
    return text.split(LINE_SPLIT_REGEX);
}

/**
 * Joins lines using the appropriate line ending for the document
 */
export function joinLines(lines: string[], document: vscode.TextDocument): string {
    return lines.join(getEOL(document));
}
