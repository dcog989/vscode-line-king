type Asyncify<T> = T extends (...args: infer A) => infer R ? (...args: A) => Promise<R> : T;
type AsyncifyModule<T extends Record<string, unknown>> = {
    [K in keyof T]: Asyncify<T[K]>;
};

/**
 * Creates a lazy proxy for a module, ensuring it's only loaded when accessed.
 * Automatically wraps all exported functions with async wrappers.
 * Returns a type where all functions are async to match runtime behavior.
 *
 * @example
 * ```typescript
 * const lazyCleaner = createLazyProxy<typeof import('../lib/cleaner.js')>('../lib/cleaner.js');
 * await lazyCleaner.removeBlankLines(lines);
 * ```
 */
export function createLazyProxy<T extends Record<string, unknown>>(
    modulePath: string,
): AsyncifyModule<T> {
    let module: T | null = null;

    const loadModule = async (): Promise<T> => {
        if (!module) {
            module = (await import(modulePath)) as T;
        }
        return module;
    };

    return new Proxy({} as T, {
        get: (target, prop: string | symbol) => {
            if (typeof prop !== 'string') {
                throw new Error(`Cannot access symbol property on lazy proxy`);
            }

            return async (...args: unknown[]) => {
                const loadedModule = await loadModule();

                // Check if property exists on the module
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
    }) as AsyncifyModule<T>;
}
