export const removeBlankLines = (lines: string[]) =>
    lines.filter(line => line.trim().length > 0);

export const condenseBlankLines = (lines: string[]) => {
    const result: string[] = [];
    let previousWasBlank = false;

    for (const line of lines) {
        const isBlank = line.trim().length === 0;
        if (isBlank) {
            if (!previousWasBlank) {
                result.push(line); // Keep one blank line
                previousWasBlank = true;
            }
        } else {
            result.push(line);
            previousWasBlank = false;
        }
    }
    return result;
};

export const removeDuplicates = (lines: string[]) => [...new Set(lines)];

export const keepOnlyDuplicates = (lines: string[]) => {
    const counts = new Map<string, number>();
    for (const line of lines) {
        counts.set(line, (counts.get(line) || 0) + 1);
    }
    // Filter to keep only lines that appeared more than once
    // We map the original lines to preserve order, but only if count > 1
    return lines.filter(line => (counts.get(line) || 0) > 1);
};

export const trimTrailingWhitespace = (lines: string[]) =>
    lines.map(line => line.replace(/\s+$/, ''));
