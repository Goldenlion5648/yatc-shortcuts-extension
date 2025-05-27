import * as vscode from 'vscode';

let yatc_output = vscode.window.createOutputChannel("yatc-output");

function getNonDisplayOrderURI(document: vscode.TextDocument) {
	const fullPath = document.uri.path
	const endingFolder = fullPath.split("/").at(-2)
	const targetUri = vscode.Uri.joinPath(vscode.Uri.file(document.fileName), "../", endingFolder + ".yatc")
	return targetUri
}

function getStartingPosOfLevelFromLevelDoc(levelDoc: vscode.TextDocument, levelNameToFind: String): vscode.Position {
	const match = levelNameToFind.match(/\d+/)
	const digitToFind: Number = parseInt(match ? match[0] : "0")
	var curLevelCount = 1;
	for (let i = 0; i < levelDoc.lineCount - 2; i++) {
		if(Number.isInteger(digitToFind) && digitToFind == curLevelCount) {
			return new vscode.Position(i, 0)
		}

		if (!Number.isInteger(digitToFind) && levelDoc.lineAt(i).text.startsWith("@" + levelNameToFind)) {
			return new vscode.Position(i, 0)
		}
		
		if (levelDoc.lineAt(i).text.startsWith("=====")) {
			curLevelCount += 1
		}

	}
	return new vscode.Position(0, 0)
}

export function activate(context: vscode.ExtensionContext) {

	yatc_output.show()

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
			const targetUri = getNonDisplayOrderURI(document)
			const pos = new vscode.Position(0, 0);
			await vscode.window.showTextDocument(targetUri, { selection: new vscode.Range(pos, pos) });
		}
	});
	context.subscriptions.push(goToLevelList);


	const provider = vscode.languages.registerDefinitionProvider(
		{ language: 'youarethecode' },
		{
			provideDefinition(document, position, token) {
				const word = document.getText(document.getWordRangeAtPosition(position));
				if(document.lineAt(position.line).text.includes("/") == false) {
					yatc_output.appendLine("doing top")
					return vscode.workspace.openTextDocument(getNonDisplayOrderURI(document)).then(doc => {
						let levelPos = getStartingPosOfLevelFromLevelDoc(doc, word)
						return new vscode.Location(doc.uri, levelPos)
					})
				}
				yatc_output.appendLine("doing bottom")
				const parent_folder = vscode.Uri.joinPath(vscode.Uri.file(document.fileName), "../")
				const targetUri = vscode.Uri.joinPath(parent_folder, word, "display_order.yatc");
				
				let pos: vscode.Position = new vscode.Position(0, 0)
				return new vscode.Location(targetUri, pos);
			}
		}
	);

	context.subscriptions.push(provider);

	vscode.languages.registerInlayHintsProvider('youarethecode', {
		provideInlayHints(document, range, token) {
			const hints: vscode.InlayHint[] = [];	
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
