import * as vscode from 'vscode';

export class Logger {
    private static outputChannel: vscode.OutputChannel;

    public static initialize(context: vscode.ExtensionContext): void {
        this.outputChannel = vscode.window.createOutputChannel('Line King');
        context.subscriptions.push(this.outputChannel);
    }

    public static log(message: string): void {
        this.write('INFO', message);
    }

    public static warn(message: string): void {
        this.write('WARN', message);
    }

    public static error(message: string, error?: unknown): void {
        this.write('ERROR', message);
        if (error) {
            this.outputChannel.appendLine(
                error instanceof Error ? error.stack || error.message : String(error),
            );
            this.outputChannel.show(true); // Focus the output channel on error
        }
    }

    private static write(level: string, message: string): void {
        if (!this.outputChannel) {
            // eslint-disable-next-line no-console
            console.log(`[${level}] ${message}`);
            return;
        }
        const timestamp = new Date().toLocaleTimeString();
        this.outputChannel.appendLine(`[${timestamp}] [${level}] ${message}`);
    }

    /**
     * Safely executes an async function and handles errors consistently
     * Logs errors but doesn't throw - use for non-critical operations
     */
    public static async safeExecute<T>(
        operation: () => Promise<T>,
        errorMessage: string,
        defaultValue?: T,
    ): Promise<T | undefined> {
        try {
            return await operation();
        } catch (error) {
            this.error(errorMessage, error);
            return defaultValue;
        }
    }

    /**
     * Safely executes a sync function and handles errors consistently
     * Logs errors but doesn't throw - use for non-critical operations
     */
    public static safeExecuteSync<T>(
        operation: () => T,
        errorMessage: string,
        defaultValue?: T,
    ): T | undefined {
        try {
            return operation();
        } catch (error) {
            this.error(errorMessage, error);
            return defaultValue;
        }
    }
}
