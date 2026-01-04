import { z } from 'zod';

/**
 * Zod schemas for runtime configuration validation
 * Ensures type safety and graceful handling of invalid user settings
 */

export const CleanupOnSaveSchema = z.enum([
    'none',
    'removeBlankLines',
    'trimTrailingWhitespace',
    'sortCssProperties'
]).default('none');

export const CssSortStrategySchema = z.enum([
    'alphabetical',
    'length'
]).default('alphabetical');

export const JoinSeparatorSchema = z.string().default(' ');

/**
 * Complete configuration schema
 */
export const ConfigSchema = z.object({
    joinSeparator: JoinSeparatorSchema,
    cleanupOnSave: CleanupOnSaveSchema,
    cssSortStrategy: CssSortStrategySchema,
});

export type Config = z.infer<typeof ConfigSchema>;
export type CleanupOnSave = z.infer<typeof CleanupOnSaveSchema>;
export type CssSortStrategy = z.infer<typeof CssSortStrategySchema>;
