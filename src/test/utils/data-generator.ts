/**
 * Test Data Generator Utilities
 */

export function generateRandomLines(count: number, prefix: string = 'Line Entry'): string[] {
    const lines: string[] = [];
    for (let i = 0; i < count; i++) {
        lines.push(`${prefix} ${Math.random().toString(36).substring(7)}`);
    }
    return lines;
}

export function generateIPs(count: number): string[] {
    const ips: string[] = [];
    for (let i = 0; i < count; i++) {
        ips.push(
            `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        );
    }
    return ips;
}

export function generateDuplicates(totalCount: number, uniqueRatio: number = 0.5): string[] {
    const lines = new Array(totalCount).fill('Duplicate Content');
    const uniqueCount = Math.floor(totalCount * uniqueRatio);
    for (let i = 0; i < uniqueCount; i++) {
        lines[i] = `Unique ${i}`;
    }
    return lines;
}
