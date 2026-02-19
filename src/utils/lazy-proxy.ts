/**
 * Creates a lazy proxy for a module, ensuring it's only loaded when accessed.
 * Automatically wraps all exported functions with async wrappers.
 *
 * @example
 * ```typescript
 * const lazyCleaner = createLazyProxy<typeof import('../lib/cleaner.js')>('../lib/cleaner.js');
 * await lazyCleaner.removeBlankLines(lines);
 * ```
 */
export function createLazyProxy<T extends Record<string, unknown>>(modulePath: string): T {
    let module: T | null = null;
    let loadingPromise: Promise<T> | null = null;

    const loadModule = async (): Promise<T> => {
        if (module) {
            return module;
        }
        if (!loadingPromise) {
            loadingPromise = import(modulePath).then((m) => {
                module = m as T;
                return module;
            });
        }
        return loadingPromise;
    };

    return new Proxy({} as T, {
        get: (_target, prop: string | symbol) => {
            if (typeof prop !== 'string') {
                return undefined;
            }

            return async (...args: unknown[]) => {
                const loadedModule = await loadModule();

                if (!(prop in loadedModule)) {
                    const availableExports = Object.keys(loadedModule).join(', ');
                    throw new Error(
                        `Property "${prop}" does not exist in module "${modulePath}". ` +
                            `Available exports: ${availableExports || '(none)'}`,
                    );
                }

                const func = loadedModule[prop];
                if (typeof func !== 'function') {
                    throw new Error(
                        `Property "${prop}" is not a function in module "${modulePath}"`,
                    );
                }
                return func(...args);
            };
        },
    }) as T;
}
