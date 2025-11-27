import * as vscode from 'vscode';
import * as cleaner from './lib/cleaner';
import { sortCssProperties } from './lib/css-sorter';
import * as sorter from './lib/sorter';
import * as transformer from './lib/transformer';
import { toggleLineEndings, updateDecorations } from './lib/visualizer';
import { applyLineAction } from './utils/editor';

export function activate(context: vscode.ExtensionContext) {

    // --- Sorting Commands ---
    const registerSort = (cmd: string, fn: (lines: string[]) => string[]) => {
        context.subscriptions.push(vscode.commands.registerTextEditorCommand(cmd, (editor) => {
            applyLineAction(editor, fn);
        }));
    };

    registerSort('lineKing.sort.asc', sorter.sortAsc);
    registerSort('lineKing.sort.asc.insensitive', sorter.sortAscInsensitive);
    registerSort('lineKing.sort.desc', sorter.sortDesc);
    registerSort('lineKing.sort.unique', sorter.sortUnique);
    registerSort('lineKing.sort.unique.insensitive', sorter.sortUniqueInsensitive);
    registerSort('lineKing.sort.natural', sorter.sortNatural);
    registerSort('lineKing.sort.length.asc', sorter.sortLengthAsc);
    registerSort('lineKing.sort.length.desc', sorter.sortLengthDesc);
    registerSort('lineKing.sort.shuffle', sorter.sortShuffle);

    // --- CSS ---
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('lineKing.sort.css', (editor) => {
        sortCssProperties(editor);
    }));

    // --- Tidy Commands ---
    const registerTidy = (cmd: string, fn: (lines: string[]) => string[]) => {
        context.subscriptions.push(vscode.commands.registerTextEditorCommand(cmd, (editor) => {
            applyLineAction(editor, fn);
        }));
    };

    registerTidy('lineKing.tidy.removeBlank', cleaner.removeBlankLines);
    registerTidy('lineKing.tidy.condenseBlank', cleaner.condenseBlankLines);
    registerTidy('lineKing.tidy.removeDuplicates', cleaner.removeDuplicates);
    registerTidy('lineKing.tidy.keepDuplicates', cleaner.keepOnlyDuplicates);
    registerTidy('lineKing.tidy.trimTrailing', cleaner.trimTrailingWhitespace);

    // --- Manipulation Commands ---
    const registerManip = (cmd: string, fn: (lines: string[]) => string[]) => {
        context.subscriptions.push(vscode.commands.registerTextEditorCommand(cmd, (editor) => {
            applyLineAction(editor, fn);
        }));
    };

    registerManip('lineKing.manipulate.upper', transformer.transformUpper);
    registerManip('lineKing.manipulate.lower', transformer.transformLower);
    registerManip('lineKing.manipulate.camel', transformer.transformCamel);
    registerManip('lineKing.manipulate.kebab', transformer.transformKebab);
    registerManip('lineKing.manipulate.snake', transformer.transformSnake);
    registerManip('lineKing.manipulate.pascal', transformer.transformPascal);
    registerManip('lineKing.manipulate.join', transformer.transformJoin);

    // Special case for Split (needs input)
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('lineKing.manipulate.split', (editor) => {
        transformer.splitLinesInteractive(editor);
    }));

    // Special case for Duplicate (needs simple line copy)
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('lineKing.manipulate.duplicate', async (editor) => {
        const selections = editor.selections;
        // Sort bottom up
        const sorted = [...selections].sort((a, b) => b.start.compareTo(a.start));

        await editor.edit(editBuilder => {
            for (const selection of sorted) {
                const text = editor.document.getText(selection.isEmpty ? editor.document.lineAt(selection.start.line).range : selection);
                // Insert after
                const insertPos = selection.isEmpty
                    ? editor.document.lineAt(selection.start.line).range.end
                    : selection.end;

                // If line duplicate, add newline
                const insertText = selection.isEmpty ? ('\n' + text) : text;
                editBuilder.insert(insertPos, insertText);
            }
        });
    }));

    // --- Visualization ---
    context.subscriptions.push(vscode.commands.registerCommand('lineKing.util.toggleLineEndings', toggleLineEndings));

    // Listeners for visualization
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => updateDecorations(editor)),
        vscode.workspace.onDidChangeTextDocument(e => {
            if (vscode.window.activeTextEditor && e.document === vscode.window.activeTextEditor.document) {
                updateDecorations(vscode.window.activeTextEditor);
            }
        })
    );

    // --- Cleanup on Save ---
    context.subscriptions.push(vscode.workspace.onWillSaveTextDocument(event => {
        const config = vscode.workspace.getConfiguration('lineKing');
        const action = config.get<string>('cleanupOnSave');
        const editor = vscode.window.activeTextEditor;

        if (!editor || event.document !== editor.document || action === 'none') return;

        // Note: applyLineAction is async, so we use waitUntil
        const promise = (async () => {
            if (action === 'removeBlankLines') await applyLineAction(editor, cleaner.removeBlankLines);
            else if (action === 'trimTrailingWhitespace') await applyLineAction(editor, cleaner.trimTrailingWhitespace);
            else if (action === 'sortCssProperties') await sortCssProperties(editor);
        })();

        event.waitUntil(promise);
    }));
}

export function deactivate() { }
