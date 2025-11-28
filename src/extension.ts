import * as vscode from 'vscode';
import * as cleaner from './lib/cleaner';
import { sortCssProperties } from './lib/css-sorter';
import * as sorter from './lib/sorter';
import * as transformer from './lib/transformer';
import { isLineEndingsVisible, toggleLineEndings, updateDecorations } from './lib/visualizer';
import { applyLineAction } from './utils/editor';

export function activate(context: vscode.ExtensionContext) {

    // --- Context Monitoring (Smart Menus) ---
    const updateContextKeys = () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.commands.executeCommand('setContext', 'lineKing.isMultiLine', false);
            vscode.commands.executeCommand('setContext', 'lineKing.lineEndingsVisible', false);
            return;
        }

        // Check if we have:
        // 1. Multiple selections (even on same line), OR
        // 2. A single selection that spans multiple lines, OR
        // 3. Multiple cursor positions
        const hasMultipleSelections = editor.selections.length > 1;
        const hasMultiLineSelection = editor.selections.some(s => s.start.line !== s.end.line);
        const isMulti = hasMultipleSelections || hasMultiLineSelection;

        vscode.commands.executeCommand('setContext', 'lineKing.isMultiLine', isMulti);
        vscode.commands.executeCommand('setContext', 'lineKing.lineEndingsVisible', isLineEndingsVisible());
    };

    // Register event listeners
    context.subscriptions.push(
        vscode.window.onDidChangeTextEditorSelection(e => {
            // Use immediate update when selection changes
            updateContextKeys();
        }),
        vscode.window.onDidChangeActiveTextEditor(editor => {
            updateContextKeys();
        })
    );

    // Initialize context immediately AND on next tick
    updateContextKeys();

    // Also update after a short delay to catch any restored selections
    setTimeout(() => {
        updateContextKeys();
    }, 100);

    // Debug command to check context state
    context.subscriptions.push(vscode.commands.registerCommand('lineKing.debug.checkContext', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No active editor');
            return;
        }

        const selections = editor.selections;
        const info = selections.map((s, i) =>
            `Selection ${i}: Line ${s.start.line}-${s.end.line}, Char ${s.start.character}-${s.end.character}`
        ).join('\n');

        const hasMultipleSelections = selections.length > 1;
        const hasMultiLineSelection = selections.some(s => s.start.line !== s.end.line);
        const isMulti = hasMultipleSelections || hasMultiLineSelection;

        vscode.window.showInformationMessage(
            `Line King Context Debug:\n` +
            `Selections: ${selections.length}\n` +
            `Has multiple selections: ${hasMultipleSelections}\n` +
            `Has multi-line selection: ${hasMultiLineSelection}\n` +
            `isMultiLine should be: ${isMulti}\n\n` +
            info,
            { modal: true }
        );
    }));

    // --- Helper for Registration ---
    // Added expandSelection parameter (defaults to true for Line operations)
    const register = (cmd: string, fn: (lines: string[]) => string[], expandSelection = true) => {
        context.subscriptions.push(vscode.commands.registerTextEditorCommand(cmd, (editor) => {
            return applyLineAction(editor, fn, { expandSelection });
        }));
    };

    // --- Sorters (Keep expandSelection = true) ---
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

    context.subscriptions.push(vscode.commands.registerTextEditorCommand('lineKing.sort.css', async (editor) => {
        return sortCssProperties(editor);
    }));

    // --- Cleaners (Keep expandSelection = true) ---
    register('lineKing.tidy.removeBlank', cleaner.removeBlankLines);
    register('lineKing.tidy.condenseBlank', cleaner.condenseBlankLines);
    register('lineKing.tidy.removeDuplicates', cleaner.removeDuplicateLines);
    register('lineKing.tidy.keepDuplicates', cleaner.keepOnlyDuplicates);
    register('lineKing.tidy.trimTrailing', cleaner.trimTrailingWhitespace);
    register('lineKing.tidy.trimLeading', cleaner.trimLeadingWhitespace);
    register('lineKing.tidy.trimBoth', cleaner.trimBothWhitespace);

    // --- Transformers (Use expandSelection = false) ---
    register('lineKing.manipulate.upper', transformer.transformUpper, false);
    register('lineKing.manipulate.lower', transformer.transformLower, false);
    register('lineKing.manipulate.camel', transformer.transformCamel, false);
    register('lineKing.manipulate.kebab', transformer.transformKebab, false);
    register('lineKing.manipulate.snake', transformer.transformSnake, false);
    register('lineKing.manipulate.pascal', transformer.transformPascal, false);
    register('lineKing.manipulate.sentence', transformer.transformSentence, false);
    register('lineKing.manipulate.title', transformer.transformTitle, false);
    register('lineKing.manipulate.join', transformer.transformJoin, false);

    // Encoders (Use expandSelection = false)
    register('lineKing.dev.urlEncode', transformer.transformUrlEncode, false);
    register('lineKing.dev.urlDecode', transformer.transformUrlDecode, false);
    register('lineKing.dev.base64Encode', transformer.transformBase64Encode, false);
    register('lineKing.dev.base64Decode', transformer.transformBase64Decode, false);
    register('lineKing.dev.jsonEscape', transformer.transformJsonEscape, false);
    register('lineKing.dev.jsonUnescape', transformer.transformJsonUnescape, false);

    // --- Interactive ---
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('lineKing.manipulate.split', async (editor) => {
        return transformer.splitLinesInteractive(editor);
    }));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('lineKing.manipulate.align', async (editor) => {
        return transformer.alignToSeparatorInteractive(editor);
    }));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('lineKing.manipulate.sequence', async (editor) => {
        return transformer.insertNumericSequence(editor);
    }));

    // --- Utilities ---
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('lineKing.manipulate.duplicate', async (editor) => {
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

    context.subscriptions.push(vscode.commands.registerTextEditorCommand('lineKing.util.eol.lf', (editor) => {
        return editor.edit(eb => eb.setEndOfLine(vscode.EndOfLine.LF));
    }));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('lineKing.util.eol.crlf', (editor) => {
        return editor.edit(eb => eb.setEndOfLine(vscode.EndOfLine.CRLF));
    }));

    // Line ending visibility toggle with smart naming
    context.subscriptions.push(vscode.commands.registerCommand('lineKing.util.showLineEndings', () => {
        toggleLineEndings(true);
        updateContextKeys();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('lineKing.util.hideLineEndings', () => {
        toggleLineEndings(false);
        updateContextKeys();
    }));

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            updateDecorations(editor);
            updateContextKeys();
        }),
        vscode.workspace.onDidChangeTextDocument(e => {
            if (vscode.window.activeTextEditor && e.document === vscode.window.activeTextEditor.document) {
                updateDecorations(vscode.window.activeTextEditor);
            }
        })
    );

    // Cleanup on Save
    context.subscriptions.push(vscode.workspace.onWillSaveTextDocument(event => {
        const config = vscode.workspace.getConfiguration('lineKing');
        const action = config.get<string>('cleanupOnSave');
        const editor = vscode.window.activeTextEditor;

        if (!editor || event.document !== editor.document || action === 'none') return;

        const promise = (async () => {
            if (action === 'removeBlankLines') await applyLineAction(editor, cleaner.removeBlankLines);
            else if (action === 'trimTrailingWhitespace') await applyLineAction(editor, cleaner.trimTrailingWhitespace);
            else if (action === 'sortCssProperties') await sortCssProperties(editor);
        })();

        event.waitUntil(promise);
    }));
}

export function deactivate() { }
