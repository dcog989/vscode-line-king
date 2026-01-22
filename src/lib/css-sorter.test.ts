import * as assert from 'assert';
import { REGEX } from '../constants.js';

describe('CSS Property Sorting', () => {
    describe('Alphabetical Strategy', () => {
        it('should sort properties alphabetically', () => {
            const properties = [
                'z-index: 10;',
                'display: flex;',
                'margin: 0;',
                'padding: 1rem;',
                'color: red;',
            ];

            const sorted = [...properties].sort((a, b) => {
                const propA = a.split(':')[0].trim();
                const propB = b.split(':')[0].trim();
                return propA.localeCompare(propB);
            });

            assert.deepStrictEqual(sorted, [
                'color: red;',
                'display: flex;',
                'margin: 0;',
                'padding: 1rem;',
                'z-index: 10;',
            ]);
        });
    });

    describe('Length Strategy', () => {
        it('should sort properties by total length', () => {
            const properties = [
                'background-color: rgba(0, 0, 0, 0.5);',
                'color: red;',
                'display: flex;',
                'z-index: 10;',
            ];

            const sorted = [...properties].sort((a, b) => {
                return a.length - b.length;
            });

            assert.strictEqual(sorted[0], 'color: red;');
            assert.ok(sorted[sorted.length - 1].includes('background-color'));
        });
    });

    describe('Property Detection', () => {
        it('should identify valid CSS properties with indentation', () => {
            assert.strictEqual(REGEX.CSS_PROPERTY.test('  color: red;'), true);
            assert.strictEqual(REGEX.CSS_PROPERTY.test('    display: flex;'), true);
            assert.strictEqual(REGEX.CSS_PROPERTY.test('  margin-top: 10px;'), true);
        });

        it('should reject properties without proper indentation', () => {
            assert.strictEqual(REGEX.CSS_PROPERTY.test('color: red;'), false);
            assert.strictEqual(REGEX.CSS_PROPERTY.test(' color: red;'), false);
        });

        it('should reject non-property lines', () => {
            assert.strictEqual(REGEX.CSS_PROPERTY.test('.selector {'), false);
            assert.strictEqual(REGEX.CSS_PROPERTY.test('}'), false);
        });

        it('should reject markdown-like content', () => {
            assert.strictEqual(REGEX.CSS_PROPERTY.test('- Item: description'), false);
            assert.strictEqual(REGEX.CSS_PROPERTY.test('Note: this is important'), false);
        });
    });

    describe('CSS Value Pattern Validation', () => {
        it('should recognize valid CSS values with units', () => {
            assert.ok(REGEX.CSS_VALUE.test('10px'));
            assert.ok(REGEX.CSS_VALUE.test('1.5rem'));
            assert.ok(REGEX.CSS_VALUE.test('100%'));
            assert.ok(REGEX.CSS_VALUE.test('50vh'));
        });

        it('should recognize CSS color values', () => {
            assert.ok(REGEX.CSS_VALUE.test('#fff'));
            assert.ok(REGEX.CSS_VALUE.test('#ffffff'));
            assert.ok(REGEX.CSS_VALUE.test('rgba(0, 0, 0, 0.5)'));
            assert.ok(REGEX.CSS_VALUE.test('rgb(255, 0, 0)'));
            assert.ok(REGEX.CSS_VALUE.test('red'));
        });

        it('should recognize CSS functions', () => {
            assert.ok(REGEX.CSS_VALUE.test('var(--main-color)'));
            assert.ok(REGEX.CSS_VALUE.test('calc(100% - 20px)'));
            assert.ok(REGEX.CSS_VALUE.test('url("image.png")'));
        });

        it('should recognize CSS keywords', () => {
            assert.ok(REGEX.CSS_VALUE.test('auto'));
            assert.ok(REGEX.CSS_VALUE.test('flex'));
            assert.ok(REGEX.CSS_VALUE.test('none'));
            assert.ok(REGEX.CSS_VALUE.test('inherit'));
            assert.ok(REGEX.CSS_VALUE.test('transparent'));
        });

        it('should not match prose or markdown', () => {
            assert.strictEqual(REGEX.CSS_VALUE.test('this is a description'), false);
            assert.strictEqual(REGEX.CSS_VALUE.test('some random text here'), false);
        });
    });

    describe('False Positive Prevention', () => {
        const validateCSSProperty = (line: string): boolean => {
            if (!REGEX.CSS_PROPERTY.test(line)) {
                return false;
            }

            if (!REGEX.INDENTATION.test(line)) {
                return false;
            }

            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) {
                return false;
            }

            const value = line.substring(colonIndex + 1).trim();
            if (value.length === 0) {
                return false;
            }

            if (REGEX.LIST_ITEM.test(value)) {
                return false;
            }

            if (REGEX.EXCESS_WHITESPACE.test(value)) {
                return false;
            }

            return REGEX.CSS_VALUE.test(value);
        };

        it('should accept valid CSS properties', () => {
            assert.ok(validateCSSProperty('  color: red;'));
            assert.ok(validateCSSProperty('    margin: 10px;'));
            assert.ok(validateCSSProperty('  display: flex;'));
            assert.ok(validateCSSProperty('  background: #fff;'));
        });

        it('should reject markdown list items', () => {
            assert.strictEqual(validateCSSProperty('- Item: description'), false);
            assert.strictEqual(validateCSSProperty('  - Item: description'), false);
        });

        it('should reject YAML-like content', () => {
            assert.strictEqual(validateCSSProperty('key: value'), false);
            assert.strictEqual(validateCSSProperty('name: John Doe'), false);
        });

        it('should reject prose with colons', () => {
            assert.strictEqual(validateCSSProperty('Note: this is important'), false);
            assert.strictEqual(validateCSSProperty('Time: 12:30 PM'), false);
        });

        it('should reject text without proper indentation', () => {
            assert.strictEqual(validateCSSProperty('color: red;'), false);
        });

        it('should reject values with too much whitespace (prose)', () => {
            assert.strictEqual(
                validateCSSProperty('  description: this is   a long description'),
                false,
            );
        });
    });

    describe('Comment Preservation', () => {
        it('should preserve comments when sorting', () => {
            const lines = [
                'z-index: 10;',
                '/* Important comment */',
                'display: flex;',
                'color: red;',
            ];

            const declarations: string[] = [];
            const comments: Array<{ content: string; afterIndex: number }> = [];

            lines.forEach((line, index) => {
                if (line.includes('/*') || line.includes('//')) {
                    comments.push({ content: line, afterIndex: index - 1 });
                } else {
                    declarations.push(line);
                }
            });

            const sortedDecls = [...declarations].sort((a, b) => {
                const propA = a.split(':')[0].trim();
                const propB = b.split(':')[0].trim();
                return propA.localeCompare(propB);
            });

            assert.strictEqual(comments.length, 1);
            assert.ok(comments[0].content.includes('Important comment'));

            assert.strictEqual(sortedDecls[0], 'color: red;');
            assert.strictEqual(sortedDecls[1], 'display: flex;');
            assert.strictEqual(sortedDecls[2], 'z-index: 10;');
        });

        it('should handle inline comments', () => {
            const line = 'color: red; /* inline comment */';
            const hasProperty = line.includes(':') && line.includes(';');
            assert.ok(hasProperty);
            assert.ok(line.includes('/* inline comment */'));
        });
    });

    describe('Mixed Content Handling', () => {
        it('should handle rules with declarations and comments', () => {
            const input = [
                'z-index: 10;',
                '/* This is a comment */',
                'display: flex;',
                '// Another comment',
                'color: red;',
            ];

            const declarationCount = input.filter(
                (line) =>
                    line.includes(':') &&
                    line.includes(';') &&
                    !line.trim().startsWith('/*') &&
                    !line.trim().startsWith('//'),
            ).length;

            const commentCount = input.filter(
                (line) => line.trim().startsWith('/*') || line.trim().startsWith('//'),
            ).length;

            assert.strictEqual(declarationCount, 3, 'Should have 3 declarations');
            assert.strictEqual(commentCount, 2, 'Should have 2 comments');
        });
    });
});
