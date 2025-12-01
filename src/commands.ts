import * as vscode from 'vscode';
import { COMMANDS } from './constants';
import * as cleaner from './lib/cleaner';
import { sortCssProperties } from './lib/css-sorter';
import * as sorter from './lib/sorter';
import * as transformer from './lib/transformer';
import { toggleWhitespaceChars } from './lib/visualizer';
import { applyLineAction } from './utils/editor';

export function registerCommands(context: vscode.ExtensionContext, updateContextCallback: () => void): void {

    // Helper for Registration
    const register = (cmd: string, fn: (lines: string[]) => string[], expandSelection = true) => {
        context.subscriptions.push(vscode.commands.registerTextEditorCommand(cmd, (editor) => {
            return applyLineAction(editor, fn, { expandSelection });
        }));
    };

    // --- Sorters ---
    register('lineKing.sort.asc', sorter.sortAsc);
    register('lineKing.sort.asc.insensitive', sorter.sortAscInsensitive);
    register('lineKing.sort.desc', sorter.sortDesc);
    register('lineKing.sort.desc.insensitive', sorter.sortDescInsensitive);
    register('lineKing.sort.unique', sorter.sortUnique);
    register('lineKing.sort.unique.insensitive', sorter.sortUniqueInsensitive);
    register('lineKing.sort.natural', sorter.sortNatural);
    register('lineKing.sort.length.asc', sorter.sortLengthAsc);
    register('lineKing.sort.length.desc', sorter.sortLengthDesc);
    register('lineKing.sort.reverse', sorter.sortReverse);
    register('lineKing.sort.ip', sorter.sortIP);
    register('lineKing.sort.shuffle', sorter.sortShuffle);

    context.subscriptions.push(vscode.commands.registerTextEditorCommand(COMMANDS.SORT_CSS, async (editor) => {
        if (!editor || !editor.document) return;
        return sortCssProperties(editor);
    }));

    // --- Cleaners ---
    register('lineKing.tidy.removeBlank', cleaner.removeBlankLines);
    register('lineKing.tidy.condenseBlank', cleaner.condenseBlankLines);
    register('lineKing.tidy.removeDuplicates', cleaner.removeDuplicateLines);
    register('lineKing.tidy.keepDuplicates', cleaner.keepOnlyDuplicates);
    register('lineKing.tidy.trimTrailing', cleaner.trimTrailingWhitespace);
    register('lineKing.tidy.trimLeading', cleaner.trimLeadingWhitespace);
    register('lineKing.tidy.trimBoth', cleaner.trimBothWhitespace);

    // --- Transformers ---
    register('lineKing.manipulate.upper', transformer.transformUpper, false);
    register('lineKing.manipulate.lower', transformer.transformLower, false);
    register('lineKing.manipulate.camel', transformer.transformCamel, false);
    register('lineKing.manipulate.kebab', transformer.transformKebab, false);
    register('lineKing.manipulate.snake', transformer.transformSnake, false);
    register('lineKing.manipulate.pascal', transformer.transformPascal, false);
    register('lineKing.manipulate.sentence', transformer.transformSentence, false);
    register('lineKing.manipulate.title', transformer.transformTitle, false);
    register('lineKing.manipulate.join', transformer.transformJoin, false);

    // Encoders
    register('lineKing.dev.urlEncode', transformer.transformUrlEncode, false);
    register('lineKing.dev.urlDecode', transformer.transformUrlDecode, false);
    register('lineKing.dev.base64Encode', transformer.transformBase64Encode, false);
    register('lineKing.dev.base64Decode', transformer.transformBase64Decode, false);
    register('lineKing.dev.jsonEscape', transformer.transformJsonEscape, false);
    register('lineKing.dev.jsonUnescape', transformer.transformJsonUnescape, false);

    // --- Interactive & Tools ---
    context.subscriptions.push(vscode.commands.registerTextEditorCommand(COMMANDS.SPLIT_LINES, async (editor) => {
        if (!editor || !editor.document) return;
        return transformer.splitLinesInteractive(editor);
    }));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand(COMMANDS.ALIGN_LINES, async (editor) => {
        if (!editor || !editor.document) return;
        return transformer.alignToSeparatorInteractive(editor);
    }));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand(COMMANDS.INSERT_SEQUENCE, async (editor) => {
        if (!editor || !editor.document) return;
        return transformer.insertNumericSequence(editor);
    }));

    context.subscriptions.push(vscode.commands.registerTextEditorCommand(COMMANDS.DUPLICATE_SELECTION, async (editor) => {
        if (!editor || !editor.document) return;
        const selections = [...editor.selections].sort((a, b) => b.start.compareTo(a.start));
        await editor.edit(editBuilder => {
            for (const selection of selections) {
                const text = editor.document.getText(selection.isEmpty ? editor.document.lineAt(selection.start.line).range : selection);
                const insertPos = selection.isEmpty ? editor.document.lineAt(selection.start.line).range.end : selection.end;
                const insertText = selection.isEmpty ? ('\n' + text) : text;
                editBuilder.insert(insertPos, insertText);
            }
        });
    }));

    // --- Utilities ---
    context.subscriptions.push(vscode.commands.registerTextEditorCommand(COMMANDS.CONVERT_LF, (editor) => {
        if (!editor || !editor.document) return;
        return editor.edit(eb => eb.setEndOfLine(vscode.EndOfLine.LF));
    }));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand(COMMANDS.CONVERT_CRLF, (editor) => {
        if (!editor || !editor.document) return;
        return editor.edit(eb => eb.setEndOfLine(vscode.EndOfLine.CRLF));
    }));

    // Whitespace characters visibility (line endings, spaces, tabs)
    context.subscriptions.push(vscode.commands.registerCommand(COMMANDS.SHOW_ALL_CHARS, () => {
        toggleWhitespaceChars(true);
        updateContextCallback();
    }));
    context.subscriptions.push(vscode.commands.registerCommand(COMMANDS.HIDE_ALL_CHARS, () => {
        toggleWhitespaceChars(false);
        updateContextCallback();
    }));

    // Debug
    context.subscriptions.push(vscode.commands.registerCommand(COMMANDS.DEBUG_CONTEXT, () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No active editor');
            return;
        }
        vscode.window.showInformationMessage('Context Debug: See Debug Console for details (Functionality moved to simplified view)');
    }));
}
