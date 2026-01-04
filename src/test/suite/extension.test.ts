import * as assert from 'assert';
import * as cleaner from '../../lib/cleaner.js';
import * as sorter from '../../lib/sorter.js';
import * as transformer from '../../lib/transformer.js';

suite('Line King Comprehensive Test Suite', () => {

    suite('Sorter', () => {
        test('should sort IP addresses numerically', () => {
            const input = ['192.168.1.1', '10.0.0.2', '10.0.0.1', '10.0.0.10'];
            const expected = ['10.0.0.1', '10.0.0.2', '10.0.0.10', '192.168.1.1'];
            assert.deepStrictEqual(sorter.sortIP(input), expected);
        });

        test('should reverse line order', () => {
            const input = ['1', '2', '3'];
            const expected = ['3', '2', '1'];
            assert.deepStrictEqual(sorter.sortReverse(input), expected);
        });

        test('should sort descending case-insensitive', () => {
            const input = ['a', 'B', 'c'];
            const expected = ['c', 'B', 'a'];
            assert.deepStrictEqual(sorter.sortDescInsensitive(input), expected);
        });

        test('should sort naturally (alphanumeric)', () => {
            const input = ['img10.png', 'img2.png', 'img1.png'];
            const expected = ['img1.png', 'img2.png', 'img10.png'];
            assert.deepStrictEqual(sorter.sortNatural(input), expected);
        });
    });

    suite('Cleaner', () => {
        test('should trim leading whitespace', () => {
            const input = ['  abc', '\ttab', 'none'];
            const expected = ['abc', 'tab', 'none'];
            assert.deepStrictEqual(cleaner.trimLeadingWhitespace(input), expected);
        });

        test('should trim whitespace from both ends', () => {
            const input = ['  abc  ', '  '];
            const expected = ['abc', ''];
            assert.deepStrictEqual(cleaner.trimBothWhitespace(input), expected);
        });

        test('should condense multiple blank lines', () => {
            const input = ['text', '', '', '', 'more text', '', 'end'];
            const expected = ['text', '', 'more text', '', 'end'];
            assert.deepStrictEqual(cleaner.condenseBlankLines(input), expected);
        });

        test('should keep only duplicate lines', () => {
            const input = ['a', 'b', 'a', 'c', 'b'];
            const expected = ['a', 'b', 'a', 'b'];
            assert.deepStrictEqual(cleaner.keepOnlyDuplicates(input), expected);
        });
    });

    suite('Transformer', () => {
        test('should convert to sentence case', () => {
            const input = ['hello world', 'THIS IS TEST'];
            const expected = ['Hello world', 'This is test'];
            assert.deepStrictEqual(transformer.transformSentence(input), expected);
        });

        test('should convert to title case', () => {
            const input = ['the line king', 'hello-world'];
            const expected = ['The Line King', 'Hello World'];
            assert.deepStrictEqual(transformer.transformTitle(input), expected);
        });

        test('should convert to Pascal case', () => {
            const input = ['hello world', 'camelCase'];
            const expected = ['HelloWorld', 'CamelCase'];
            assert.deepStrictEqual(transformer.transformPascal(input), expected);
        });

        test('should escape JSON strings', () => {
            const input = ['Text with "quotes"'];
            const expected = ['Text with \\"quotes\\"'];
            assert.deepStrictEqual(transformer.transformJsonEscape(input), expected);
        });

        test('should encode and decode Base64', () => {
            const input = ['Line King'];
            const encoded = transformer.transformBase64Encode(input);
            assert.deepStrictEqual(encoded, ['TGluZSBLaW5n']);
            assert.deepStrictEqual(transformer.transformBase64Decode(encoded), input);
        });

        test('should URL encode strings', () => {
            const input = ['foo bar?'];
            const expected = ['foo%20bar%3F'];
            assert.deepStrictEqual(transformer.transformUrlEncode(input), expected);
        });
    });
});
