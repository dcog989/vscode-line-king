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
 */
export const removeDuplicates = (lines: string[]): string[] => {
    const seen = new Set<string>();
    return lines.filter(line => {
        if (seen.has(line)) {
            return false;
        }
        seen.add(line);
        return true;
    });
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
