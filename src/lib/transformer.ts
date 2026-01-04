import {
    camelCase,
    capitalCase,
    kebabCase,
    pascalCase,
    sentenceCase,
    snakeCase
} from 'change-case';
import * as vscode from 'vscode';
import { applyLineAction, getJoinSeparator } from '../utils/editor.js';

/**
 * Text transformation and encoding utilities
 */

// --- Browser-compatible Base64 helpers ---

/**
 * Encodes a string to base64 using Node Buffer
 * Prevents stack overflow on large strings
 */
function base64Encode(str: string): string {
    return Buffer.from(str, 'utf-8').toString('base64');
}

/**
 * Decodes a base64 string using Node Buffer
 */
function base64Decode(str: string): string {
    return Buffer.from(str, 'base64').toString('utf-8');
}

// --- Case Transformers ---

export function transformUpper(lines: string[]): string[] {
    return lines.map(l => l.toUpperCase());
}

export function transformLower(lines: string[]): string[] {
    return lines.map(l => l.toLowerCase());
}

export function transformCamel(lines: string[]): string[] {
    return lines.map(l => camelCase(l));
}

export function transformKebab(lines: string[]): string[] {
    return lines.map(l => kebabCase(l));
}

export function transformSnake(lines: string[]): string[] {
    return lines.map(l => snakeCase(l));
}

export function transformPascal(lines: string[]): string[] {
    return lines.map(l => pascalCase(l));
}

export function transformSentence(lines: string[]): string[] {
    return lines.map(l => sentenceCase(l));
}

export function transformTitle(lines: string[]): string[] {
    return lines.map(l => capitalCase(l));
}

// --- Encoding Transformers ---

export function transformUrlEncode(lines: string[]): string[] {
    return lines.map(l => {
        try {
            return encodeURIComponent(l);
        } catch {
            return l;
        }
    });
}

export function transformUrlDecode(lines: string[]): string[] {
    return lines.map(l => {
        try {
            return decodeURIComponent(l);
        } catch {
            return l;
        }
    });
}

export function transformBase64Encode(lines: string[]): string[] {
    return lines.map(l => {
        try {
            return base64Encode(l);
        } catch {
            return l;
        }
    });
}

export function transformBase64Decode(lines: string[]): string[] {
    return lines.map(l => {
        try {
            return base64Decode(l);
        } catch {
            return l;
        }
    });
}

export function transformJsonEscape(lines: string[]): string[] {
    return lines.map(l => {
        try {
            return JSON.stringify(l).slice(1, -1);
        } catch {
            return l;
        }
    });
}

export function transformJsonUnescape(lines: string[]): string[] {
    return lines.map(l => {
        try {
            return JSON.parse(`"${l}"`);
        } catch {
            try {
                return JSON.parse(l);
            } catch {
                return l;
            }
        }
    });
}

// --- Join / Split / Align ---

export function transformJoin(lines: string[]): string[] {
    const separator = getJoinSeparator();
    return [lines.join(separator)];
}

/**
 * Interactively splits lines by a user-specified separator
 */
export async function splitLinesInteractive(editor: vscode.TextEditor): Promise<void> {
    const separator = await vscode.window.showInputBox({
        prompt: 'Enter the separator to split by',
        placeHolder: 'e.g. "," or "|" or " "'
    });

    if (separator === undefined || separator === '') {
        return;
    }

    await applyLineAction(editor, (lines) => {
        const result: string[] = [];
        for (const line of lines) {
            const parts = line.split(separator);
            result.push(...parts);
        }
        return result;
    });
}

/**
 * Inserts a numeric sequence that prefixes selected text/lines
 */
export async function insertNumericSequence(editor: vscode.TextEditor): Promise<void> {
    await applyLineAction(editor, (lines) => {
        return lines.map((line, i) => `${i + 1} ${line}`);
    });
}

/**
 * Aligns text to a separator by adding padding
 */
export async function alignToSeparatorInteractive(editor: vscode.TextEditor): Promise<void> {
    const separator = await vscode.window.showInputBox({
        prompt: 'Enter separator to align',
        placeHolder: 'e.g. "=" or ":" or ","'
    });

    if (separator === undefined || separator === '') {
        return;
    }

    await applyLineAction(editor, (lines) => {
        // Find max position of separator
        let maxPos = 0;
        const splitLines = lines.map(line => {
            const idx = line.indexOf(separator);
            if (idx !== -1 && idx > maxPos) {
                maxPos = idx;
            }
            return { line, idx };
        });

        // Pad each line to align separators
        return splitLines.map(item => {
            if (item.idx === -1) {
                return item.line;
            }
            const before = item.line.substring(0, item.idx).trimEnd();
            const after = item.line.substring(item.idx + separator.length).trimStart();
            const spaces = ' '.repeat(maxPos - before.length);
            return `${before}${spaces} ${separator} ${after}`;
        });
    });
}
