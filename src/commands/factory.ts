import * as vscode from 'vscode';
import { applyLineAction, type LineActionOptions } from '../utils/editor.js';

/**
 * Command configuration for line-based operations
 */
interface CommandConfig {
    /** Command identifier */
    id: string;
    /**
     * Line processing function
     * Accepts both synchronous and asynchronous processors
     * - Sync: (lines: string[]) => string[]
     * - Async: (lines: string[]) => Promise<string[]>
     *
     * Use async processors for lazy-loaded modules to avoid blocking the UI thread
     */
    processor: (lines: string[]) => string[] | Promise<string[]>;
    /** Whether to expand selection to full lines (default: true) */
    expandSelection?: boolean;
}

/**
 * Command configuration for custom async handlers
 */
interface AsyncCommandConfig {
    /** Command identifier */
    id: string;
    /** Async command handler */
    handler: (editor: vscode.TextEditor) => Promise<void> | void;
}

/**
 * Unified command factory for registering Line King commands
 * Reduces boilerplate and ensures consistent behavior across all commands
 */
export class CommandFactory {
    constructor(private context: vscode.ExtensionContext) {}

    /**
     * Register a single line-based command
     *
     * @param config Command configuration
     *
     * Example:
     * ```typescript
     * factory.registerLineCommand({
     *     id: 'lineKing.sort.asc',
     *     processor: sorter.sortAsc,
     *     expandSelection: true  // default
     * });
     * ```
     */
    public registerLineCommand(config: CommandConfig): void {
        const options: LineActionOptions = {
            expandSelection: config.expandSelection ?? true,
        };

        this.context.subscriptions.push(
            vscode.commands.registerTextEditorCommand(config.id, (editor) => {
                return applyLineAction(editor, config.processor, options);
            }),
        );
    }

    /**
     * Register multiple line-based commands at once
     * All commands use the same expandSelection setting
     *
     * @param commands Array of command configurations
     * @param expandSelection Default expand selection for all commands (default: true)
     *
     * Example:
     * ```typescript
     * factory.registerLineCommands([
     *     { id: 'lineKing.sort.asc', processor: sorter.sortAsc },
     *     { id: 'lineKing.sort.desc', processor: sorter.sortDesc }
     * ], true);
     * ```
     */
    public registerLineCommands(
        commands: Array<Omit<CommandConfig, 'expandSelection'>>,
        expandSelection: boolean = true,
    ): void {
        for (const cmd of commands) {
            this.registerLineCommand({
                ...cmd,
                expandSelection,
            });
        }
    }

    /**
     * Register a custom async command handler
     * Use this for commands that don't follow the standard line-processing pattern
     *
     * @param config Async command configuration
     *
     * Example:
     * ```typescript
     * factory.registerAsyncCommand({
     *     id: 'lineKing.sort.css',
     *     handler: async (editor) => sortCssProperties(editor)
     * });
     * ```
     */
    public registerAsyncCommand(config: AsyncCommandConfig): void {
        this.context.subscriptions.push(
            vscode.commands.registerTextEditorCommand(config.id, async (editor) => {
                if (!editor || !editor.document) return;
                return config.handler(editor);
            }),
        );
    }

    /**
     * Register multiple async commands at once
     *
     * @param commands Array of async command configurations
     */
    public registerAsyncCommands(commands: AsyncCommandConfig[]): void {
        for (const cmd of commands) {
            this.registerAsyncCommand(cmd);
        }
    }
}

/**
 * Create a command factory instance
 *
 * @param context Extension context
 * @returns CommandFactory instance
 */
export function createCommandFactory(context: vscode.ExtensionContext): CommandFactory {
    return new CommandFactory(context);
}
