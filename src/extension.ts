import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	const disposable = vscode.commands.registerCommand('json-path-copy.copyPath', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor found');
			return;
		}
		
		const document = editor.document;
		if (document.languageId !== 'json') {
			vscode.window.showErrorMessage('Active editor is not a JSON file');
			return;
		}


		const selection = editor.selection;
   const cursorPosition = selection.active;
		const path = getJsonPath(document, cursorPosition);

		if (path) {
			vscode.env.clipboard.writeText(path);
			vscode.window.showInformationMessage(`Copied JSON path: ${path}`);
	} else {
			vscode.window.showErrorMessage('Unable to determine JSON path at cursor position.');
	}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function getJsonPath(document: vscode.TextDocument, position: vscode.Position): string | null {
	const text = document.getText();
	const offset = document.offsetAt(position);
	const path: string[] = [];

	let inString = false;
	let stringStart = -1;
	let currentKey = '';
	let arrayIndex = 0;

	for (let i = 0; i <= offset; i++) {
			const char = text[i];

			if (char === '"' && (i === 0 || text[i - 1] !== '\\')) {
					if (inString) {
							inString = false;
							if (stringStart !== -1) {
									currentKey = text.substring(stringStart, i);
							}
					} else {
							inString = true;
							stringStart = i + 1;
					}
			} else if (!inString) {
					if (char === '{') {
							if (currentKey) {
									path.push(currentKey);
									currentKey = '';
							}
					} else if (char === '[') {
							arrayIndex = 0;
					} else if (char === ']') {
							path.pop();
					} else if (char === ',') {
							arrayIndex++;
							currentKey = '';
					} else if (char === ':') {
							if (currentKey) {
									path.push(currentKey);
									currentKey = '';
							} else {
									path.push(arrayIndex.toString());
							}
					}
			}
	}

	// 現在のキーまたはインデックスをパスに追加
	if (currentKey) {
		path.push(currentKey);
} else if (!inString && arrayIndex > 0) {
		path.push(arrayIndex.toString());
}

	return path.join('.');
}