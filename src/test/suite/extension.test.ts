import * as assert from 'assert';
import * as vscode from 'vscode';
import * as cleaner from '../../lib/cleaner';
import * as sorter from '../../lib/sorter';
import * as transformer from '../../lib/transformer';

suite('Line King Comprehensive Test Suite', () => {
    vscode.window.showInformationMessage('Starting Line King Tests');

    // ========================================================================
    // SORTER TESTS
    // ========================================================================

    test('Sorter: IP Address', () => {
        // Should sort numerically by octet, not alphabetically (where 10 < 192)
        const input = ['192.168.1.1', '10.0.0.2', '10.0.0.1', '10.0.0.10'];
        const expected = ['10.0.0.1', '10.0.0.2', '10.0.0.10', '192.168.1.1'];
        assert.deepStrictEqual(sorter.sortIP(input), expected);
    });

    test('Sorter: Reverse', () => {
        const input = ['1', '2', '3'];
        const expected = ['3', '2', '1'];
        assert.deepStrictEqual(sorter.sortReverse(input), expected);
    });

    test('Sorter: Descending Insensitive', () => {
        const input = ['a', 'B', 'c'];
        const expected = ['c', 'B', 'a']; // c > b > a
        assert.deepStrictEqual(sorter.sortDescInsensitive(input), expected);
    });

    test('Sorter: Natural', () => {
        const input = ['img10.png', 'img2.png', 'img1.png'];
        const expected = ['img1.png', 'img2.png', 'img10.png'];
        assert.deepStrictEqual(sorter.sortNatural(input), expected);
    });

    // ========================================================================
    // CLEANER TESTS
    // ========================================================================

    test('Cleaner: Trim Leading', () => {
        const input = ['  abc', '\ttab', 'none'];
        const expected = ['abc', 'tab', 'none'];
        assert.deepStrictEqual(cleaner.trimLeadingWhitespace(input), expected);
    });

    test('Cleaner: Trim Both', () => {
        const input = ['  abc  ', '  '];
        const expected = ['abc', ''];
        assert.deepStrictEqual(cleaner.trimBothWhitespace(input), expected);
    });

    test('Cleaner: Condense Blank Lines', () => {
        const input = ['text', '', '', '', 'more text', '', 'end'];
        const expected = ['text', '', 'more text', '', 'end'];
        assert.deepStrictEqual(cleaner.condenseBlankLines(input), expected);
    });

    test('Cleaner: Keep Only Duplicates', () => {
        const input = ['a', 'b', 'a', 'c', 'b'];
        const expected = ['a', 'b', 'a', 'b'];
        assert.deepStrictEqual(cleaner.keepOnlyDuplicates(input), expected);
    });

    // ========================================================================
    // TRANSFORMER TESTS
    // ========================================================================

    test('Transformer: Sentence Case', () => {
        const input = ['hello world', 'THIS IS TEST'];
        const expected = ['Hello world', 'This is test'];
        assert.deepStrictEqual(transformer.transformSentence(input), expected);
    });

    test('Transformer: Title Case', () => {
        const input = ['the line king', 'hello-world'];
        // Updated expectation to match strict Title Case logic
        const expected = ['The Line King', 'Hello-World'];
        assert.deepStrictEqual(transformer.transformTitle(input), expected);
    });

    test('Transformer: Pascal Case', () => {
        const input = ['hello world', 'camelCase'];
        const expected = ['HelloWorld', 'CamelCase'];
        assert.deepStrictEqual(transformer.transformPascal(input), expected);
    });

    test('Transformer: JSON Escape', () => {
        const input = ['Text with "quotes"'];
        const expected = ['Text with \\"quotes\\"'];
        assert.deepStrictEqual(transformer.transformJsonEscape(input), expected);
    });

    test('Transformer: Base64 Roundtrip', () => {
        const input = ['Line King'];
        const encoded = transformer.transformBase64Encode(input);
        assert.deepStrictEqual(encoded, ['TGluZSBLaW5n']);

        const decoded = transformer.transformBase64Decode(encoded);
        assert.deepStrictEqual(decoded, input);
    });

    test('Transformer: URL Encode', () => {
        const input = ['foo bar?'];
        const expected = ['foo%20bar%3F'];
        assert.deepStrictEqual(transformer.transformUrlEncode(input), expected);
    });
});
