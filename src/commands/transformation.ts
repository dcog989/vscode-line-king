import * as vscode from 'vscode';
import { COMMANDS } from '../constants.js';
import { getEOL } from '../utils/text-utils.js';
import * as transformer from '../lib/transformer.js';
import { createCommandFactory } from './factory.js';

/**
 * Registers all transformation commands (case changes, encoding, etc.)
 * Uses CommandFactory for consistent registration
 */
export function registerTransformationCommands(context: vscode.ExtensionContext): void {
    const factory = createCommandFactory(context);

    // Transformation commands DO NOT expand selection (work on exact selection)
    factory.registerLineCommands([
        // Case transformations
        { id: 'lineKing.manipulate.upper', processor: transformer.transformUpper },
        { id: 'lineKing.manipulate.lower', processor: transformer.transformLower },
        { id: 'lineKing.manipulate.camel', processor: transformer.transformCamel },
        { id: 'lineKing.manipulate.kebab', processor: transformer.transformKebab },
        { id: 'lineKing.manipulate.snake', processor: transformer.transformSnake },
        { id: 'lineKing.manipulate.pascal', processor: transformer.transformPascal },
        { id: 'lineKing.manipulate.sentence', processor: transformer.transformSentence },
        { id: 'lineKing.manipulate.title', processor: transformer.transformTitle },

        // Encoding/decoding
        { id: 'lineKing.dev.urlEncode', processor: transformer.transformUrlEncode },
        { id: 'lineKing.dev.urlDecode', processor: transformer.transformUrlDecode },
        { id: 'lineKing.dev.base64Encode', processor: transformer.transformBase64Encode },
        { id: 'lineKing.dev.base64Decode', processor: transformer.transformBase64Decode },
        { id: 'lineKing.dev.jsonEscape', processor: transformer.transformJsonEscape },
        { id: 'lineKing.dev.jsonUnescape', processor: transformer.transformJsonUnescape },

        // Line joining
        { id: 'lineKing.manipulate.join', processor: transformer.transformJoin },
    ], false); // expandSelection: false (work on exact selection)

    // Interactive commands (custom handlers)
    factory.registerAsyncCommands([
        {
            id: COMMANDS.SPLIT_LINES,
            handler: async (editor) => transformer.splitLinesInteractive(editor)
        },
        {
            id: COMMANDS.ALIGN_LINES,
            handler: async (editor) => transformer.alignToSeparatorInteractive(editor)
        },
        {
            id: COMMANDS.INSERT_SEQUENCE,
            handler: async (editor) => transformer.insertNumericSequence(editor)
        },
        {
            id: COMMANDS.DUPLICATE_SELECTION,
            handler: async (editor) => duplicateSelection(editor)
        }
    ]);
}

/**
 * Duplicate selection command - handles multiple selections with offset correction
 */
async function duplicateSelection(editor: vscode.TextEditor): Promise<void> {
    const document = editor.document;
    const selections = [...editor.selections];
    const eol = getEOL(document);
    
    // Group selections by line and track their offsets
    interface SelectionWithOffset {
        selection: vscode.Selection;
        text: string;
        insertPosition: vscode.Position;
        isEmpty: boolean;
        line: number;
        character: number;
    }
    
    const selectionsWithData: SelectionWithOffset[] = selections.map(selection => {
        if (selection.isEmpty) {
            // For empty selections, duplicate the entire line
            const line = document.lineAt(selection.start.line);
            return {
                selection,
                text: line.text,
                insertPosition: line.range.end,
                isEmpty: true,
                line: selection.start.line,
                character: line.range.end.character
            };
        } else {
            // For non-empty selections, duplicate the selected text
            return {
                selection,
                text: document.getText(selection),
                insertPosition: selection.end,
                isEmpty: false,
                line: selection.end.line,
                character: selection.end.character
            };
        }
    });
    
    // Sort selections: first by line (descending), then by character position (descending)
    // This ensures we process from bottom-right to top-left
    selectionsWithData.sort((a, b) => {
        if (a.line !== b.line) {
            return b.line - a.line; // Process lower lines first
        }
        return b.character - a.character; // Process rightmost positions first on same line
    });
    
    await editor.edit(editBuilder => {
        // Track cumulative offset adjustments per line
        const lineOffsets = new Map<number, number>();
        
        for (const item of selectionsWithData) {
            const currentLineOffset = lineOffsets.get(item.line) || 0;
            
            if (item.isEmpty) {
                // Duplicate entire line - insert newline + text
                // Line duplications don't affect character positions on the same line
                editBuilder.insert(item.insertPosition, eol + item.text);
            } else {
                // Duplicate selection - need to adjust for previous insertions on same line
                // Create adjusted position accounting for cumulative insertions
                const adjustedPosition = new vscode.Position(
                    item.line,
                    item.character + currentLineOffset
                );
                
                editBuilder.insert(adjustedPosition, item.text);
                
                // Update the cumulative offset for this line
                // Each insertion shifts subsequent positions by the length of inserted text
                lineOffsets.set(item.line, currentLineOffset + item.text.length);
            }
        }
    });
}
