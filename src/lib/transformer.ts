import * as vscode from 'vscode';
import { getJoinSeparator } from '../utils/editor';

// --- Text Case Helpers ---

function toCamel(str: string): string {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
        index === 0 ? word.toLowerCase() : word.toUpperCase()
    ).replace(/\s+/g, '');
}

function toKebab(str: string): string {
    return str
        .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
        ?.map(x => x.toLowerCase())
        .join('-') || str;
}

function toSnake(str: string): string {
    return str
        .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
        ?.map(x => x.toLowerCase())
        .join('_') || str;
}

function toPascal(str: string): string {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase()).replace(/\s+/g, '');
}

function toSentence(str: string): string {
    const s = str.trim();
    if (s.length === 0) return str;
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function toTitle(str: string): string {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

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

// --- Transformers ---

export const transformUpper = (lines: string[]): string[] => lines.map(l => l.toUpperCase());
export const transformLower = (lines: string[]): string[] => lines.map(l => l.toLowerCase());
export const transformCamel = (lines: string[]): string[] => lines.map(l => toCamel(l));
export const transformKebab = (lines: string[]): string[] => lines.map(l => toKebab(l));
export const transformSnake = (lines: string[]): string[] => lines.map(l => toSnake(l));
export const transformPascal = (lines: string[]): string[] => lines.map(l => toPascal(l));
export const transformSentence = (lines: string[]): string[] => lines.map(l => toSentence(l));
export const transformTitle = (lines: string[]): string[] => lines.map(l => toTitle(l));

// --- Encoding ---
export const transformUrlEncode = (lines: string[]): string[] =>
    lines.map(l => {
        try {
            return encodeURIComponent(l);
        } catch {
            return l;
        }
    });

export const transformUrlDecode = (lines: string[]): string[] =>
    lines.map(l => {
        try {
            return decodeURIComponent(l);
        } catch {
            return l;
        }
    });

export const transformBase64Encode = (lines: string[]): string[] =>
    lines.map(l => {
        try {
            return base64Encode(l);
        } catch {
            return l;
        }
    });

export const transformBase64Decode = (lines: string[]): string[] =>
    lines.map(l => {
        try {
            return base64Decode(l);
        } catch {
            return l;
        }
    });

export const transformJsonEscape = (lines: string[]): string[] =>
    lines.map(l => {
        try {
            return JSON.stringify(l).slice(1, -1);
        } catch {
            return l;
        }
    });

export const transformJsonUnescape = (lines: string[]): string[] =>
    lines.map(l => {
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

// --- Join / Split / Align ---

export const transformJoin = (lines: string[]): string[] => {
    const separator = getJoinSeparator();
    return [lines.join(separator)];
};

/**
 * Interactively splits lines by a user-specified separator
 */
export async function splitLinesInteractive(editor: vscode.TextEditor): Promise<void> {
    const separator = await vscode.window.showInputBox({
        prompt: 'Enter the separator to split by',
        placeHolder: 'e.g. "," or "|" or " "'
    });

    if (!separator) return;

    const { applyLineAction } = await import('../utils/editor');
    await applyLineAction(editor, (lines) => {
        const result: string[] = [];
        for (const line of lines) {
            result.push(...line.split(separator));
        }
        return result;
    });
}

/**
 * Inserts a numeric sequence that prefixes selected text/lines
 */
export async function insertNumericSequence(editor: vscode.TextEditor): Promise<void> {
    const { applyLineAction } = await import('../utils/editor');
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

    if (!separator) return;

    const { applyLineAction } = await import('../utils/editor');
    await applyLineAction(editor, (lines) => {
        // Find max position of separator
        let maxPos = 0;
        const splitLines = lines.map(line => {
            const idx = line.indexOf(separator);
            if (idx !== -1 && idx > maxPos) maxPos = idx;
            return { line, idx };
        });

        // Pad each line to align separators
        return splitLines.map(item => {
            if (item.idx === -1) return item.line;
            const before = item.line.substring(0, item.idx).trimEnd();
            const after = item.line.substring(item.idx + separator.length).trimStart();
            const spaces = ' '.repeat(maxPos - before.length);
            return `${before}${spaces} ${separator} ${after}`;
        });
    });
}
