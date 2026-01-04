/**
 * Line cleaning and tidying utilities
 * Optimized for memory efficiency with large files
 *
 * Blank line handling policy:
 * - Blank lines are treated consistently across all deduplication functions
 * - They are considered as data and processed the same as non-blank lines
 * - Use removeBlankLines() first if you want to exclude blank lines from processing
 *
 * Performance optimization:
 * - Functions support both array and generator inputs for memory efficiency
 * - For large files, use generator-based processing to avoid double-array allocation
 */

// Reusable regex patterns (compiled once for performance)
const TRAILING_WHITESPACE_REGEX = /\s+$/;
const LEADING_WHITESPACE_REGEX = /^\s+/;

/**
 * Helper to convert iterator to array
 */
function toArray<T>(iterator: Iterable<T>): T[] {
    return Array.from(iterator);
}

/**
 * Removes all blank lines from the input
 * A line is considered blank if it contains only whitespace
 *
 * Memory-efficient: Processes lines in a single pass
 */
export function* removeBlankLinesStream(lines: Iterable<string>): Generator<string, void, undefined> {
    for (const line of lines) {
        if (line.trim().length > 0) {
            yield line;
        }
    }
}

export function removeBlankLines(lines: string[]): string[] {
    return toArray(removeBlankLinesStream(lines));
}

/**
 * Condenses multiple consecutive blank lines into a single blank line
 * Preserves non-blank lines and reduces blank line runs to length 1
 */
export function* condenseBlankLinesStream(lines: Iterable<string>): Generator<string, void, undefined> {
    let previousWasBlank = false;

    for (const line of lines) {
        const isBlank = line.trim().length === 0;

        if (isBlank) {
            if (!previousWasBlank) {
                yield line;
                previousWasBlank = true;
            }
            // Skip consecutive blank lines
        } else {
            yield line;
            previousWasBlank = false;
        }
    }
}

export function condenseBlankLines(lines: string[]): string[] {
    return toArray(condenseBlankLinesStream(lines));
}

/**
 * Removes duplicate lines while preserving order (keeps first occurrence)
 * Treats blank lines as data - they are deduplicated like any other line
 * Uses Set for O(n) performance
 */
export function* removeDuplicateLinesStream(lines: Iterable<string>): Generator<string, void, undefined> {
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

/**
 * Keeps only duplicate lines (removes unique lines)
 * Preserves original order and all occurrences of duplicates
 * Treats blank lines as data - if multiple blank lines exist, they are kept
 *
 * Note: This requires two passes - one to count, one to filter.
 */
export function keepOnlyDuplicates(lines: string[]): string[] {
    const counts = new Map<string, number>();

    // First pass: count all occurrences including blank lines
    for (const line of lines) {
        counts.set(line, (counts.get(line) || 0) + 1);
    }

    // Second pass: keep only lines that appear more than once
    const result: string[] = [];
    for (const line of lines) {
        if ((counts.get(line) || 0) > 1) {
            result.push(line);
        }
    }

    return result;
}

/**
 * Generator version of keepOnlyDuplicates
 * Note: Must buffer content internally to perform counting, so it doesn't
 * provide the same memory benefits as other stream functions, but is
 * included for API consistency.
 */
export function* keepOnlyDuplicatesStream(lines: Iterable<string>): Generator<string, void, undefined> {
    const allLines: string[] = [];
    const counts = new Map<string, number>();

    // We must consume the whole stream to count
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

/**
 * Removes trailing whitespace from each line
 */
export function* trimTrailingWhitespaceStream(lines: Iterable<string>): Generator<string, void, undefined> {
    for (const line of lines) {
        yield line.replace(TRAILING_WHITESPACE_REGEX, '');
    }
}

export function trimTrailingWhitespace(lines: string[]): string[] {
    return toArray(trimTrailingWhitespaceStream(lines));
}

/**
 * Removes leading whitespace from each line
 */
export function* trimLeadingWhitespaceStream(lines: Iterable<string>): Generator<string, void, undefined> {
    for (const line of lines) {
        yield line.replace(LEADING_WHITESPACE_REGEX, '');
    }
}

export function trimLeadingWhitespace(lines: string[]): string[] {
    return toArray(trimLeadingWhitespaceStream(lines));
}

/**
 * Removes both leading and trailing whitespace from each line
 */
export function* trimBothWhitespaceStream(lines: Iterable<string>): Generator<string, void, undefined> {
    for (const line of lines) {
        yield line.trim();
    }
}

export function trimBothWhitespace(lines: string[]): string[] {
    return toArray(trimBothWhitespaceStream(lines));
}
