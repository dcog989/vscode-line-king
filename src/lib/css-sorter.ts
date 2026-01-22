import * as vscode from 'vscode';
import { configCache } from '../utils/config-cache.js';
import { sortCssText } from './css-sorter-core.js';

type SortStrategy = 'alphabetical' | 'length';

/**
 * Find rule block containing a specific position
 * Returns the range or null if not inside a rule block
 */
function findCssRuleBlock(
    document: vscode.TextDocument,
    position: vscode.Position,
): vscode.Range | null {
    const text = document.getText();
    const offset = document.offsetAt(position);

    let openBracePos = -1;
    let braceDepth = 0;

    for (let i = offset; i >= 0; i--) {
        const char = text[i];
        if (char === '}') {
            braceDepth++;
        } else if (char === '{') {
            if (braceDepth === 0) {
                openBracePos = i;
                break;
            }
            braceDepth--;
        }
    }

    if (openBracePos === -1) {
        return null;
    }

    let closeBracePos = -1;
    braceDepth = 0;

    for (let i = offset; i < text.length; i++) {
        const char = text[i];
        if (char === '{') {
            braceDepth++;
        } else if (char === '}') {
            if (braceDepth === 0) {
                closeBracePos = i;
                break;
            }
            braceDepth--;
        }
    }

    if (closeBracePos === -1) {
        return null;
    }

    let ruleStartPos = openBracePos;
    for (let i = openBracePos - 1; i >= 0; i--) {
        const char = text[i];
        if (char === '}' || char === ';') {
            ruleStartPos = i + 1;
            break;
        }
        if (i === 0) {
            ruleStartPos = 0;
            break;
        }
    }

    while (ruleStartPos < openBracePos && /\s/.test(text[ruleStartPos])) {
        ruleStartPos++;
    }

    return new vscode.Range(
        document.positionAt(ruleStartPos),
        document.positionAt(closeBracePos + 1),
    );
}

/**
 * Thresholds for optimization
 */
const SELECTION_OPTIMIZATION_THRESHOLD = 50000;

const MAX_SAFE_CSS_LINES = 100000;

/**
 * Sort CSS properties in active editor using custom sorter
 * Optimized for large files with selection-based processing
 */
export async function sortCssProperties(editor: vscode.TextEditor): Promise<void> {
    const document = editor.document;
    const selection = editor.selection;
    const strategy = configCache.getCssSortStrategy() as SortStrategy;
    const documentText = document.getText();
    const lineCount = document.lineCount;

    if (lineCount > MAX_SAFE_CSS_LINES) {
        const continueProcessing = await vscode.window.showWarningMessage(
            `This CSS file is very large (${lineCount.toLocaleString()} lines). Processing may be slow. Consider selecting a specific section instead.`,
            'Continue Anyway',
            'Cancel',
        );
        if (continueProcessing !== 'Continue Anyway') {
            return;
        }
    }

    try {
        let textToProcess: string;
        let rangeToReplace: vscode.Range;

        if (lineCount > SELECTION_OPTIMIZATION_THRESHOLD) {
            if (!selection.isEmpty) {
                const startLine = document.lineAt(selection.start.line);
                const endLine = document.lineAt(selection.end.line);
                rangeToReplace = new vscode.Range(startLine.range.start, endLine.range.end);
                textToProcess = document.getText(rangeToReplace);
            } else {
                const cursorRuleBlock = findCssRuleBlock(document, selection.active);

                if (cursorRuleBlock) {
                    rangeToReplace = cursorRuleBlock;
                    textToProcess = document.getText(cursorRuleBlock);
                } else {
                    vscode.window.showInformationMessage(
                        'Line King: Place cursor inside a CSS rule block to sort properties.',
                    );
                    return;
                }
            }
        } else {
            textToProcess = documentText;
            rangeToReplace = new vscode.Range(
                document.positionAt(0),
                document.positionAt(documentText.length),
            );
        }

        const result = sortCssText(textToProcess, strategy);

        if (result === textToProcess) {
            return;
        }

        await editor.edit((editBuilder: vscode.TextEditorEdit) => {
            editBuilder.replace(rangeToReplace, result);
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(
            `Line King: Unable to sort CSS properties. ${errorMessage.substring(0, 100)}`,
        );
    }
}

export { sortCssText, type SortStrategy };
