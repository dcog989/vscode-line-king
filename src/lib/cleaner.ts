/**
 * Line cleaning and tidying utilities
 */

/**
 * Removes all blank lines from the input
 */
export const removeBlankLines = (lines: string[]): string[] =>
    lines.filter(line => line.trim().length > 0);

/**
 * Condenses multiple consecutive blank lines into a single blank line
 */
export const condenseBlankLines = (lines: string[]): string[] => {
    const result: string[] = [];
    let previousWasBlank = false;

    for (const line of lines) {
        const isBlank = line.trim().length === 0;
        if (isBlank) {
            if (!previousWasBlank) {
                result.push(line);
                previousWasBlank = true;
            }
        } else {
            result.push(line);
            previousWasBlank = false;
        }
    }
    return result;
};

/**
 * Removes duplicate lines while preserving order (keeps first occurrence)
 * Special handling: For blank/whitespace lines, only removes consecutive duplicates
 * For non-blank lines, removes all duplicates throughout the selection
 */
export const removeDuplicateLines = (lines: string[]): string[] => {
    const seen = new Set<string>();
    const result: string[] = [];
    let previousWasBlank = false;

    for (const line of lines) {
        const isBlank = line.trim().length === 0;

        if (isBlank) {
            // For blank lines, only keep one if the previous line wasn't blank
            if (!previousWasBlank) {
                result.push(line);
            }
            previousWasBlank = true;
        } else {
            // For non-blank lines, remove all duplicates
            if (!seen.has(line)) {
                seen.add(line);
                result.push(line);
            }
            previousWasBlank = false;
        }
    }

    return result;
};

/**
 * Keeps only duplicate lines (removes unique lines)
 * Preserves original order and all occurrences of duplicates
 */
export const keepOnlyDuplicates = (lines: string[]): string[] => {
    const counts = new Map<string, number>();

    // Count occurrences
    for (const line of lines) {
        counts.set(line, (counts.get(line) || 0) + 1);
    }

    // Filter to keep only lines that appear more than once
    return lines.filter(line => (counts.get(line) || 0) > 1);
};

/**
 * Removes trailing whitespace from each line
 */
export const trimTrailingWhitespace = (lines: string[]): string[] =>
    lines.map(line => line.replace(/\s+$/, ''));

/**
 * Removes leading whitespace from each line
 */
export const trimLeadingWhitespace = (lines: string[]): string[] =>
    lines.map(line => line.replace(/^\s+/, ''));

/**
 * Removes both leading and trailing whitespace from each line
 */
export const trimBothWhitespace = (lines: string[]): string[] =>
    lines.map(line => line.trim());
