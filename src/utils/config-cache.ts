import * as vscode from 'vscode';
import { CONFIG } from '../constants.js';
import type { CleanupOnSave, Config, CssSortStrategy } from '../schemas/config.schema.js';
import { ConfigSchema } from '../schemas/config.schema.js';

/**
 * Configuration cache with Zod validation and eager loading
 * Validates the entire config object once on initialization/change
 * Provides type-safe access to workspace configuration
 *
 * Performance optimizations:
 * - Validates entire config object once instead of per-key
 * - Eager loads all configs on initialization
 * - Pre-populates cache to avoid synchronous getConfiguration calls
 * - Refreshes cache asynchronously on configuration changes
 */
class ConfigCache {
    private config: Config | null = null;
    private disposables: vscode.Disposable[] = [];
    private isInitialized = false;
    private initializationPromise: Promise<void> | null = null;

    constructor() {
        // Eagerly load and validate configuration
        this.initializationPromise = this.loadConfig();

        // Listen for configuration changes and reload cache asynchronously
        this.disposables.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(CONFIG.NAMESPACE)) {
                    // Asynchronously reload config to avoid blocking
                    this.loadConfig();
                }
            })
        );
    }

    /**
     * Load and validate entire configuration object
     * This prevents per-key validation and multiple getConfiguration calls
     */
    private async loadConfig(): Promise<void> {
        try {
            const vsConfig = vscode.workspace.getConfiguration(CONFIG.NAMESPACE);

            // Read all config values at once
            const rawConfig = {
                joinSeparator: vsConfig.get('joinSeparator'),
                cleanupOnSave: vsConfig.get('cleanupOnSave'),
                cssSortStrategy: vsConfig.get('cssSortStrategy'),
            };

            // Validate entire config object with Zod
            // This applies defaults for missing values and validates types
            const parseResult = ConfigSchema.safeParse(rawConfig);

            if (parseResult.success) {
                this.config = parseResult.data;
            } else {
                // Validation failed - use defaults and show warning
                console.warn('[Line King] Configuration validation failed:', parseResult.error);

                // Parse with defaults to get a valid config object
                this.config = ConfigSchema.parse({});

                // Show user-friendly error message
                const errorMessages = parseResult.error.issues
                    .map(err => `${err.path.join('.')}: ${err.message}`)
                    .join(', ');

                vscode.window.showWarningMessage(
                    `Line King: Invalid settings detected (${errorMessages}). Using defaults.`,
                    'OK'
                );
            }

            this.isInitialized = true;
        } catch (error) {
            console.error('[Line King] Failed to load configuration:', error);

            // Fall back to defaults
            this.config = ConfigSchema.parse({});
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
     * @param key Configuration key
     * @param defaultValue Default value if config not initialized
     * @returns Configuration value
     */
    public get<K extends keyof Config>(key: K, defaultValue: Config[K]): Config[K] {
        // Config should always be initialized after constructor
        if (!this.config) {
            console.warn(`[Line King] Config accessed before initialization: ${key}`);
            return defaultValue;
        }

        return this.config[key];
    }

    /**
     * Async version of get() that ensures initialization
     * Use this in non-critical paths where you can await
     */
    public async getAsync<K extends keyof Config>(key: K, defaultValue: Config[K]): Promise<Config[K]> {
        await this.ensureInitialized();
        return this.get(key, defaultValue);
    }

    /**
     * Get the entire validated config object
     * Useful for passing config to functions that need multiple values
     */
    public getAll(): Config {
        if (!this.config) {
            console.warn('[Line King] Config accessed before initialization');
            return ConfigSchema.parse({});
        }
        return { ...this.config };
    }

    /**
     * Get strongly-typed cleanup action
     * Pre-validated in cache for optimal performance
     */
    public getCleanupAction(): CleanupOnSave {
        return this.get('cleanupOnSave', 'none');
    }

    /**
     * Get strongly-typed CSS sort strategy
     * Pre-validated in cache for optimal performance
     */
    public getCssSortStrategy(): CssSortStrategy {
        return this.get('cssSortStrategy', 'alphabetical');
    }

    /**
     * Get join separator
     * Pre-validated in cache for optimal performance
     */
    public getJoinSeparator(): string {
        return this.get('joinSeparator', ' ');
    }

    /**
     * Validate all current configuration
     * Useful for startup validation and health checks
     */
    public async validateAll(): Promise<boolean> {
        await this.ensureInitialized();
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
     * Force reload of configuration
     * Useful for testing or manual refresh
     */
    public async reload(): Promise<void> {
        this.config = null;
        await this.loadConfig();
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
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
