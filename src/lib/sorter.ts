import * as vscode from 'vscode';

/**
 * Line sorting utilities
 * Optimized for performance with minimal array allocations and cached collators
 */

// Lazy-initialized collators for performance
// Uses vscode.env.language to respect the user's UI language preference
let naturalCollator: Intl.Collator | undefined;
let caseInsensitiveCollator: Intl.Collator | undefined;

function getNaturalCollator(): Intl.Collator {
    if (!naturalCollator) {
        naturalCollator = new Intl.Collator(vscode.env.language, { numeric: true, sensitivity: 'base' });
    }
    return naturalCollator;
}

function getCaseInsensitiveCollator(): Intl.Collator {
    if (!caseInsensitiveCollator) {
        caseInsensitiveCollator = new Intl.Collator(vscode.env.language, { sensitivity: 'base' });
    }
    return caseInsensitiveCollator;
}

// Reusable IP regex (compiled once)
const IP_REGEX = /\b(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\b/;

/**
 * Sorts lines in ascending order (A-Z)
 */
export const sortAsc = (lines: string[]): string[] =>
    [...lines].sort((a, b) => a.localeCompare(b));

/**
 * Sorts lines in ascending order, case-insensitive
 */
export const sortAscInsensitive = (lines: string[]): string[] => {
    const collator = getCaseInsensitiveCollator();
    return [...lines].sort(collator.compare);
};

/**
 * Sorts lines in descending order (Z-A)
 */
export const sortDesc = (lines: string[]): string[] =>
    [...lines].sort((a, b) => b.localeCompare(a));

/**
 * Sorts lines in descending order, case-insensitive
 */
export const sortDescInsensitive = (lines: string[]): string[] => {
    const collator = getCaseInsensitiveCollator();
    return [...lines].sort((a, b) => collator.compare(b, a));
};

/**
 * Natural sort - handles numbers intelligently (e.g., file2.txt before file10.txt)
 */
export const sortNatural = (lines: string[]): string[] => {
    const collator = getNaturalCollator();
    return [...lines].sort(collator.compare);
};

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
 * Optimized: Converts IPs to 32-bit integers for single comparison
 * Lines with IPs come first, sorted numerically, followed by non-IP lines sorted alphabetically
 */
export function sortIP(lines: string[]): string[] {
    // Separate lines with IPs from those without
    const withIPs: Array<{ line: string; ipValue: number }> = [];
    const withoutIPs: string[] = [];

    for (const line of lines) {
        const match = line.match(IP_REGEX);
        if (match) {
            // Convert IP to 32-bit unsigned integer for fast sorting
            const ipValue = (
                (parseInt(match[1], 10) << 24) |
                (parseInt(match[2], 10) << 16) |
                (parseInt(match[3], 10) << 8) |
                parseInt(match[4], 10)
            ) >>> 0;
            withIPs.push({ line, ipValue });
        } else {
            withoutIPs.push(line);
        }
    }

    // Sort lines with IPs by numeric value
    withIPs.sort((a, b) => a.ipValue - b.ipValue);

    // Sort lines without IPs alphabetically
    withoutIPs.sort((a, b) => a.localeCompare(b));

    // Combine: IPs first, then non-IPs
    return [...withIPs.map(p => p.line), ...withoutIPs];
}

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
    Array.from(new Set(lines)).sort((a, b) => a.localeCompare(b));

/**
 * Sorts lines and removes duplicates (case-insensitive)
 * Preserves the original case of the first occurrence
 */
export const sortUniqueInsensitive = (lines: string[]): string[] => {
    const seen = new Set<string>();
    const unique: { original: string; lower: string }[] = [];

    for (const line of lines) {
        const lower = line.toLowerCase();
        if (!seen.has(lower)) {
            seen.add(lower);
            unique.push({ original: line, lower });
        }
    }

    const collator = getCaseInsensitiveCollator();
    unique.sort((a, b) => collator.compare(a.lower, b.lower));
    return unique.map(x => x.original);
};
