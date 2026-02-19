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

const PROPERTY_REGEX = /^\s+([-a-z]+(?:-[a-z0-9]+)*)\s*:\s*([^:;{}]+)\s*;?\s*$/i;

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
    const allBlocks: Array<{ start: number; end: number }> = [];
    const openBraces: Array<{ line: number; depth: number }> = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        for (const char of line) {
            if (char === '{') {
                openBraces.push({ line: i, depth: openBraces.length });
            } else if (char === '}') {
                if (openBraces.length > 0) {
                    const open = openBraces.pop()!;
                    allBlocks.push({ start: open.line, end: i });
                }
            }
        }
    }

    if (allBlocks.length <= 1) {
        return allBlocks;
    }

    return allBlocks.filter((block) => {
        return !allBlocks.some((other) => other.start > block.start && other.end < block.end);
    });
}

function processBlockLines(blockLines: string[], strategy: SortStrategy): string[] {
    const parsed = blockLines.map((line) => parseLine(line));
    const declarations = parsed.filter((p) => p.type === 'declaration');

    if (declarations.length <= 1) {
        return blockLines;
    }

    const sortedDeclarations = sortDeclarations(
        declarations as Array<ParsedLine & { property: string; value: string }>,
        strategy,
    );

    let declIndex = 0;
    return parsed.map((parsedLine) => {
        if (parsedLine.type === 'declaration') {
            return sortedDeclarations[declIndex++].original;
        }
        return parsedLine.original;
    });
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

    const newBlockLines = processBlockLines(blockLines, strategy);

    const result = [...lines];
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

    const result: string[] = [];
    let lastProcessedEnd = 0;

    for (const block of ruleBlocks) {
        if (block.end - block.start <= 1) {
            continue;
        }

        result.push(...lines.slice(lastProcessedEnd, block.start + 1));

        const blockLines = lines.slice(block.start + 1, block.end);
        const newBlockLines = processBlockLines(blockLines, strategy);
        result.push(...newBlockLines);
        lastProcessedEnd = block.end;
    }

    result.push(...lines.slice(lastProcessedEnd));

    return result.join('\n');
}
