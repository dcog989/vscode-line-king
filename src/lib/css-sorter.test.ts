import { describe, it } from 'bun:test';
import * as assert from 'assert';
import { sortCssText } from './css-sorter-core.js';

describe('CSS Property Sorting', () => {
    describe('Alphabetical Strategy', () => {
        it('should sort properties alphabetically in rule block', () => {
            const input = `.selector {
  z-index: 10;
  display: flex;
  margin: 0;
  padding: 1rem;
  color: red;
}`;

            const expected = `.selector {
  color: red;
  display: flex;
  margin: 0;
  padding: 1rem;
  z-index: 10;
}`;

            assert.strictEqual(sortCssText(input, 'alphabetical'), expected);
        });

        it('should handle multiple rule blocks', () => {
            const input = `.one {
  z-index: 1;
  a: 2;
}

.two {
  m: 3;
  b: 4;
}`;

            const expected = `.one {
  a: 2;
  z-index: 1;
}

.two {
  b: 4;
  m: 3;
}`;

            assert.strictEqual(sortCssText(input, 'alphabetical'), expected);
        });
    });

    describe('Length Strategy', () => {
        it('should sort properties by total length', () => {
            const input = `.selector {
  background-color: rgba(0, 0, 0, 0.5);
  color: red;
  display: flex;
  z-index: 10;
}`;

            const result = sortCssText(input, 'length');
            const lines = result.split('\n');

            const firstProp = lines.find((l: string) => l.includes('color'));
            const lastProp = lines.find((l: string) => l.includes('background-color'));

            assert.ok(firstProp && result.indexOf(firstProp) < result.indexOf(lastProp!));
        });

        it('should preserve declarations order when lengths are equal', () => {
            const input = `.selector {
  color: red;
  margin: 0;
}`;

            const result = sortCssText(input, 'length');
            assert.ok(result.includes('color: red;'));
            assert.ok(result.includes('margin: 0;'));
        });
    });

    describe('Comment Preservation', () => {
        it('should preserve block comments', () => {
            const input = `.selector {
  z-index: 10;
  /* Important comment */
  display: flex;
  color: red;
}`;

            const result = sortCssText(input, 'alphabetical');
            assert.ok(result.includes('/* Important comment */'));
            assert.ok(result.includes('color: red;'));
            assert.ok(result.includes('display: flex;'));
        });

        it('should preserve inline comments', () => {
            const input = `.selector {
  z-index: 10;
  // Important comment
  display: flex;
}`;

            const result = sortCssText(input, 'alphabetical');
            assert.ok(result.includes('// Important comment'));
            assert.ok(result.includes('display: flex;'));
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty rule blocks', () => {
            const input = `.selector {
}`;
            assert.strictEqual(sortCssText(input, 'alphabetical'), input);
        });

        it('should handle single declaration', () => {
            const input = `.selector {
  color: red;
}`;
            assert.strictEqual(sortCssText(input, 'alphabetical'), input);
        });

        it('should handle CSS without rule blocks', () => {
            const input = `/* CSS variables */
:root {
  --primary: red;
}`;
            const result = sortCssText(input, 'alphabetical');
            assert.ok(result.includes('--primary: red;'));
        });

        it('should preserve whitespace structure', () => {
            const input = `.selector {
  color: red;
  margin: 0;
}`;
            const result = sortCssText(input, 'alphabetical');
            assert.ok(result.includes('  color: red;'));
            assert.ok(result.includes('  margin: 0;'));
        });

        it('should handle declarations without semicolons', () => {
            const input = `.selector {
  color: red
  margin: 0
}`;
            const result = sortCssText(input, 'alphabetical');
            assert.ok(result.includes('color: red'));
            assert.ok(result.includes('margin: 0'));
        });
    });

    describe('Property Detection', () => {
        it('should identify valid CSS properties with indentation', () => {
            const input = `.selector {
  color: red;
    display: flex;
  margin-top: 10px;
}`;

            const result = sortCssText(input, 'alphabetical');
            assert.ok(result.includes('color: red;'));
            assert.ok(result.includes('display: flex;'));
            assert.ok(result.includes('margin-top: 10px;'));
        });

        it('should not sort non-CSS content', () => {
            const input = `.selector {
  color: red;
  z-index: 10;
}

Note: this is text
Time: 12:30 PM`;

            const result = sortCssText(input, 'alphabetical');
            assert.ok(result.includes('Note: this is text'));
            assert.ok(result.includes('Time: 12:30 PM'));
        });
    });
});
