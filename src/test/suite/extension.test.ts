import { describe, it } from 'bun:test';
import * as assert from 'assert';
import * as cleaner from '../../lib/cleaner.js';
import * as sorter from '../../lib/sorter.js';
import * as transformer from '../../lib/transformer.js';

describe('Line King Comprehensive Test Suite', () => {
    describe('Sorter', () => {
        it('should sort IP addresses numerically', () => {
            const input = ['192.168.1.1', '10.0.0.2', '10.0.0.1', '10.0.0.10'];
            const expected = ['10.0.0.1', '10.0.0.2', '10.0.0.10', '192.168.1.1'];
            assert.deepStrictEqual(sorter.sortIP(input), expected);
        });

        it('should reverse line order', () => {
            const input = ['1', '2', '3'];
            const expected = ['3', '2', '1'];
            assert.deepStrictEqual(sorter.sortReverse(input), expected);
        });

        it('should sort descending case-insensitive', () => {
            const input = ['a', 'B', 'c'];
            const expected = ['c', 'B', 'a'];
            assert.deepStrictEqual(sorter.sortDescInsensitive(input), expected);
        });

        it('should sort naturally (alphanumeric)', () => {
            const input = ['img10.png', 'img2.png', 'img1.png'];
            const expected = ['img1.png', 'img2.png', 'img10.png'];
            assert.deepStrictEqual(sorter.sortNatural(input), expected);
        });
    });

    describe('Cleaner', () => {
        it('should trim leading whitespace', () => {
            const input = ['  abc', '\ttab', 'none'];
            const expected = ['abc', 'tab', 'none'];
            assert.deepStrictEqual(cleaner.trimLeadingWhitespace(input), expected);
        });

        it('should trim whitespace from both ends', () => {
            const input = ['  abc  ', '  '];
            const expected = ['abc', ''];
            assert.deepStrictEqual(cleaner.trimBothEnds(input), expected);
        });

        it('should condense multiple blank lines', () => {
            const input = ['text', '', '', '', 'more text', '', 'end'];
            const expected = ['text', '', 'more text', '', 'end'];
            assert.deepStrictEqual(cleaner.condenseBlankLines(input), expected);
        });

        it('should keep only duplicate lines', () => {
            const input = ['a', 'b', 'a', 'c', 'b'];
            const expected = ['a', 'b', 'a', 'b'];
            assert.deepStrictEqual(cleaner.keepOnlyDuplicates(input), expected);
        });
    });

    describe('Transformer', () => {
        it('should convert to sentence case', () => {
            const input = ['hello world', 'THIS IS TEST'];
            const expected = ['Hello world', 'This is test'];
            assert.deepStrictEqual(transformer.transformSentence(input), expected);
        });

        it('should convert to title case', () => {
            const input = ['the line king', 'hello-world'];
            const expected = ['The Line King', 'Hello World'];
            assert.deepStrictEqual(transformer.transformTitle(input), expected);
        });

        it('should convert to Pascal case', () => {
            const input = ['hello world', 'camelCase'];
            const expected = ['HelloWorld', 'CamelCase'];
            assert.deepStrictEqual(transformer.transformPascal(input), expected);
        });

        it('should escape JSON strings', () => {
            const input = ['Text with "quotes"'];
            const expected = ['Text with \\"quotes\\"'];
            assert.deepStrictEqual(transformer.transformJsonEscape(input), expected);
        });

        it('should encode and decode Base64', () => {
            const input = ['Line King'];
            const encoded = transformer.transformBase64Encode(input);
            assert.deepStrictEqual(encoded, ['TGluZSBLaW5n']);
            assert.deepStrictEqual(transformer.transformBase64Decode(encoded), input);
        });

        it('should URL encode strings', () => {
            const input = ['foo bar?'];
            const expected = ['foo%20bar%3F'];
            assert.deepStrictEqual(transformer.transformUrlEncode(input), expected);
        });
    });
});
