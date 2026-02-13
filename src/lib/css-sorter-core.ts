/**
 * Core CSS sorting logic without VS Code dependencies
 * Designed for unit testing and pure JavaScript environments
 */

type SortStrategy = 'alphabetical' | 'length';

interface ParsedLine {
    original: string;
    type: 'declaration' | 'comment' | 'other';
    property?: string;
    value?: string;
}

const PROPERTY_REGEX = /^\s{2,}([-a-z]+(?:-[a-z0-9]+)*)\s*:\s*([^:;{}]+)\s*;?\s*$/i;

const COMMENT_REGEX = /^\s*(\/\*.*\*\/|\/\/.*)$/;

const BRACE_OPEN_REGEX = /\{/;

const BRACE_CLOSE_REGEX = /\}/;

export function parseLine(line: string): ParsedLine {
    const trimmed = line.trim();

    if (COMMENT_REGEX.test(line)) {
        return { original: line, type: 'comment' };
    }

    if (trimmed.length === 0 || BRACE_OPEN_REGEX.test(line) || BRACE_CLOSE_REGEX.test(line)) {
        return { original: line, type: 'other' };
    }

    const match = line.match(PROPERTY_REGEX);
    if (match) {
        return {
            original: line,
            type: 'declaration',
            property: match[1],
            value: match[2],
        };
    }

    return { original: line, type: 'other' };
}

export function sortDeclarations(
    declarations: Array<ParsedLine & { property: string; value: string }>,
    strategy: SortStrategy,
): Array<ParsedLine & { property: string; value: string }> {
    if (declarations.length <= 1) {
        return declarations;
    }

    const sorted = [...declarations].sort((a, b) => {
        if (strategy === 'length') {
            const lengthA = `${a.property}:${a.value}`.length;
            const lengthB = `${b.property}:${b.value}`.length;
            return lengthA - lengthB;
        }

        return a.property.localeCompare(b.property);
    });

    return sorted;
}

export function findRuleBlocks(lines: string[]): Array<{ start: number; end: number }> {
    const blocks: Array<{ start: number; end: number }> = [];
    let depth = 0;
    let blockStart = -1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (BRACE_OPEN_REGEX.test(line)) {
            if (depth === 0) {
                blockStart = i;
            }
            depth++;
        } else if (BRACE_CLOSE_REGEX.test(line)) {
            depth--;
            if (depth === 0 && blockStart >= 0) {
                blocks.push({ start: blockStart, end: i });
                blockStart = -1;
            }
        }
    }

    return blocks;
}

export function sortRuleBlock(
    lines: string[],
    startIndex: number,
    endIndex: number,
    strategy: SortStrategy,
): string[] {
    const blockLines = lines.slice(startIndex + 1, endIndex);

    if (blockLines.length === 0) {
        return lines;
    }

    const parsed = blockLines.map((line, index) => ({ ...parseLine(line), originalIndex: index }));

    const declarations = parsed.filter((p) => p.type === 'declaration');

    const sortedDeclarations = sortDeclarations(
        declarations as Array<ParsedLine & { property: string; value: string }>,
        strategy,
    );

    const result = [...lines];
    let declIndex = 0;

    const newBlockLines = parsed.map((parsedLine) => {
        if (parsedLine.type === 'declaration') {
            return sortedDeclarations[declIndex++].original;
        }
        return parsedLine.original;
    });

    result.splice(startIndex + 1, endIndex - startIndex - 1, ...newBlockLines);

    return result;
}

export function sortCssText(cssText: string, strategy: SortStrategy = 'alphabetical'): string {
    const lines = cssText.split(/\r?\n/);

    if (lines.length === 0) {
        return cssText;
    }

    const ruleBlocks = findRuleBlocks(lines);

    if (ruleBlocks.length === 0) {
        return cssText;
    }

    let result = [...lines];

    for (const block of ruleBlocks) {
        if (block.end - block.start <= 1) {
            continue;
        }

        result = sortRuleBlock(result, block.start, block.end, strategy);
    }

    return result.join('\n');
}
