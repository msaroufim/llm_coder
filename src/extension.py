import * as vscode from 'vscode';
import Anthropic from '@anthropic-ai/sdk';

export function activate(context: vscode.ExtensionContext) {
    console.log('ThunderKittens extension is now active!');

    let disposable = vscode.commands.registerCommand('thunderkittens.getHelp', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const selection = editor.selection;
        const code = editor.document.getText(selection);
        
        if (!code) {
            vscode.window.showInformationMessage('Please select some code to get help with');
            return;
        }

        // Just for testing - we'll add Anthropic later
        const channel = vscode.window.createOutputChannel('ThunderKittens Assistant');
        channel.show();
        channel.appendLine(`Selected code: ${code}`);
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}