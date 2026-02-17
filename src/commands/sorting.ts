import * as vscode from 'vscode';
import { COMMANDS } from '../constants.js';
import { createCommandFactory } from './factory.js';
import * as sorter from '../lib/sorter.js';

export function registerSortingCommands(context: vscode.ExtensionContext): void {
    const factory = createCommandFactory(context);

    factory.registerLineCommands(
        [
            { id: 'lineKing.sort.asc', processor: sorter.sortAsc },
            { id: 'lineKing.sort.asc.insensitive', processor: sorter.sortAscInsensitive },
            { id: 'lineKing.sort.desc', processor: sorter.sortDesc },
            { id: 'lineKing.sort.desc.insensitive', processor: sorter.sortDescInsensitive },
            { id: 'lineKing.sort.asc.ignoreSpecial', processor: sorter.sortAscIgnoreSpecial },
            {
                id: 'lineKing.sort.asc.ignoreSpecial.insensitive',
                processor: sorter.sortAscIgnoreSpecialInsensitive,
            },
            { id: 'lineKing.sort.unique', processor: sorter.sortUnique },
            { id: 'lineKing.sort.unique.insensitive', processor: sorter.sortUniqueInsensitive },
            { id: 'lineKing.sort.natural', processor: sorter.sortNatural },
            { id: 'lineKing.sort.length.asc', processor: sorter.sortLengthAsc },
            { id: 'lineKing.sort.length.desc', processor: sorter.sortLengthDesc },
            { id: 'lineKing.sort.reverse', processor: sorter.sortReverse },
            { id: 'lineKing.sort.ip', processor: sorter.sortIP },
            { id: 'lineKing.sort.shuffle', processor: sorter.sortShuffle },
        ],
        true,
    );

    factory.registerAsyncCommand({
        id: COMMANDS.SORT_CSS,
        handler: async (editor) => {
            const { sortCssProperties } = await import('../lib/css-sorter.js');
            return await sortCssProperties(editor);
        },
    });

    factory.registerAsyncCommands([
        {
            id: 'lineKing.sort.json.key',
            handler: async (editor) => {
                const { applyLineAction } = await import('../utils/editor.js');
                const { transformJsonSortByKey } = await import('../lib/transformer.js');
                await applyLineAction(editor, transformJsonSortByKey, { expandSelection: true });
            },
        },
        {
            id: 'lineKing.sort.json.value',
            handler: async (editor) => {
                const { applyLineAction } = await import('../utils/editor.js');
                const { transformJsonSortByValue } = await import('../lib/transformer.js');
                await applyLineAction(editor, transformJsonSortByValue, { expandSelection: true });
            },
        },
    ]);
}
