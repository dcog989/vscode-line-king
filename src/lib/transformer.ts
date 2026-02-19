import {
    camelCase,
    capitalCase,
    kebabCase,
    pascalCase,
    sentenceCase,
    snakeCase,
} from 'change-case';

/**
 * Text transformation and encoding utilities
 * Pure logic only - no VS Code dependencies for unit testing compatibility
 */

function base64Encode(str: string): string {
    return Buffer.from(str, 'utf-8').toString('base64');
}

function base64Decode(str: string): string {
    return Buffer.from(str, 'base64').toString('utf-8');
}

export function transformUpper(lines: string[]): string[] {
    return lines.map((l) => l.toUpperCase());
}

export function transformLower(lines: string[]): string[] {
    return lines.map((l) => l.toLowerCase());
}

export function transformCamel(lines: string[]): string[] {
    return lines.map((l) => camelCase(l));
}

export function transformKebab(lines: string[]): string[] {
    return lines.map((l) => kebabCase(l));
}

export function transformSnake(lines: string[]): string[] {
    return lines.map((l) => snakeCase(l));
}

export function transformPascal(lines: string[]): string[] {
    return lines.map((l) => pascalCase(l));
}

export function transformSentence(lines: string[]): string[] {
    return lines.map((l) => sentenceCase(l));
}

export function transformTitle(lines: string[]): string[] {
    return lines.map((l) => capitalCase(l));
}

export function transformUrlEncode(lines: string[]): string[] {
    return lines.map((l) => {
        try {
            return encodeURIComponent(l);
        } catch {
            return l;
        }
    });
}

export function transformUrlDecode(lines: string[]): string[] {
    return lines.map((l) => {
        try {
            return decodeURIComponent(l);
        } catch {
            return l;
        }
    });
}

export function transformBase64Encode(lines: string[]): string[] {
    return lines.map((l) => {
        try {
            return base64Encode(l);
        } catch {
            return l;
        }
    });
}

export function transformBase64Decode(lines: string[]): string[] {
    return lines.map((l) => {
        try {
            const decoded = base64Decode(l);
            // Check for replacement character which indicates invalid UTF-8
            if (decoded.includes('\uFFFD')) {
                throw new Error('Result contains invalid UTF-8 characters');
            }
            return decoded;
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Invalid Base64 input';
            throw new Error(`Base64 decode failed for line: ${message}`);
        }
    });
}

export function transformJsonEscape(lines: string[]): string[] {
    return lines.map((l) => {
        try {
            return JSON.stringify(l).slice(1, -1);
        } catch {
            return l;
        }
    });
}

export function transformJsonUnescape(lines: string[]): string[] {
    return lines.map((l) => {
        try {
            return JSON.parse(`"${l}"`);
        } catch (primaryError) {
            try {
                return unescapeJsonString(l);
            } catch {
                const message =
                    primaryError instanceof Error
                        ? primaryError.message
                        : 'Invalid escape sequence';
                throw new Error(`JSON unescape failed: ${message}`);
            }
        }
    });
}

function unescapeJsonString(str: string): string {
    let result = '';
    let i = 0;
    const len = str.length;

    while (i < len) {
        const char = str[i];

        if (char === '\\' && i + 1 < len) {
            const nextChar = str[i + 1];
            switch (nextChar) {
                case '"':
                    result += '"';
                    i += 2;
                    break;
                case '\\':
                    result += '\\';
                    i += 2;
                    break;
                case '/':
                    result += '/';
                    i += 2;
                    break;
                case 'b':
                    result += '\b';
                    i += 2;
                    break;
                case 'f':
                    result += '\f';
                    i += 2;
                    break;
                case 'n':
                    result += '\n';
                    i += 2;
                    break;
                case 'r':
                    result += '\r';
                    i += 2;
                    break;
                case 't':
                    result += '\t';
                    i += 2;
                    break;
                case 'u':
                    if (i + 5 < len) {
                        const hex = str.slice(i + 2, i + 6);
                        const codePoint = parseInt(hex, 16);
                        if (!isNaN(codePoint)) {
                            result += String.fromCharCode(codePoint);
                            i += 6;
                            break;
                        }
                    }
                    result += '\\u';
                    i++;
                    break;
                default:
                    result += char;
                    i++;
                    break;
            }
        } else {
            result += char;
            i++;
        }
    }
    return result;
}

export function transformJoin(lines: string[], separator: string): string[] {
    return [lines.join(separator)];
}

function sortObjectKeys(obj: unknown): unknown {
    if (obj === null || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys);
    }

    const objRecord = obj as Record<string, unknown>;
    return Object.keys(objRecord)
        .sort()
        .reduce(
            (result, key) => {
                result[key] = sortObjectKeys(objRecord[key]);
                return result;
            },
            {} as Record<string, unknown>,
        );
}

function sortObjectByValue(obj: unknown): unknown {
    if (obj === null || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
        return obj.map(sortObjectByValue);
    }

    const objRecord = obj as Record<string, unknown>;
    const sortedEntries = Object.entries(objRecord).sort(([, a], [, b]) => {
        const aStr = typeof a === 'string' ? a : JSON.stringify(a);
        const bStr = typeof b === 'string' ? b : JSON.stringify(b);
        return aStr.localeCompare(bStr);
    });

    return sortedEntries.reduce(
        (result, [key, value]) => {
            result[key] = sortObjectByValue(value);
            return result;
        },
        {} as Record<string, unknown>,
    );
}

export function transformJsonSortByKey(lines: string[]): string[] {
    const text = lines.join('\n');
    try {
        const parsed = JSON.parse(text);
        const sorted = sortObjectKeys(parsed);
        return [JSON.stringify(sorted, null, 2)];
    } catch (error) {
        throw new Error(`Invalid JSON: ${(error as Error).message}`);
    }
}

export function transformJsonSortByValue(lines: string[]): string[] {
    const text = lines.join('\n');
    try {
        const parsed = JSON.parse(text);
        const sorted = sortObjectByValue(parsed);
        return [JSON.stringify(sorted, null, 2)];
    } catch (error) {
        throw new Error(`Invalid JSON: ${(error as Error).message}`);
    }
}

export function transformJsonSort(lines: string[]): string[] {
    return transformJsonSortByKey(lines);
}

export function transformJsonMinify(lines: string[]): string[] {
    const text = lines.join('\n');
    try {
        const parsed = JSON.parse(text);
        return [JSON.stringify(parsed)];
    } catch (error) {
        throw new Error(`Invalid JSON: ${(error as Error).message}`);
    }
}
