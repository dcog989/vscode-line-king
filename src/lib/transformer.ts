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

// --- Transformers ---

export const transformUpper = (lines: string[]) => lines.map(l => l.toUpperCase());
export const transformLower = (lines: string[]) => lines.map(l => l.toLowerCase());
export const transformCamel = (lines: string[]) => lines.map(l => toCamel(l));
export const transformKebab = (lines: string[]) => lines.map(l => toKebab(l));
export const transformSnake = (lines: string[]) => lines.map(l => toSnake(l));
export const transformPascal = (lines: string[]) => lines.map(l => toPascal(l));

export const transformJoin = (lines: string[]) => {
    const separator = getJoinSeparator();
    return [lines.join(separator)];
};

/**
 * Splits lines by a user-provided separator.
 * NOTE: This requires user input, so it's a special async function compared to others.
 */
export async function splitLinesInteractive(editor: vscode.TextEditor): Promise<void> {
    const separator = await vscode.window.showInputBox({
        prompt: 'Enter the separator to split by',
        placeHolder: 'e.g. "," or "|" or " "'
    });

    if (!separator) return;

    // We can't use the standard applyLineAction easily here because 1 line becomes N lines
    // But applyLineAction handles N -> M lines just fine.

    const { applyLineAction } = await import('../utils/editor');

    await applyLineAction(editor, (lines) => {
        const result: string[] = [];
        for (const line of lines) {
            // Split and push parts
            const parts = line.split(separator);
            result.push(...parts);
        }
        return result;
    });
}
