import * as vscode from 'vscode';
import { CONFIG } from '../constants.js';
import type { CleanupOnSave, Config, CssSortStrategy } from '../schemas/config.schema.js';
import {
    DEFAULT_CONFIG,
    validateConfigFast,
    validateConfigWithFeedback,
} from '../schemas/config.schema.js';

/**
 * Configuration cache with ultra-fast validation
 *
 * PERFORMANCE OPTIMIZATIONS:
 * 1. Fast-path validation using native JavaScript (no Zod)
 * 2. Validation only on explicit validateAll() call (user feedback)
 * 3. Config loaded once and cached in memory
 * 4. Asynchronous reload on configuration changes (non-blocking)
 *
 * Performance characteristics:
 * - Initial load: <5ms (fast validation)
 * - Config access: <0.01ms (simple property access)
 * - Full validation: ~10ms (native JavaScript validation)
 */
class ConfigCache {
    private config: Config | null = null;
    private disposables: vscode.Disposable[] = [];
    private isInitialized = false;
    private initializationPromise: Promise<void> | null = null;
    private isActivated = false;

    constructor() {
        // Defer all initialization until activate() is called
        // This prevents module load time from impacting extension activation
    }

    /**
     * Initialize the config cache - call this from activate()
     * This ensures we only register listeners after the extension is activated
     * Returns a promise that resolves when config is loaded
     */
    public async initialize(): Promise<void> {
        if (this.isActivated) {
            return;
        }

        this.isActivated = true;

        // Load configuration (using fast validation)
        this.initializationPromise = this.loadConfigFast();
        await this.initializationPromise;

        // Listen for configuration changes and reload asynchronously
        this.disposables.push(
            vscode.workspace.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration(CONFIG.NAMESPACE)) {
                    // Reload config in background (non-blocking)
                    this.loadConfigFast();
                }
            }),
        );
    }

    /**
     * Load configuration using fast native validation
     * This is PRIMARY load path - no external dependencies
     *
     * Performance: <5ms
     */
    private async loadConfigFast(): Promise<void> {
        try {
            const vsConfig = vscode.workspace.getConfiguration(CONFIG.NAMESPACE);

            // Read all config values at once
            const rawConfig: Partial<Config> = {
                joinSeparator: vsConfig.get<string>('joinSeparator'),
                cleanupOnSave: vsConfig.get<CleanupOnSave>('cleanupOnSave'),
                cssSortStrategy: vsConfig.get<CssSortStrategy>('cssSortStrategy'),
            };

            // Fast validation using native JavaScript
            this.config = validateConfigFast(rawConfig);
            this.isInitialized = true;
        } catch {
            // Fall back to hardcoded defaults
            this.config = { ...DEFAULT_CONFIG };
            this.isInitialized = true;
        }
    }

    /**
     * Load and validate configuration with comprehensive feedback
     * Only used when explicitly called (e.g., for user feedback)
     *
     * Performance: ~10ms (native JavaScript validation)
     */
    private async loadConfigWithValidation(): Promise<void> {
        try {
            const vsConfig = vscode.workspace.getConfiguration(CONFIG.NAMESPACE);

            // Read all config values at once
            const rawConfig: Partial<Config> = {
                joinSeparator: vsConfig.get<string>('joinSeparator'),
                cleanupOnSave: vsConfig.get<CleanupOnSave>('cleanupOnSave'),
                cssSortStrategy: vsConfig.get<CssSortStrategy>('cssSortStrategy'),
            };

            // Comprehensive validation with feedback
            const result = validateConfigWithFeedback(rawConfig);

            if (!result.valid) {
                // Show user-friendly error message
                const errorMessages = result.errors.join(', ');
                vscode.window.showWarningMessage(
                    `Line King: Invalid settings detected (${errorMessages}). Using defaults.`,
                    'OK',
                );
            }

            this.config = result.config;
            this.isInitialized = true;
        } catch {
            // Fall back to hardcoded defaults
            this.config = { ...DEFAULT_CONFIG };
            this.isInitialized = true;
        }
    }

    /**
     * Ensure config is loaded before accessing
     * Returns immediately if already initialized
     */
    private async ensureInitialized(): Promise<void> {
        if (this.isInitialized) {
            return;
        }
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
    }

    /**
     * Get configuration value with type safety
     * Config is pre-validated, so this is a simple property access
     *
     * Performance: <0.01ms
     *
     * @param key Configuration key
     * @param defaultValue Default value if config not initialized
     * @returns Configuration value
     */
    public get<K extends keyof Config>(key: K, defaultValue: Config[K]): Config[K] {
        // Config should always be initialized after constructor
        if (!this.config) {
            return defaultValue;
        }

        return this.config[key];
    }

    /**
     * Async version of get() that ensures initialization
     * Use this in non-critical paths where you can await
     */
    public async getAsync<K extends keyof Config>(
        key: K,
        defaultValue: Config[K],
    ): Promise<Config[K]> {
        await this.ensureInitialized();
        return this.get(key, defaultValue);
    }

    /**
     * Get entire validated config object
     * Useful for passing config to functions that need multiple values
     */
    public getAll(): Config {
        if (!this.config) {
            return { ...DEFAULT_CONFIG };
        }
        return { ...this.config };
    }

    /**
     * Get strongly-typed cleanup action
     * Pre-validated in cache for optimal performance
     */
    public getCleanupAction(): CleanupOnSave {
        return this.get('cleanupOnSave', DEFAULT_CONFIG.cleanupOnSave);
    }

    /**
     * Get strongly-typed CSS sort strategy
     * Pre-validated in cache for optimal performance
     */
    public getCssSortStrategy(): CssSortStrategy {
        return this.get('cssSortStrategy', DEFAULT_CONFIG.cssSortStrategy);
    }

    /**
     * Get join separator
     * Pre-validated in cache for optimal performance
     */
    public getJoinSeparator(): string {
        return this.get('joinSeparator', DEFAULT_CONFIG.joinSeparator);
    }

    /**
     * Validate all current configuration with comprehensive feedback
     * Useful for startup validation with user feedback
     *
     * This provides comprehensive validation and user-friendly error messages
     *
     * Performance: ~10ms
     */
    public async validateAll(): Promise<boolean> {
        await this.ensureInitialized();
        await this.loadConfigWithValidation();
        return this.config !== null;
    }

    /**
     * Check if cache is initialized
     * Useful for testing or debugging
     */
    public isReady(): boolean {
        return this.isInitialized;
    }

    /**
     * Force reload of configuration (using fast validation)
     * Useful for testing or manual refresh
     */
    public async reload(): Promise<void> {
        this.config = null;
        await this.loadConfigFast();
    }

    /**
     * Force reload with full validation
     * Useful when you need comprehensive validation and error messages
     */
    public async reloadWithValidation(): Promise<void> {
        this.config = null;
        await this.loadConfigWithValidation();
    }

    public dispose(): void {
        this.disposables.forEach((d) => d.dispose());
        this.config = null;
        this.isInitialized = false;
        this.initializationPromise = null;
    }
}

// Export singleton instance
export const configCache = new ConfigCache();

/**
 * Dispose method to be called on extension deactivation
 */
export function disposeConfigCache(): void {
    configCache.dispose();
}
