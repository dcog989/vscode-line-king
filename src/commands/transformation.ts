import * as vscode from 'vscode';
import { COMMANDS } from '../constants.js';
import { createCommandFactory } from './factory.js';

/**
 * Create a lazy proxy for transformer functions
 * Ensures the transformer module (and change-case) is only loaded when actually used
 */
function createLazyTransformerProxy() {
    let transformerModule: typeof import('../lib/transformer.js') | null = null;

    const loadTransformer = async () => {
        if (!transformerModule) {
            transformerModule = await import('../lib/transformer.js');
        }
        return transformerModule;
    };

    return {
        transformUpper: async (
            ...args: Parameters<typeof import('../lib/transformer.js').transformUpper>
        ) => {
            const transformer = await loadTransformer();
            return transformer.transformUpper(...args);
        },
        transformLower: async (
            ...args: Parameters<typeof import('../lib/transformer.js').transformLower>
        ) => {
            const transformer = await loadTransformer();
            return transformer.transformLower(...args);
        },
        transformCamel: async (
            ...args: Parameters<typeof import('../lib/transformer.js').transformCamel>
        ) => {
            const transformer = await loadTransformer();
            return transformer.transformCamel(...args);
        },
        transformKebab: async (
            ...args: Parameters<typeof import('../lib/transformer.js').transformKebab>
        ) => {
            const transformer = await loadTransformer();
            return transformer.transformKebab(...args);
        },
        transformSnake: async (
            ...args: Parameters<typeof import('../lib/transformer.js').transformSnake>
        ) => {
            const transformer = await loadTransformer();
            return transformer.transformSnake(...args);
        },
        transformPascal: async (
            ...args: Parameters<typeof import('../lib/transformer.js').transformPascal>
        ) => {
            const transformer = await loadTransformer();
            return transformer.transformPascal(...args);
        },
        transformSentence: async (
            ...args: Parameters<typeof import('../lib/transformer.js').transformSentence>
        ) => {
            const transformer = await loadTransformer();
            return transformer.transformSentence(...args);
        },
        transformTitle: async (
            ...args: Parameters<typeof import('../lib/transformer.js').transformTitle>
        ) => {
            const transformer = await loadTransformer();
            return transformer.transformTitle(...args);
        },
        transformUrlEncode: async (
            ...args: Parameters<typeof import('../lib/transformer.js').transformUrlEncode>
        ) => {
            const transformer = await loadTransformer();
            return transformer.transformUrlEncode(...args);
        },
        transformUrlDecode: async (
            ...args: Parameters<typeof import('../lib/transformer.js').transformUrlDecode>
        ) => {
            const transformer = await loadTransformer();
            return transformer.transformUrlDecode(...args);
        },
        transformBase64Encode: async (
            ...args: Parameters<typeof import('../lib/transformer.js').transformBase64Encode>
        ) => {
            const transformer = await loadTransformer();
            return transformer.transformBase64Encode(...args);
        },
        transformBase64Decode: async (
            ...args: Parameters<typeof import('../lib/transformer.js').transformBase64Decode>
        ) => {
            const transformer = await loadTransformer();
            return transformer.transformBase64Decode(...args);
        },
        transformJsonEscape: async (
            ...args: Parameters<typeof import('../lib/transformer.js').transformJsonEscape>
        ) => {
            const transformer = await loadTransformer();
            return transformer.transformJsonEscape(...args);
        },
        transformJsonUnescape: async (
            ...args: Parameters<typeof import('../lib/transformer.js').transformJsonUnescape>
        ) => {
            const transformer = await loadTransformer();
            return transformer.transformJsonUnescape(...args);
        },
    };
}

/**
 * Registers all transformation commands (case changes, encoding, etc.)
 * Uses CommandFactory for consistent registration
 *
 * PERFORMANCE CRITICAL: transformer module (and change-case) is lazy-loaded
 */
export function registerTransformationCommands(context: vscode.ExtensionContext): void {
    const factory = createCommandFactory(context);
    const lazyTransformer = createLazyTransformerProxy();

    // Transformation commands DO NOT expand selection (work on exact selection)
    factory.registerLineCommands(
        [
            // Case transformations
            { id: 'lineKing.manipulate.upper', processor: lazyTransformer.transformUpper },
            { id: 'lineKing.manipulate.lower', processor: lazyTransformer.transformLower },
            { id: 'lineKing.manipulate.camel', processor: lazyTransformer.transformCamel },
            { id: 'lineKing.manipulate.kebab', processor: lazyTransformer.transformKebab },
            { id: 'lineKing.manipulate.snake', processor: lazyTransformer.transformSnake },
            { id: 'lineKing.manipulate.pascal', processor: lazyTransformer.transformPascal },
            { id: 'lineKing.manipulate.sentence', processor: lazyTransformer.transformSentence },
            { id: 'lineKing.manipulate.title', processor: lazyTransformer.transformTitle },

            // Encoding/Decoding
            { id: 'lineKing.dev.urlEncode', processor: lazyTransformer.transformUrlEncode },
            { id: 'lineKing.dev.urlDecode', processor: lazyTransformer.transformUrlDecode },
            { id: 'lineKing.dev.base64Encode', processor: lazyTransformer.transformBase64Encode },
            { id: 'lineKing.dev.base64Decode', processor: lazyTransformer.transformBase64Decode },
            { id: 'lineKing.dev.jsonEscape', processor: lazyTransformer.transformJsonEscape },
            { id: 'lineKing.dev.jsonUnescape', processor: lazyTransformer.transformJsonUnescape },
        ],
        false,
    ); // expandSelection: false (keep exact selection)

    // Special commands requiring different handling
    factory.registerAsyncCommand({
        id: COMMANDS.DUPLICATE_SELECTION,
        handler: async (editor) => {
            // Lazy load text utils
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

            const { getEOL } = await import('../utils/text-utils.js');
            const eol = getEOL(editor.document);

            await editor.edit((editBuilder) => {
                editor.selections.forEach((selection) => {
                    const text = editor.document.getText(selection);
                    const lines = text.split(separator).join(eol);
                    editBuilder.replace(selection, lines);
                });
            });
        },
    });

    factory.registerAsyncCommand({
        id: COMMANDS.ALIGN_LINES,
        handler: async (editor) => {
            const separator = await vscode.window.showInputBox({
                prompt: 'Enter separator to align on',
                value: '=',
                placeHolder: '=',
            });

            if (separator === undefined) return;

            const { applyLineAction } = await import('../utils/editor.js');
            await applyLineAction(editor, (lines: string[]) => {
                const parts = lines.map((line) => {
                    const idx = line.indexOf(separator);
                    return idx >= 0
                        ? {
                              left: line.substring(0, idx),
                              sep: separator,
                              right: line.substring(idx + separator.length),
                          }
                        : { left: line, sep: '', right: '' };
                });

                const maxLeft = Math.max(...parts.map((p) => p.left.length));

                return parts.map((p) =>
                    p.sep ? p.left.padEnd(maxLeft, ' ') + p.sep + p.right : p.left,
                );
            });
        },
    });

    factory.registerAsyncCommand({
        id: COMMANDS.INSERT_SEQUENCE,
        handler: async (editor) => {
            const { applyLineAction } = await import('../utils/editor.js');
            await applyLineAction(editor, (lines: string[]) => {
                return lines.map((line, idx) => `${idx + 1}${line}`);
            });
        },
    });
}
