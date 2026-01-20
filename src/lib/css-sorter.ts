import postcss from 'postcss';
import * as vscode from 'vscode';
import { configCache } from '../utils/config-cache.js';

/**
 * Modern CSS property sorter using PostCSS
 * Supports nested rules (Sass/Less) and modern CSS syntax
 * Optimized for selection-based sorting to avoid parsing large files
 */

interface SortOptions {
    strategy: 'alphabetical' | 'length';
}

/**
 * Threshold for using selection-only processing (in characters)
 * If document is larger than this and user has a selection, only process the selection
 */
const SELECTION_OPTIMIZATION_THRESHOLD = 50000; // 50KB

/**
 * PostCSS plugin to sort CSS declarations within rules
 * Preserves comments and other non-declaration nodes
 */
function sortDeclarationsPlugin(opts: SortOptions = { strategy: 'alphabetical' }): postcss.Plugin {
    return {
        postcssPlugin: 'sort-declarations',
        Rule(rule) {
            // Collect all nodes with their positions
            const nodes: Array<{ node: postcss.ChildNode; index: number; type: string }> = [];
            let declarationCount = 0;

            rule.each((node, index) => {
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
            const declarations: postcss.Declaration[] = [];
            const nonDeclarations: Array<{ node: postcss.ChildNode; originalIndex: number }> = [];

            nodes.forEach(({ node, index, type }) => {
                if (type === 'decl') {
                    declarations.push(node as postcss.Declaration);
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
    const documentSize = documentText.length;

    try {
        let textToProcess: string;
        let rangeToReplace: vscode.Range;

        // Optimization: For large files, only process the selection or current rule block
        if (documentSize > SELECTION_OPTIMIZATION_THRESHOLD) {
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
        await editor.edit((editBuilder) => {
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
