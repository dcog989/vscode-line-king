export const sortAsc = (lines: string[]) => [...lines].sort((a, b) => a.localeCompare(b));

export const sortAscInsensitive = (lines: string[]) =>
    [...lines].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

export const sortDesc = (lines: string[]) => [...lines].sort((a, b) => b.localeCompare(a));

export const sortNatural = (lines: string[]) =>
    [...lines].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

export const sortLengthAsc = (lines: string[]) => [...lines].sort((a, b) => a.length - b.length);

export const sortLengthDesc = (lines: string[]) => [...lines].sort((a, b) => b.length - a.length);

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
    const result: string[] = [];

    // First pass: filter duplicates case-insensitively
    // We keep the first variation we see, or we could normalize.
    // Usually keeping the first occurrence is safer.
    const tempArr: { original: string, lower: string }[] = [];

    for (const line of lines) {
        const lower = line.toLowerCase();
        if (!seen.has(lower)) {
            seen.add(lower);
            tempArr.push({ original: line, lower });
        }
    }

    // Second pass: sort
    tempArr.sort((a, b) => a.lower.localeCompare(b.lower));
    return tempArr.map(x => x.original);
};
