// Create a reusable collator for performance
const naturalCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export const sortAsc = (lines: string[]) => [...lines].sort((a, b) => a.localeCompare(b));

export const sortAscInsensitive = (lines: string[]) =>
    [...lines].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

export const sortDesc = (lines: string[]) => [...lines].sort((a, b) => b.localeCompare(a));

export const sortDescInsensitive = (lines: string[]) =>
    [...lines].sort((a, b) => b.localeCompare(a, undefined, { sensitivity: 'base' }));

export const sortNatural = (lines: string[]) =>
    [...lines].sort((a, b) => naturalCollator.compare(a, b));

export const sortLengthAsc = (lines: string[]) => [...lines].sort((a, b) => a.length - b.length);

export const sortLengthDesc = (lines: string[]) => [...lines].sort((a, b) => b.length - a.length);

export const sortReverse = (lines: string[]) => [...lines].reverse();

export const sortIP = (lines: string[]) => {
    return [...lines].sort((a, b) => {
        // Extract IP-like patterns (simple IPv4)
        const ipA = a.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);
        const ipB = b.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);

        if (!ipA || !ipB) return a.localeCompare(b); // Fallback if no IP found

        const numA = ipA[0].split('.').map(Number);
        const numB = ipB[0].split('.').map(Number);

        for (let i = 0; i < 4; i++) {
            if (numA[i] !== numB[i]) return numA[i] - numB[i];
        }
        return 0;
    });
};

export const sortShuffle = (lines: string[]) => {
    const array = [...lines];
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

export const sortUnique = (lines: string[]) => [...new Set(lines)].sort((a, b) => a.localeCompare(b));

export const sortUniqueInsensitive = (lines: string[]) => {
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
