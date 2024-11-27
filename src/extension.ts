import * as vscode from 'vscode';
import fetch from 'node-fetch';

const THUNDERKITTENS_EXAMPLES = `
Example 1: Matrix Multiplication
tk::Matrix A(1000, 1000);
tk::Matrix B(1000, 1000);
tk::matrixMultiply(A, B, C); // C = A * B

Example 2: Parallel Reduction
tk::Vector<float> data(1000000);
float sum = tk::reduce(data, tk::ReductionOp::Sum);

Example 3: Custom Kernel
tk::Kernel myKernel = tk::makeKernel([](int idx) {
    // Custom computation
});
tk::launch(myKernel, numThreads);
`;

async function getStoredApiKey(): Promise<string | undefined> {
    const config = vscode.workspace.getConfiguration('thunderkittens');
    return config.get<string>('apiKey');
}

async function setApiKey() {
    const apiKey = await vscode.window.showInputBox({
        prompt: 'Enter your Anthropic API key',
        password: true
    });

    if (apiKey) {
        const config = vscode.workspace.getConfiguration('thunderkittens');
        await config.update('apiKey', apiKey, true);
        vscode.window.showInformationMessage('API key saved successfully');
    }
}

export function activate(context: vscode.ExtensionContext) {
    let setApiKeyCommand = vscode.commands.registerCommand('thunderkittens.setApiKey', setApiKey);
    context.subscriptions.push(setApiKeyCommand);

    let disposable = vscode.commands.registerCommand('thunderkittens.getHelp', async () => {
        try {
            let apiKey = await getStoredApiKey();
            
            if (!apiKey) {
                await setApiKey();
                apiKey = await getStoredApiKey();
            }

            if (!apiKey) {
                vscode.window.showErrorMessage('API key is required');
                return;
            }

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

            const channel = vscode.window.createOutputChannel('ThunderKittens Assistant');
            channel.show();
            channel.appendLine('Analyzing your code...');

            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: "claude-3-sonnet-20240229",
                    max_tokens: 1024,
                    system: "You are a helpful code assistant for the ThunderKittens CUDA library. Provide code suggestions in a clean format without explanations.",
                    messages: [{
                        role: "user",
                        content: `Here are some example usage patterns:

${THUNDERKITTENS_EXAMPLES}

Transform this code to use ThunderKittens APIs effectively:

${code}`
                    }]
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API request failed: ${errorText}`);
            }

            const result = await response.json();
            
            channel.clear();
            if (result.content?.[0]?.text) {
                channel.appendLine('Suggested ThunderKittens code:');
                channel.appendLine('----------------------------------------');
                channel.appendLine(result.content[0].text);
                channel.appendLine('----------------------------------------');
                channel.appendLine('You can copy this code from the output panel.');
            } else {
                channel.appendLine('Error: Unexpected API response');
                channel.appendLine(JSON.stringify(result, null, 2));
            }

        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error}`);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}