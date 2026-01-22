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
}
