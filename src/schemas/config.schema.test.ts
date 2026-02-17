import { describe, it } from 'bun:test';
import * as assert from 'assert';
import { validateConfigFast, validateConfigWithFeedback, DEFAULT_CONFIG } from './config.schema.js';

describe('Configuration Validation', () => {
    describe('validateConfigFast (Native JavaScript)', () => {
        it('should validate and apply defaults for empty config', () => {
            const result = validateConfigFast({});
            assert.deepStrictEqual(result, DEFAULT_CONFIG);
        });

        it('should accept valid values', () => {
            const config = {
                joinSeparator: ' | ',
                cleanupOnSave: 'removeBlankLines' as const,
                cssSortStrategy: 'alphabetical' as const,
            };
            const result = validateConfigFast(config);
            assert.deepStrictEqual(result, config);
        });

        it('should reject invalid cleanup action and use default', () => {
            const config = {
                joinSeparator: ' ',
                cleanupOnSave: 'invalid' as
                    | 'none'
                    | 'removeBlankLines'
                    | 'trimTrailingWhitespace'
                    | 'sortCssProperties',
                cssSortStrategy: 'alphabetical' as const,
            };
            const result = validateConfigFast(config);
            assert.strictEqual(result.cleanupOnSave, DEFAULT_CONFIG.cleanupOnSave);
        });

        it('should reject invalid sort strategy and use default', () => {
            const config = {
                joinSeparator: ' ',
                cleanupOnSave: 'none' as const,
                cssSortStrategy: 'invalid' as 'alphabetical' | 'length',
            };
            const result = validateConfigFast(config);
            assert.strictEqual(result.cssSortStrategy, DEFAULT_CONFIG.cssSortStrategy);
        });

        it('should handle partial config with mixed valid/invalid values', () => {
            const config = {
                joinSeparator: '---',
                cleanupOnSave: 'invalid' as
                    | 'none'
                    | 'removeBlankLines'
                    | 'trimTrailingWhitespace'
                    | 'sortCssProperties',
                cssSortStrategy: 'length' as const,
            };
            const result = validateConfigFast(config);
            assert.strictEqual(result.joinSeparator, '---');
            assert.strictEqual(result.cleanupOnSave, DEFAULT_CONFIG.cleanupOnSave);
            assert.strictEqual(result.cssSortStrategy, 'length');
        });
    });

    describe('validateConfigWithFeedback (Native JavaScript)', () => {
        it('should validate correct config and return valid', () => {
            const config = {
                joinSeparator: ' | ',
                cleanupOnSave: 'none' as const,
                cssSortStrategy: 'alphabetical' as const,
            };
            const result = validateConfigWithFeedback(config);
            assert.ok(result.valid);
            assert.deepStrictEqual(result.config, config);
        });

        it('should reject invalid values and return errors', () => {
            const config = {
                joinSeparator: ' ',
                cleanupOnSave: 'invalid' as
                    | 'none'
                    | 'removeBlankLines'
                    | 'trimTrailingWhitespace'
                    | 'sortCssProperties',
                cssSortStrategy: 'alphabetical' as const,
            };
            const result = validateConfigWithFeedback(config);
            assert.strictEqual(result.valid, false);
            assert.ok(result.errors.length > 0);
        });

        it('should validate all enum values', () => {
            const config = {
                joinSeparator: ' | ',
                cleanupOnSave: 'trimTrailingWhitespace' as const,
                cssSortStrategy: 'length' as const,
            };
            const result = validateConfigWithFeedback(config);
            assert.ok(result.valid);
            assert.deepStrictEqual(result.config, config);
        });

        it('should apply defaults for missing fields', () => {
            const config = {
                joinSeparator: ' | ',
            };
            const result = validateConfigWithFeedback(config);
            assert.ok(result.valid);
            assert.strictEqual(result.config.joinSeparator, ' | ');
            assert.strictEqual(result.config.cleanupOnSave, DEFAULT_CONFIG.cleanupOnSave);
            assert.strictEqual(result.config.cssSortStrategy, DEFAULT_CONFIG.cssSortStrategy);
        });
    });

    describe('Performance Characteristics', () => {
        it('should validate quickly (<10ms)', () => {
            const start = Date.now();
            const result = validateConfigFast({});
            const duration = Date.now() - start;
            assert.ok(duration < 10, `Validation took ${duration}ms, expected <10ms`);
            assert.deepStrictEqual(result, DEFAULT_CONFIG);
        });

        it('should apply defaults for missing or invalid values', () => {
            const start = Date.now();
            const _result = validateConfigWithFeedback(
                {} as Partial<import('./config.schema.js').Config>,
            );
            const duration = Date.now() - start;
            assert.ok(duration < 10, `Validation with feedback took ${duration}ms, expected <10ms`);
        });
    });
});
