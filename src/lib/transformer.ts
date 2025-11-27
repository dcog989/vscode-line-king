import * as vscode from 'vscode';
import { getJoinSeparator } from '../utils/editor';

// --- Text Case Helpers ---

function toCamel(str: string) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
        index === 0 ? word.toLowerCase() : word.toUpperCase()
    ).replace(/\s+/g, '');
}

function toKebab(str: string) {
    return str
        .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
        ?.map(x => x.toLowerCase())
        .join('-') || str;
}

function toSnake(str: string) {
    return str
        .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
        ?.map(x => x.toLowerCase())
        .join('_') || str;
}

function toPascal(str: string) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase()).replace(/\s+/g, '');
}

function toSentence(str: string) {
    const s = str.trim();
    if (s.length === 0) return str;
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function toTitle(str: string) {
    return str.replace(
        /\w\S*/g,
        text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
}

// --- Transformers ---

export const transformUpper = (lines: string[]) => lines.map(l => l.toUpperCase());
export const transformLower = (lines: string[]) => lines.map(l => l.toLowerCase());
export const transformCamel = (lines: string[]) => lines.map(l => toCamel(l));
export const transformKebab = (lines: string[]) => lines.map(l => toKebab(l));
export const transformSnake = (lines: string[]) => lines.map(l => toSnake(l));
export const transformPascal = (lines: string[]) => lines.map(l => toPascal(l));
export const transformSentence = (lines: string[]) => lines.map(l => toSentence(l));
export const transformTitle = (lines: string[]) => lines.map(l => toTitle(l));

// --- Encoding ---
export const transformUrlEncode = (lines: string[]) => lines.map(l => encodeURIComponent(l));
export const transformUrlDecode = (lines: string[]) => lines.map(l => decodeURIComponent(l));
export const transformBase64Encode = (lines: string[]) => lines.map(l => Buffer.from(l).toString('base64'));
export const transformBase64Decode = (lines: string[]) => lines.map(l => Buffer.from(l, 'base64').toString('utf8'));
export const transformJsonEscape = (lines: string[]) => lines.map(l => JSON.stringify(l).slice(1, -1));
export const transformJsonUnescape = (lines: string[]) => lines.map(l => {
    try { return JSON.parse(`"${l}"`); } catch { return l; }
});

// --- Sequence ---
export const transformSequence = (lines: string[]) => lines.map((_, i) => `${i + 1}`);

// --- Join / Split / Align ---

export const transformJoin = (lines: string[]) => {
    const separator = getJoinSeparator();
    return [lines.join(separator)];
};

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

export async function alignToSeparatorInteractive(editor: vscode.TextEditor): Promise<void> {
    const separator = await vscode.window.showInputBox({
        prompt: 'Enter separator to align',
        placeHolder: 'e.g. "=" or ":" or ","'
    });

    if (!separator) return;

    const { applyLineAction } = await import('../utils/editor');
    await applyLineAction(editor, (lines) => {
        // 1. Find max position of separator
        let maxPos = 0;
        const splitLines = lines.map(line => {
            const idx = line.indexOf(separator);
            if (idx > maxPos) maxPos = idx;
            return { line, idx };
        });

        // 2. Pad
        return splitLines.map(item => {
            if (item.idx === -1) return item.line;
            const before = item.line.substring(0, item.idx).trimEnd();
            const after = item.line.substring(item.idx + separator.length).trimStart();
            // Pad spaces
            const spaces = ' '.repeat(maxPos - before.length);
            return `${before}${spaces} ${separator} ${after}`;
        });
    });
}
