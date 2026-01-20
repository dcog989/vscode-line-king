/**
 * Type definitions and runtime configuration validation
 * Ensures type safety and graceful handling of invalid user settings
 *
 * PERFORMANCE OPTIMIZATIONS:
 * 1. No external validation library dependencies
 * 2. Native JavaScript validation for runtime checks
 * 3. Types are exported separately for zero-cost type checking
 */

export type CleanupOnSave =
    | 'none'
    | 'removeBlankLines'
    | 'trimTrailingWhitespace'
    | 'sortCssProperties';
export type CssSortStrategy = 'alphabetical' | 'length';

export interface Config {
    joinSeparator: string;
    cleanupOnSave: CleanupOnSave;
    cssSortStrategy: CssSortStrategy;
}

/**
 * Hardcoded default values
 * Used as fallback without needing any validation library
 */
export const DEFAULT_CONFIG: Config = {
    joinSeparator: ' ',
    cleanupOnSave: 'none',
    cssSortStrategy: 'alphabetical',
} as const;

/**
 * Valid values for configuration options
 */
const VALID_CLEANUP_ACTIONS = new Set<CleanupOnSave>([
    'none',
    'removeBlankLines',
    'trimTrailingWhitespace',
    'sortCssProperties',
]);

const VALID_SORT_STRATEGIES = new Set<CssSortStrategy>(['alphabetical', 'length']);

/**
 * Native JavaScript config validation
 * Performs basic runtime validation without external dependencies
 * It's faster than Zod and sufficient for this use case
 *
 * @param rawConfig - Raw configuration object from VS Code
 * @returns Validated config with defaults applied
 */
export function validateConfigFast(rawConfig: Partial<Config>): Config {
    return {
        joinSeparator:
            typeof rawConfig.joinSeparator === 'string'
                ? rawConfig.joinSeparator
                : DEFAULT_CONFIG.joinSeparator,

        cleanupOnSave: VALID_CLEANUP_ACTIONS.has(rawConfig.cleanupOnSave as CleanupOnSave)
            ? (rawConfig.cleanupOnSave as CleanupOnSave)
            : DEFAULT_CONFIG.cleanupOnSave,

        cssSortStrategy: VALID_SORT_STRATEGIES.has(rawConfig.cssSortStrategy as CssSortStrategy)
            ? (rawConfig.cssSortStrategy as CssSortStrategy)
            : DEFAULT_CONFIG.cssSortStrategy,
    };
}

/**
 * Comprehensive validation with user feedback
 * Validates configuration and returns validation results
 *
 * @param rawConfig - Raw configuration object from VS Code
 * @returns Validation result with error messages if any
 */
export function validateConfigWithFeedback(rawConfig: Partial<Config>): {
    valid: boolean;
    config: Config;
    errors: string[];
} {
    const errors: string[] = [];

    // Validate joinSeparator
    if (rawConfig.joinSeparator !== undefined && typeof rawConfig.joinSeparator !== 'string') {
        errors.push('joinSeparator must be a string');
    }

    // Validate cleanupOnSave
    if (
        rawConfig.cleanupOnSave !== undefined &&
        !VALID_CLEANUP_ACTIONS.has(rawConfig.cleanupOnSave as CleanupOnSave)
    ) {
        errors.push(
            `cleanupOnSave must be one of: ${Array.from(VALID_CLEANUP_ACTIONS).join(', ')}`,
        );
    }

    // Validate cssSortStrategy
    if (
        rawConfig.cssSortStrategy !== undefined &&
        !VALID_SORT_STRATEGIES.has(rawConfig.cssSortStrategy as CssSortStrategy)
    ) {
        errors.push(
            `cssSortStrategy must be one of: ${Array.from(VALID_SORT_STRATEGIES).join(', ')}`,
        );
    }

    return {
        valid: errors.length === 0,
        config: validateConfigFast(rawConfig),
        errors,
    };
}
