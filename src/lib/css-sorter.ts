import * as vscode from 'vscode';
import { PERFORMANCE } from '../constants.js';
import { configCache } from '../utils/config-cache.js';
import { sortCssText } from './css-sorter-core.js';

type SortStrategy = 'alphabetical' | 'length';

/**
 * Find rule block containing a specific position
 * Returns the range or null if not inside a rule block
 * Optimized to scan line-by-line instead of character-by-character
 */
function findCssRuleBlock(
    document: vscode.TextDocument,
    position: vscode.Position,
): vscode.Range | null {
    const cursorLine = position.line;
    const startScanLine = Math.max(0, cursorLine - PERFORMANCE.MAX_CSS_SCAN_LINES);
    const endScanLine = Math.min(
        document.lineCount - 1,
        cursorLine + PERFORMANCE.MAX_CSS_SCAN_LINES,
    );

    let braceDepth = 0;
    let openBraceLine = -1;
    let openBraceChar = -1;

    // Scan backwards from cursor to find opening brace
    for (let lineNum = cursorLine; lineNum >= startScanLine; lineNum--) {
        const line = document.lineAt(lineNum);
        const text = line.text;

        // Search from end of line to start
        for (let i = text.length - 1; i >= 0; i--) {
            const char = text[i];
            if (char === '}') {
                braceDepth++;
            } else if (char === '{') {
                if (braceDepth === 0) {
                    openBraceLine = lineNum;
                    openBraceChar = i;
                    break;
                }
                braceDepth--;
            }
        }

        if (openBraceLine !== -1) break;
    }

    if (openBraceLine === -1) {
        return null;
    }

    // Reset brace depth and scan forwards to find closing brace
    braceDepth = 0;
    let closeBraceLine = -1;
    let closeBraceChar = -1;

    for (let lineNum = cursorLine; lineNum <= endScanLine; lineNum++) {
        const line = document.lineAt(lineNum);
        const text = line.text;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '{') {
                braceDepth++;
            } else if (char === '}') {
                if (braceDepth === 0) {
                    closeBraceLine = lineNum;
                    closeBraceChar = i;
                    break;
                }
                braceDepth--;
            }
        }

        if (closeBraceLine !== -1) break;
    }

    if (closeBraceLine === -1) {
        return null;
    }

    // Find rule start (look backwards from opening brace)
    let ruleStartLine = openBraceLine;
    let ruleStartChar = openBraceChar;

    for (let lineNum = openBraceLine; lineNum >= startScanLine; lineNum--) {
        const line = document.lineAt(lineNum);
        const text = line.text;
        const searchEnd = lineNum === openBraceLine ? openBraceChar - 1 : text.length - 1;

        for (let i = searchEnd; i >= 0; i--) {
            const char = text[i];
            if (char === '}' || char === ';') {
                ruleStartLine = lineNum;
                ruleStartChar = i + 1;
                break;
            }
        }

        if (ruleStartLine !== openBraceLine || ruleStartChar !== openBraceChar) break;

        // Check if we hit line start
        if (lineNum < openBraceLine) {
            ruleStartLine = lineNum;
            ruleStartChar = 0;
        }
    }

    // Skip leading whitespace
    const startLine = document.lineAt(ruleStartLine);
    const startText = startLine.text;
    while (ruleStartChar < startText.length && startText[ruleStartChar] <= ' ') {
        ruleStartChar++;
    }

    return new vscode.Range(
        new vscode.Position(ruleStartLine, ruleStartChar),
        new vscode.Position(closeBraceLine, closeBraceChar + 1),
    );
}

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

    if (lineCount > PERFORMANCE.MAX_SAFE_CSS_LINES) {
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

        if (lineCount > PERFORMANCE.LARGE_FILE_LINE_THRESHOLD) {
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
