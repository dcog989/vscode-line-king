import * as vscode from 'vscode';

/**
 * Line sorting utilities
 * Optimized for performance with minimal array allocations
 */

// Lazy-initialized collators for performance
// Uses vscode.env.language to respect the user's UI language preference
let naturalCollator: Intl.Collator | undefined;
let caseInsensitiveCollator: Intl.Collator | undefined;
let defaultCollator: Intl.Collator | undefined;

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

function getDefaultCollator(): Intl.Collator {
    if (!defaultCollator) {
        defaultCollator = new Intl.Collator(vscode.env.language);
    }
    return defaultCollator;
}

// Reusable IP regex (compiled once)
const IP_REGEX = /\b(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\b/;

/**
 * Sorts lines in ascending order (A-Z)
 * Uses cached Collator for better performance than localeCompare
 */
export function sortAsc(lines: string[]): string[] {
    const sorted = [...lines];
    const collator = getDefaultCollator();
    sorted.sort(collator.compare);
    return sorted;
}

/**
 * Sorts lines in ascending order, case-insensitive
 * Uses cached collator for optimal performance
 */
export function sortAscInsensitive(lines: string[]): string[] {
    const sorted = [...lines];
    const collator = getCaseInsensitiveCollator();
    sorted.sort(collator.compare);
    return sorted;
}

/**
 * Sorts lines in descending order (Z-A)
 */
export function sortDesc(lines: string[]): string[] {
    const sorted = [...lines];
    const collator = getDefaultCollator();
    sorted.sort((a, b) => collator.compare(b, a));
    return sorted;
}

/**
 * Sorts lines in descending order, case-insensitive
 * Uses cached collator for optimal performance
 */
export function sortDescInsensitive(lines: string[]): string[] {
    const sorted = [...lines];
    const collator = getCaseInsensitiveCollator();
    sorted.sort((a, b) => collator.compare(b, a));
    return sorted;
}

/**
 * Natural sort - handles numbers intelligently (e.g., file2.txt before file10.txt)
 */
export function sortNatural(lines: string[]): string[] {
    const sorted = [...lines];
    const collator = getNaturalCollator();
    sorted.sort(collator.compare);
    return sorted;
}

/**
 * Sorts lines by length (shortest first)
 */
export function sortLengthAsc(lines: string[]): string[] {
    const sorted = [...lines];
    sorted.sort((a, b) => a.length - b.length);
    return sorted;
}

/**
 * Sorts lines by length (longest first)
 */
export function sortLengthDesc(lines: string[]): string[] {
    const sorted = [...lines];
    sorted.sort((a, b) => b.length - a.length);
    return sorted;
}

/**
 * Reverses the order of lines
 * Most efficient - no sorting needed
 */
export function sortReverse(lines: string[]): string[] {
    const reversed = [...lines];
    reversed.reverse();
    return reversed;
}

/**
 * Sorts lines by IPv4 address (if present in the line)
 * Optimized to parse IPs once (O(N)) instead of during every comparison (O(N log N))
 */
export function sortIP(lines: string[]): string[] {
    // Schwartzian transform: Map -> Sort -> Map
    const mapped = lines.map(line => {
        const match = line.match(IP_REGEX);
        if (match) {
            // Convert IP to numeric value: (a << 24) | (b << 16) | (c << 8) | d
            // Use unsigned right shift (>>> 0) to handle 32-bit integer overflow correctly in JS
            const ipValue = (
                (parseInt(match[1], 10) << 24) |
                (parseInt(match[2], 10) << 16) |
                (parseInt(match[3], 10) << 8) |
                parseInt(match[4], 10)
            ) >>> 0;
            return { line, hasIp: true, ipValue };
        }
        return { line, hasIp: false, ipValue: 0 };
    });

    const collator = getDefaultCollator();

    mapped.sort((a, b) => {
        // Both have IPs
        if (a.hasIp && b.hasIp) {
            return a.ipValue - b.ipValue;
        }
        // Only A has IP (A comes first)
        if (a.hasIp) return -1;
        // Only B has IP (B comes first)
        if (b.hasIp) return 1;

        // Fallback to standard sort for non-IP lines
        return collator.compare(a.line, b.line);
    });

    return mapped.map(item => item.line);
}

/**
 * Randomly shuffles lines using Fisher-Yates algorithm
 * Provides uniform random distribution
 */
export function sortShuffle(lines: string[]): string[] {
    const array = [...lines];
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Sorts lines and removes duplicates (case-sensitive)
 * Uses Set for O(n) deduplication, then sorts
 */
export function sortUnique(lines: string[]): string[] {
    const unique = [...new Set(lines)];
    const collator = getDefaultCollator();
    unique.sort(collator.compare);
    return unique;
}

/**
 * Sorts lines and removes duplicates (case-insensitive)
 * Preserves the original case of the first occurrence
 * Uses cached collator for optimal sorting performance
 */
export function sortUniqueInsensitive(lines: string[]): string[] {
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
}
