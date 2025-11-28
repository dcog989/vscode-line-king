/**
 * Line sorting utilities
 */

// Create reusable collators for performance
const naturalCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const caseInsensitiveCollator = new Intl.Collator(undefined, { sensitivity: 'base' });

// Reusable IP regex (compiled once)
const IP_REGEX = /\b(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\b/;

/**
 * Sorts lines in ascending order (A-Z)
 * Optimized: Uses Collator for consistent, faster locale-aware sorting
 */
export const sortAsc = (lines: string[]): string[] =>
    [...lines].sort((a, b) => a.localeCompare(b));

/**
 * Sorts lines in ascending order, case-insensitive
 * Optimized: Uses cached collator instead of creating new one per comparison
 */
export const sortAscInsensitive = (lines: string[]): string[] =>
    [...lines].sort((a, b) => caseInsensitiveCollator.compare(a, b));

/**
 * Sorts lines in descending order (Z-A)
 */
export const sortDesc = (lines: string[]): string[] =>
    [...lines].sort((a, b) => b.localeCompare(a));

/**
 * Sorts lines in descending order, case-insensitive
 * Optimized: Uses cached collator instead of creating new one per comparison
 */
export const sortDescInsensitive = (lines: string[]): string[] =>
    [...lines].sort((a, b) => caseInsensitiveCollator.compare(b, a));

/**
 * Natural sort - handles numbers intelligently (e.g., file2.txt before file10.txt)
 */
export const sortNatural = (lines: string[]): string[] =>
    [...lines].sort((a, b) => naturalCollator.compare(a, b));

/**
 * Sorts lines by length (shortest first)
 */
export const sortLengthAsc = (lines: string[]): string[] =>
    [...lines].sort((a, b) => a.length - b.length);

/**
 * Sorts lines by length (longest first)
 */
export const sortLengthDesc = (lines: string[]): string[] =>
    [...lines].sort((a, b) => b.length - a.length);

/**
 * Reverses the order of lines
 */
export const sortReverse = (lines: string[]): string[] =>
    [...lines].reverse();

/**
 * Sorts lines by IPv4 address (if present in the line)
 * Optimized: Caches IP extraction and numeric conversion
 */
export const sortIP = (lines: string[]): string[] => {
    // Pre-process: Extract and parse IPs once
    const parsed = lines.map(line => {
        const match = line.match(IP_REGEX);
        if (!match) {
            return { line, octets: null };
        }
        return {
            line,
            octets: [
                parseInt(match[1], 10),
                parseInt(match[2], 10),
                parseInt(match[3], 10),
                parseInt(match[4], 10)
            ]
        };
    });

    // Sort using pre-parsed data
    parsed.sort((a, b) => {
        // If either doesn't have an IP, fall back to string comparison
        if (!a.octets || !b.octets) {
            return a.line.localeCompare(b.line);
        }

        // Compare each octet numerically
        for (let i = 0; i < 4; i++) {
            if (a.octets[i] !== b.octets[i]) {
                return a.octets[i] - b.octets[i];
            }
        }
        return 0;
    });

    return parsed.map(p => p.line);
};

/**
 * Randomly shuffles lines using Fisher-Yates algorithm
 */
export const sortShuffle = (lines: string[]): string[] => {
    const array = [...lines];
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

/**
 * Sorts lines and removes duplicates (case-sensitive)
 */
export const sortUnique = (lines: string[]): string[] =>
    [...new Set(lines)].sort((a, b) => a.localeCompare(b));

/**
 * Sorts lines and removes duplicates (case-insensitive)
 * Preserves the original case of the first occurrence
 * Optimized: Uses cached collator for sorting
 */
export const sortUniqueInsensitive = (lines: string[]): string[] => {
    const seen = new Set<string>();
    const tempArr: { original: string, lower: string }[] = [];

    for (const line of lines) {
        const lower = line.toLowerCase();
        if (!seen.has(lower)) {
            seen.add(lower);
            tempArr.push({ original: line, lower });
        }
    }

    tempArr.sort((a, b) => caseInsensitiveCollator.compare(a.lower, b.lower));
    return tempArr.map(x => x.original);
};
