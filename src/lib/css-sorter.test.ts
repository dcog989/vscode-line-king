import * as assert from 'assert';

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
        const PROPERTY_REGEX = /^\s{2,}[-a-z]+(?:-[a-z0-9]+)*\s*:\s*[^:;{}]+;?\s*$/i;

        it('should identify valid CSS properties with indentation', () => {
            assert.strictEqual(PROPERTY_REGEX.test('  color: red;'), true);
            assert.strictEqual(PROPERTY_REGEX.test('    display: flex;'), true);
            assert.strictEqual(PROPERTY_REGEX.test('  margin-top: 10px;'), true);
        });

        it('should reject properties without proper indentation', () => {
            assert.strictEqual(PROPERTY_REGEX.test('color: red;'), false);
            assert.strictEqual(PROPERTY_REGEX.test(' color: red;'), false);
        });

        it('should reject non-property lines', () => {
            assert.strictEqual(PROPERTY_REGEX.test('.selector {'), false);
            assert.strictEqual(PROPERTY_REGEX.test('}'), false);
        });

        it('should reject markdown-like content', () => {
            assert.strictEqual(PROPERTY_REGEX.test('- Item: description'), false);
            assert.strictEqual(PROPERTY_REGEX.test('Note: this is important'), false);
        });
    });

    describe('CSS Value Pattern Validation', () => {
        const CSS_VALUE_PATTERN =
            /(?:[\d.]+(?:px|em|rem|%|vh|vw|ex|ch|cm|mm|in|pt|pc|deg|rad|turn|s|ms)?|#[0-9a-f]{3,8}|rgba?|hsla?|var\(|calc\(|url\(|['"]|\b(?:auto|none|inherit|initial|unset|normal|bold|italic|flex|block|inline|absolute|relative|fixed|hidden|visible|transparent|currentColor|red|blue|white|black)\b)/i;

        it('should recognize valid CSS values with units', () => {
            assert.ok(CSS_VALUE_PATTERN.test('10px'));
            assert.ok(CSS_VALUE_PATTERN.test('1.5rem'));
            assert.ok(CSS_VALUE_PATTERN.test('100%'));
            assert.ok(CSS_VALUE_PATTERN.test('50vh'));
        });

        it('should recognize CSS color values', () => {
            assert.ok(CSS_VALUE_PATTERN.test('#fff'));
            assert.ok(CSS_VALUE_PATTERN.test('#ffffff'));
            assert.ok(CSS_VALUE_PATTERN.test('rgba(0, 0, 0, 0.5)'));
            assert.ok(CSS_VALUE_PATTERN.test('rgb(255, 0, 0)'));
            assert.ok(CSS_VALUE_PATTERN.test('red'));
        });

        it('should recognize CSS functions', () => {
            assert.ok(CSS_VALUE_PATTERN.test('var(--main-color)'));
            assert.ok(CSS_VALUE_PATTERN.test('calc(100% - 20px)'));
            assert.ok(CSS_VALUE_PATTERN.test('url("image.png")'));
        });

        it('should recognize CSS keywords', () => {
            assert.ok(CSS_VALUE_PATTERN.test('auto'));
            assert.ok(CSS_VALUE_PATTERN.test('flex'));
            assert.ok(CSS_VALUE_PATTERN.test('none'));
            assert.ok(CSS_VALUE_PATTERN.test('inherit'));
            assert.ok(CSS_VALUE_PATTERN.test('transparent'));
        });

        it('should not match prose or markdown', () => {
            assert.strictEqual(CSS_VALUE_PATTERN.test('this is a description'), false);
            assert.strictEqual(CSS_VALUE_PATTERN.test('some random text here'), false);
        });
    });

    describe('False Positive Prevention', () => {
        const validateCSSProperty = (line: string): boolean => {
            const PROPERTY_REGEX = /^\s{2,}[-a-z]+(?:-[a-z0-9]+)*\s*:\s*[^:;{}]+;?\s*$/i;
            const CSS_VALUE_PATTERN =
                /(?:[\d.]+(?:px|em|rem|%|vh|vw|ex|ch|cm|mm|in|pt|pc|deg|rad|turn|s|ms)?|#[0-9a-f]{3,8}|rgba?|hsla?|var\(|calc\(|url\(|['"]|\b(?:auto|none|inherit|initial|unset|normal|bold|italic|flex|block|inline|absolute|relative|fixed|hidden|visible|transparent|currentColor|red|blue|white|black)\b)/i;

            if (!PROPERTY_REGEX.test(line)) {
                return false;
            }

            if (!/^\s{2,}/.test(line)) {
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

            if (/^[-*]\s/.test(value)) {
                return false;
            }

            if (/\s{3,}/.test(value)) {
                return false;
            }

            return CSS_VALUE_PATTERN.test(value);
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
