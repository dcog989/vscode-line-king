/**
 * Line sorting utilities
 * Optimized for performance with minimal array allocations and cached collators.
 * Pure logic only - no VS Code dependencies for unit testing compatibility.
 */

import { REGEX } from '../constants.js';

let naturalCollator: Intl.Collator | undefined;
let caseInsensitiveCollator: Intl.Collator | undefined;

function getNaturalCollator(): Intl.Collator {
    if (!naturalCollator) {
        naturalCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    }
    return naturalCollator;
}

function getCaseInsensitiveCollator(): Intl.Collator {
    if (!caseInsensitiveCollator) {
        caseInsensitiveCollator = new Intl.Collator(undefined, { sensitivity: 'base' });
    }
    return caseInsensitiveCollator;
}

export const sortAsc = (lines: string[]): string[] => [...lines].sort((a, b) => a.localeCompare(b));

export const sortAscInsensitive = (lines: string[]): string[] => {
    const collator = getCaseInsensitiveCollator();
    return [...lines].sort(collator.compare);
};

export const sortDesc = (lines: string[]): string[] =>
    [...lines].sort((a, b) => b.localeCompare(a));

export const sortDescInsensitive = (lines: string[]): string[] => {
    const collator = getCaseInsensitiveCollator();
    return [...lines].sort((a, b) => collator.compare(b, a));
};

export const sortNatural = (lines: string[]): string[] => {
    const collator = getNaturalCollator();
    return [...lines].sort(collator.compare);
};

export const sortLengthAsc = (lines: string[]): string[] =>
    [...lines].sort((a, b) => a.length - b.length);

export const sortLengthDesc = (lines: string[]): string[] =>
    [...lines].sort((a, b) => b.length - a.length);

export const sortReverse = (lines: string[]): string[] => [...lines].reverse();

export function sortIP(lines: string[]): string[] {
    const withIPs: Array<{ line: string; ipValue: number }> = [];
    const withoutIPs: string[] = [];

    for (const line of lines) {
        const match = line.match(REGEX.IP_ADDRESS);
        if (match) {
            const ipValue =
                ((parseInt(match[1], 10) << 24) |
                    (parseInt(match[2], 10) << 16) |
                    (parseInt(match[3], 10) << 8) |
                    parseInt(match[4], 10)) >>>
                0;
            withIPs.push({ line, ipValue });
        } else {
            withoutIPs.push(line);
        }
    }

    withIPs.sort((a, b) => a.ipValue - b.ipValue);
    withoutIPs.sort((a, b) => a.localeCompare(b));

    return [...withIPs.map((p) => p.line), ...withoutIPs];
}

export const sortShuffle = (lines: string[]): string[] => {
    const array = [...lines];
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

export const sortUnique = (lines: string[]): string[] =>
    Array.from(new Set(lines)).sort((a, b) => a.localeCompare(b));

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
    return unique.map((x) => x.original);
};
