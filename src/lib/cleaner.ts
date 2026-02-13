/**
 * Line cleaning and tidying utilities
 * Optimized for memory efficiency with large files
 */

import { REGEX } from '../constants.js';

function toArray<T>(iterator: Iterable<T>): T[] {
    return Array.from(iterator);
}

export function* removeBlankLinesStream(
    lines: Iterable<string>,
): Generator<string, void, undefined> {
    for (const line of lines) {
        if (line.trim().length > 0) {
            yield line;
        }
    }
}

export function removeBlankLines(lines: string[]): string[] {
    return toArray(removeBlankLinesStream(lines));
}

export function* condenseBlankLinesStream(
    lines: Iterable<string>,
): Generator<string, void, undefined> {
    let previousWasBlank = false;
    for (const line of lines) {
        const isBlank = line.trim().length === 0;
        if (isBlank) {
            if (!previousWasBlank) {
                yield line;
                previousWasBlank = true;
            }
        } else {
            yield line;
            previousWasBlank = false;
        }
    }
}

export function condenseBlankLines(lines: string[]): string[] {
    return toArray(condenseBlankLinesStream(lines));
}

export function* removeDuplicateLinesStream(
    lines: Iterable<string>,
): Generator<string, void, undefined> {
    const seen = new Set<string>();
    for (const line of lines) {
        if (!seen.has(line)) {
            seen.add(line);
            yield line;
        }
    }
}

export function removeDuplicateLines(lines: string[]): string[] {
    return toArray(removeDuplicateLinesStream(lines));
}

export function keepOnlyDuplicates(lines: string[]): string[] {
    // Two-pass approach is actually optimal here:
    // Pass 1: Count occurrences using a Map
    // Pass 2: Filter lines that appear more than once
    // This maintains original order and correctly handles duplicates
    const counts = new Map<string, number>();

    // First pass: count occurrences
    for (const line of lines) {
        counts.set(line, (counts.get(line) ?? 0) + 1);
    }

    // Second pass: keep only duplicates
    const result: string[] = [];
    for (const line of lines) {
        if (counts.get(line)! > 1) {
            result.push(line);
        }
    }

    return result;
}

export function* keepOnlyDuplicatesStream(
    lines: Iterable<string>,
): Generator<string, void, undefined> {
    const allLines: string[] = [];
    const counts = new Map<string, number>();
    for (const line of lines) {
        counts.set(line, (counts.get(line) || 0) + 1);
        allLines.push(line);
    }
    for (const line of allLines) {
        if ((counts.get(line) || 0) > 1) {
            yield line;
        }
    }
}

export function* trimTrailingWhitespaceStream(
    lines: Iterable<string>,
): Generator<string, void, undefined> {
    for (const line of lines) {
        yield line.replace(REGEX.TRAILING_WHITESPACE, '');
    }
}

export function trimTrailingWhitespace(lines: string[]): string[] {
    return toArray(trimTrailingWhitespaceStream(lines));
}

export function* trimLeadingWhitespaceStream(
    lines: Iterable<string>,
): Generator<string, void, undefined> {
    for (const line of lines) {
        yield line.replace(REGEX.LEADING_WHITESPACE, '');
    }
}

export function trimLeadingWhitespace(lines: string[]): string[] {
    return toArray(trimLeadingWhitespaceStream(lines));
}

export function* trimBothEndsStream(lines: Iterable<string>): Generator<string, void, undefined> {
    for (const line of lines) {
        yield line.trim();
    }
}

export function trimBothEnds(lines: string[]): string[] {
    return toArray(trimBothEndsStream(lines));
}
