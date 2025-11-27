/**
 * Line sorting utilities
 */

// Create a reusable collator for performance
const naturalCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/**
 * Sorts lines in ascending order (A-Z)
 */
export const sortAsc = (lines: string[]): string[] => 
    [...lines].sort((a, b) => a.localeCompare(b));

/**
 * Sorts lines in ascending order, case-insensitive
 */
export const sortAscInsensitive = (lines: string[]): string[] =>
    [...lines].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

/**
 * Sorts lines in descending order (Z-A)
 */
export const sortDesc = (lines: string[]): string[] => 
    [...lines].sort((a, b) => b.localeCompare(a));

/**
 * Sorts lines in descending order, case-insensitive
 */
export const sortDescInsensitive = (lines: string[]): string[] =>
    [...lines].sort((a, b) => b.localeCompare(a, undefined, { sensitivity: 'base' }));

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
 */
export const sortIP = (lines: string[]): string[] => {
    return [...lines].sort((a, b) => {
        // Extract IPv4 patterns
        const ipRegex = /\b(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\b/;
        const matchA = a.match(ipRegex);
        const matchB = b.match(ipRegex);

        // If either line doesn't contain an IP, fall back to string comparison
        if (!matchA || !matchB) {
            return a.localeCompare(b);
        }

        // Compare each octet numerically
        for (let i = 1; i <= 4; i++) {
            const numA = parseInt(matchA[i], 10);
            const numB = parseInt(matchB[i], 10);
            if (numA !== numB) {
                return numA - numB;
            }
        }
        return 0;
    });
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

    tempArr.sort((a, b) => a.lower.localeCompare(b.lower));
    return tempArr.map(x => x.original);
};
