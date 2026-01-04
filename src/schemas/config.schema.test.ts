import * as assert from 'assert';
import {
    CleanupOnSaveSchema,
    ConfigSchema
} from './config.schema.js';

describe('Configuration Schema Validation', () => {
    describe('CleanupOnSaveSchema', () => {
        it('should accept valid values', () => {
            assert.strictEqual(CleanupOnSaveSchema.parse('none'), 'none');
            assert.strictEqual(CleanupOnSaveSchema.parse('removeBlankLines'), 'removeBlankLines');
        });

        it('should reject invalid values', () => {
            assert.throws(() => CleanupOnSaveSchema.parse('invalid'));
        });
    });

    describe('ConfigSchema', () => {
        it('should validate complete config object', () => {
            const config = {
                joinSeparator: ' ',
                cleanupOnSave: 'none' as const,
                cssSortStrategy: 'alphabetical' as const,
            };

            const result = ConfigSchema.parse(config);
            assert.deepStrictEqual(result, config);
        });

        it('should apply defaults for missing fields', () => {
            const result = ConfigSchema.parse({});
            assert.strictEqual(result.joinSeparator, ' ');
            assert.strictEqual(result.cleanupOnSave, 'none');
        });
    });
});
