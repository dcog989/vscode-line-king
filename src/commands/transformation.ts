import * as vscode from 'vscode';
import { COMMANDS } from '../constants.js';
import { applyLineAction, getJoinSeparator } from '../utils/editor.js';
import * as transformer from '../lib/transformer.js';
import { createCommandFactory } from './factory.js';

export function registerTransformationCommands(context: vscode.ExtensionContext): void {
    const factory = createCommandFactory(context);

    factory.registerLineCommands(
        [
            { id: 'lineKing.manipulate.upper', processor: transformer.transformUpper },
            { id: 'lineKing.manipulate.lower', processor: transformer.transformLower },
            { id: 'lineKing.manipulate.camel', processor: transformer.transformCamel },
            { id: 'lineKing.manipulate.kebab', processor: transformer.transformKebab },
            { id: 'lineKing.manipulate.snake', processor: transformer.transformSnake },
            { id: 'lineKing.manipulate.pascal', processor: transformer.transformPascal },
            { id: 'lineKing.manipulate.sentence', processor: transformer.transformSentence },
            { id: 'lineKing.manipulate.title', processor: transformer.transformTitle },
            { id: 'lineKing.dev.urlEncode', processor: transformer.transformUrlEncode },
            { id: 'lineKing.dev.urlDecode', processor: transformer.transformUrlDecode },
            { id: 'lineKing.dev.base64Encode', processor: transformer.transformBase64Encode },
            { id: 'lineKing.dev.base64Decode', processor: transformer.transformBase64Decode },
            { id: 'lineKing.dev.jsonEscape', processor: transformer.transformJsonEscape },
            { id: 'lineKing.dev.jsonUnescape', processor: transformer.transformJsonUnescape },
            { id: 'lineKing.dev.jsonSort', processor: transformer.transformJsonSort },
            { id: 'lineKing.dev.jsonMinify', processor: transformer.transformJsonMinify },
        ],
        false,
    );

    factory.registerLineCommand({
        id: 'lineKing.manipulate.join',
        processor: (lines) => transformer.transformJoin(lines, getJoinSeparator()),
        expandSelection: true,
    });

    factory.registerAsyncCommand({
        id: COMMANDS.DUPLICATE_SELECTION,
        handler: async (editor) => {
            const { getEOL } = await import('../utils/text-utils.js');
            const eol = getEOL(editor.document);
            await editor.edit((editBuilder) => {
                editor.selections.forEach((selection) => {
                    const text = editor.document.getText(selection);
                    editBuilder.insert(selection.end, eol + text);
                });
            });
        },
    });

    factory.registerAsyncCommand({
        id: COMMANDS.SPLIT_LINES,
        handler: async (editor) => {
            const separator = await vscode.window.showInputBox({
                prompt: 'Enter separator character(s) to split on',
                value: ',',
                placeHolder: ',',
            });
            if (separator === undefined) return;
            await applyLineAction(editor, (lines) => {
                const result: string[] = [];
                for (const line of lines) {
                    result.push(...line.split(separator));
                }
                return result;
            });
        },
    });

    factory.registerAsyncCommand({
        id: COMMANDS.ALIGN_LINES,
        handler: async (editor) => {
            const separator = await vscode.window.showInputBox({
                prompt: 'Enter separator to align',
                placeHolder: 'e.g. "=" or ":" or ","',
            });
            if (separator === undefined || separator === '') return;
            await applyLineAction(editor, (lines) => {
                let maxPos = 0;
                const splitLines = lines.map((line) => {
                    const idx = line.indexOf(separator);
                    if (idx !== -1 && idx > maxPos) maxPos = idx;
                    return { line, idx };
                });
                return splitLines.map((item) => {
                    if (item.idx === -1) return item.line;
                    const before = item.line.substring(0, item.idx);
                    const after = item.line.substring(item.idx + separator.length);
                    const spaces = Math.max(0, maxPos - before.length);
                    return `${before}${' '.repeat(spaces)} ${separator} ${after}`;
                });
            });
        },
    });

    factory.registerAsyncCommand({
        id: COMMANDS.INSERT_SEQUENCE,
        handler: async (editor) => {
            await applyLineAction(editor, (lines) => lines.map((line, i) => `${i + 1} ${line}`));
        },
    });
}
