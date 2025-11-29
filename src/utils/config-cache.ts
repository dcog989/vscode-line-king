import * as vscode from 'vscode';
import { CONFIG } from '../constants';

/**
 * Configuration cache for performance optimization
 * Avoids repeated workspace.getConfiguration calls
 */
class ConfigCache {
    private cache = new Map<string, any>();
    private disposables: vscode.Disposable[] = [];

    constructor() {
        // Listen for configuration changes and invalidate cache
        this.disposables.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(CONFIG.NAMESPACE)) {
                    this.cache.clear();
                }
            })
        );
    }

    public get<T>(key: string, defaultValue: T): T {
        const cacheKey = `${CONFIG.NAMESPACE}.${key}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey) as T;
        }

        const config = vscode.workspace.getConfiguration(CONFIG.NAMESPACE);
        const value = config.get<T>(key, defaultValue);
        this.cache.set(cacheKey, value);
        
        return value;
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.cache.clear();
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
