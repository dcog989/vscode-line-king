import * as vscode from 'vscode';
import { COMMANDS } from '../constants.js';
import { applyLineAction, getJoinSeparator } from '../utils/editor.js';
import { createLazyProxy } from '../utils/lazy-proxy.js';
import { createCommandFactory } from './factory.js';

export function registerTransformationCommands(context: vscode.ExtensionContext): void {
    const factory = createCommandFactory(context);
    const lazyTransformer =
        createLazyProxy<typeof import('../lib/transformer.js')>('../lib/transformer.js');

    factory.registerLineCommands(
        [
            { id: 'lineKing.manipulate.upper', processor: lazyTransformer.transformUpper },
            { id: 'lineKing.manipulate.lower', processor: lazyTransformer.transformLower },
            { id: 'lineKing.manipulate.camel', processor: lazyTransformer.transformCamel },
            { id: 'lineKing.manipulate.kebab', processor: lazyTransformer.transformKebab },
            { id: 'lineKing.manipulate.snake', processor: lazyTransformer.transformSnake },
            { id: 'lineKing.manipulate.pascal', processor: lazyTransformer.transformPascal },
            { id: 'lineKing.manipulate.sentence', processor: lazyTransformer.transformSentence },
            { id: 'lineKing.manipulate.title', processor: lazyTransformer.transformTitle },
            { id: 'lineKing.dev.urlEncode', processor: lazyTransformer.transformUrlEncode },
            { id: 'lineKing.dev.urlDecode', processor: lazyTransformer.transformUrlDecode },
            { id: 'lineKing.dev.base64Encode', processor: lazyTransformer.transformBase64Encode },
            { id: 'lineKing.dev.base64Decode', processor: lazyTransformer.transformBase64Decode },
            { id: 'lineKing.dev.jsonEscape', processor: lazyTransformer.transformJsonEscape },
            { id: 'lineKing.dev.jsonUnescape', processor: lazyTransformer.transformJsonUnescape },
        ],
        false,
    );

    factory.registerLineCommand({
        id: 'lineKing.manipulate.join',
        processor: (lines) => lazyTransformer.transformJoin(lines, getJoinSeparator()),
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
