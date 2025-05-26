// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

function getLevelURI(startingDoc: vscode.TextDocument) {

}

export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (yatc_output.appendLine) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// let yatc_output = vscode.window.createOutputChannel("yatc-output");
	// yatc_output.appendLine('Congratulations, your extension "yatc-shortcuts" is now active!');

	// //Write to output.
	// yatc_output.appendLine("I am a banana.");
	// yatc_output.show()
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('yatc-shortcuts.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from YATC Shortcuts!');
		// yatc_output.appendLine('You used hello world in yatc');
	});
	context.subscriptions.push(disposable);

	let goUpAFolder = vscode.commands.registerCommand('yatc-shortcuts.goUpAFolder', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const document = editor.document;
			const targetUri = vscode.Uri.joinPath(vscode.Uri.file(document.fileName), "../../", "display_order.yatc")
			const pos = new vscode.Position(0, 0);
			await vscode.window.showTextDocument(targetUri, { selection: new vscode.Range(pos, pos) });
		}
	});
	context.subscriptions.push(goUpAFolder);

	let goToDisplayOrder = vscode.commands.registerCommand('yatc-shortcuts.goToDisplayOrder', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const document = editor.document;
			const targetUri = vscode.Uri.joinPath(vscode.Uri.file(document.fileName), "../", "display_order.yatc")
			const pos = new vscode.Position(0, 0);
			await vscode.window.showTextDocument(targetUri, { selection: new vscode.Range(pos, pos) });
		}
	});
	context.subscriptions.push(goToDisplayOrder);

	let goToLevelList = vscode.commands.registerCommand('yatc-shortcuts.goToLevelList', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const document = editor.document;
			const fullPath = document.uri.path
			const endingFolder = fullPath.split("/").at(-2)
			const targetUri = vscode.Uri.joinPath(vscode.Uri.file(document.fileName), "../", endingFolder + ".yatc")
			const pos = new vscode.Position(0, 0);
			await vscode.window.showTextDocument(targetUri, { selection: new vscode.Range(pos, pos) });
		}
	});
	context.subscriptions.push(goToLevelList);


	const provider = vscode.languages.registerDefinitionProvider(
		{ language: 'youarethecode' },
		{
			provideDefinition(document, position, token) {
				// yatc_output.appendLine('You used definition in yatc');
				const word = document.getText(document.getWordRangeAtPosition(position));
				// // Logic to find where `word` is defined
				const parent_folder = vscode.Uri.joinPath(vscode.Uri.file(document.fileName), "../")
				const targetUri = vscode.Uri.joinPath(parent_folder, word, "display_order.yatc"); // dynamic path
				
				// yatc_output.appendLine('Target is' + targetUri);
				// const targetPosition = new vscode.Position(line, character);
				let pos: vscode.Position = new vscode.Position(0, 0)
				return new vscode.Location(targetUri, pos);
			}
		}
	);

	context.subscriptions.push(provider);

	vscode.languages.registerInlayHintsProvider('youarethecode', {
		provideInlayHints(document, range, token) {
			const hints: vscode.InlayHint[] = [];
	
			const line = document.lineAt(range.start.line);
			const wordRange = line.range;
			var curLevelCount = 1
			for (let i = 0; i < document.lineCount - 2; i++) {
				if (i == 0 || document.lineAt(i).text.startsWith("=====")) {
					if (!document.lineAt(i).text.startsWith("@") && i + 1 < document.lineCount && !document.lineAt(i+1).text.startsWith("@")) {
						var posToShowAt = i == 0 ? new vscode.Position(i, 50) : new vscode.Position(i, 5);
						const hint = new vscode.InlayHint(posToShowAt, `🔎 Level ${curLevelCount}`, vscode.InlayHintKind.Type);
						hints.push(hint);
						curLevelCount += 1
					}
				}
			}
			return hints;
		}
	});
	
}

// This method is called when your extension is deactivated
export function deactivate() { }
