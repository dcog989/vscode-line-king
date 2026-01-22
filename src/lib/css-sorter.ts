import * as vscode from 'vscode';
import { configCache } from '../utils/config-cache.js';
import type { Plugin } from 'postcss';

/**
 * Modern CSS property sorter using PostCSS
 * Supports nested rules (Sass/Less) and modern CSS syntax
 * Optimized for selection-based sorting to avoid parsing large files
 * NOTE: PostCSS is imported lazily to avoid ~500ms startup time penalty
 */

interface SortOptions {
    strategy: 'alphabetical' | 'length';
}

/**
 * Threshold for using selection-only processing (in lines)
 * If document is larger than this, only process selection or current rule block
 * This matches the LARGE_FILE_THRESHOLD in editor.ts for consistency
 */
const SELECTION_OPTIMIZATION_THRESHOLD = 50000;

/**
 * Maximum safe size for PostCSS processing (in lines)
 * For larger files, we show a warning to avoid potential memory issues
 */
const MAX_SAFE_CSS_LINES = 100000;

/**
 * PostCSS plugin to sort CSS declarations within rules
 * Preserves comments and other non-declaration nodes
 */
function sortDeclarationsPlugin(opts: SortOptions = { strategy: 'alphabetical' }): Plugin {
    return {
        postcssPlugin: 'sort-declarations',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Rule(rule: any) {
            // Collect all nodes with their positions
            const nodes: Array<{ node: any; index: number; type: string }> = []; // eslint-disable-line @typescript-eslint/no-explicit-any
            let declarationCount = 0;

            rule.each((node: any, index: number) => {
                // eslint-disable-line @typescript-eslint/no-explicit-any
                nodes.push({
                    node,
                    index,
                    type: node.type,
                });
                if (node.type === 'decl') {
                    declarationCount++;
                }
            });

            // Only proceed if there are at least 2 declarations to sort
            if (declarationCount <= 1) {
                return;
            }

            // Separate declarations from other nodes (comments, at-rules, etc.)
            const declarations: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
            const nonDeclarations: Array<{ node: any; originalIndex: number }> = []; // eslint-disable-line @typescript-eslint/no-explicit-any

            nodes.forEach(({ node, index, type }) => {
                if (type === 'decl') {
                    declarations.push(node);
                } else {
                    nonDeclarations.push({ node, originalIndex: index });
                }
            });

            // Sort declarations based on strategy
            const sorted = [...declarations].sort((a, b) => {
                if (opts.strategy === 'length') {
                    // Sort by declaration length (property + value)
                    const lengthA = `${a.prop}:${a.value}`.length;
                    const lengthB = `${b.prop}:${b.value}`.length;
                    return lengthA - lengthB;
                } else {
                    // Default: Alphabetical by property name
                    return a.prop.localeCompare(b.prop);
                }
            });

            // Remove all child nodes
            rule.removeAll();

            // Rebuild the rule, preserving non-declaration nodes in their relative positions
            let declIndex = 0;
            let nonDeclIndex = 0;

            // Interleave sorted declarations with preserved non-declarations
            // Strategy: Insert non-declarations at their approximate relative positions
            for (let i = 0; i < nodes.length; i++) {
                const originalNode = nodes[i];

                if (originalNode.type === 'decl') {
                    // Insert next sorted declaration
                    if (declIndex < sorted.length) {
                        rule.append(sorted[declIndex]);
                        declIndex++;
                    }
                } else {
                    // Insert non-declaration in its original relative position
                    if (nonDeclIndex < nonDeclarations.length) {
                        const { node } = nonDeclarations[nonDeclIndex];
                        rule.append(node);
                        nonDeclIndex++;
                    }
                }
            }
        },
    };
}

sortDeclarationsPlugin.postcss = true;

/**
 * Find the CSS rule block containing the cursor/selection
 * Returns the range of the rule block or null if not found
 */
function findCssRuleBlock(
    document: vscode.TextDocument,
    position: vscode.Position,
): vscode.Range | null {
    const text = document.getText();
    const offset = document.offsetAt(position);

    // Find the opening brace before the cursor
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
        return null; // Not inside a rule block
    }

    // Find the closing brace after the cursor
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
        return null; // Unclosed rule block
    }

    // Find the start of the rule (selector) by going back from the opening brace
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

    // Skip leading whitespace in the selector
    while (ruleStartPos < openBracePos && /\s/.test(text[ruleStartPos])) {
        ruleStartPos++;
    }

    return new vscode.Range(
        document.positionAt(ruleStartPos),
        document.positionAt(closeBracePos + 1),
    );
}

/**
 * Sort CSS properties in the active editor using PostCSS
 * Optimized to only process selections or cursor rule blocks in large files
 */
export async function sortCssProperties(editor: vscode.TextEditor): Promise<void> {
    const document = editor.document;
    const selection = editor.selection;
    const strategy = configCache.getCssSortStrategy();
    const documentText = document.getText();
    const lineCount = document.lineCount;

    // Warn for extremely large files
    if (lineCount > MAX_SAFE_CSS_LINES) {
        const continueProcessing = await vscode.window.showWarningMessage(
            `This CSS file is very large (${lineCount.toLocaleString()} lines). Processing may be slow or cause memory issues. Consider selecting a specific section instead.`,
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

        // Optimization: For large files, only process selection or current rule block
        // This matches the LARGE_FILE_THRESHOLD in editor.ts for consistency
        if (lineCount > SELECTION_OPTIMIZATION_THRESHOLD) {
            if (!selection.isEmpty) {
                // User has selected text - only process the selection
                const startLine = document.lineAt(selection.start.line);
                const endLine = document.lineAt(selection.end.line);
                rangeToReplace = new vscode.Range(startLine.range.start, endLine.range.end);
                textToProcess = document.getText(rangeToReplace);
            } else {
                // No selection - find and process only the rule block containing the cursor
                const cursorRuleBlock = findCssRuleBlock(document, selection.active);

                if (cursorRuleBlock) {
                    rangeToReplace = cursorRuleBlock;
                    textToProcess = document.getText(cursorRuleBlock);
                } else {
                    // Cursor not in a rule block - inform user
                    vscode.window.showInformationMessage(
                        'Line King: Place cursor inside a CSS rule block to sort properties.',
                    );
                    return;
                }
            }
        } else {
            // Small file - process the entire document
            textToProcess = documentText;
            rangeToReplace = new vscode.Range(
                document.positionAt(0),
                document.positionAt(documentText.length),
            );
        }

        // Lazy-load PostCSS only when needed (avoids ~500ms startup time penalty)
        const postcss = (await import('postcss')).default;

        // Process with PostCSS
        const result = await postcss([sortDeclarationsPlugin({ strategy })]).process(
            textToProcess,
            {
                from: undefined,
                // PostCSS options for better error handling
                map: false,
            },
        );

        // Only update if content changed
        if (result.css === textToProcess) {
            return;
        }

        // Apply the transformation
        await editor.edit((editBuilder: vscode.TextEditorEdit) => {
            editBuilder.replace(rangeToReplace, result.css);
        });
    } catch (error) {
        // PostCSS parsing failed - likely invalid CSS syntax

        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(
            `Line King: Unable to parse CSS. ${errorMessage.substring(0, 100)}`,
        );
    }
}
