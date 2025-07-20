import * as vscode from 'vscode';

let yatc_output = vscode.window.createOutputChannel("yatc-output");
let showingLineNumSettingEnabled = true
const onDidChangeInlayHintsEmitter = new vscode.EventEmitter<void>();
const onDidChangeInlayHints = onDidChangeInlayHintsEmitter.event;

function getNonDisplayOrderURI(document: vscode.TextDocument) {
	const fullPath = document.uri.path
	const endingFolder = fullPath.split("/").at(-2)
	const targetUri = vscode.Uri.joinPath(vscode.Uri.file(document.fileName), "../", endingFolder + ".yatc")
	return targetUri
}

function getStartingPosOfLevelFromLevelDoc(levelDoc: vscode.TextDocument, levelNameToFind: String): vscode.Position {
	const match = levelNameToFind.match(/level(\d+)/)
	const digitToFind: number = parseInt(match ? match[1] : "-1")
	var curLevelNum = 1;
	yatc_output.appendLine("new version55")
	for (let i = 0; i < levelDoc.lineCount - 2; i++) {
		if (levelDoc.lineAt(i).text.startsWith("@" + levelNameToFind)) {
			curLevelNum -= 1
			if (digitToFind < 0) {
				return new vscode.Position(i, 0)
			}
		}
		if(digitToFind == curLevelNum && levelNameToFind.startsWith("level")) {
			return new vscode.Position(i, 0)
		}
		
		if (levelDoc.lineAt(i).text.startsWith("=====") && !levelDoc.lineAt(i + 1).text.startsWith("@")) {
			curLevelNum += 1
		}

	}
	return new vscode.Position(0, 0)
}

export function activate(context: vscode.ExtensionContext) {

	// yatc_output.show()

	let goUpAFolder = vscode.commands.registerCommand('yatc-shortcuts.goUpAFolder', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const document = editor.document;
			const targetUri = vscode.Uri.joinPath(vscode.Uri.file(document.fileName), 
			document.fileName.includes("display_order") ? "../../" : "../", 
			"display_order.yatc")
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

	context.subscriptions.push(vscode.commands.registerCommand('yatc-shortcuts.showLineNums', () => {
		showingLineNumSettingEnabled = !showingLineNumSettingEnabled;
		onDidChangeInlayHintsEmitter.fire();
		// vscode.window.showInformationMessage(`showingLineNumSettingEnabled is now: ${showingLineNumSettingEnabled}`);
	}));



	const provider = vscode.languages.registerDefinitionProvider(
		{ language: 'youarethecode' },
		{
			provideDefinition(document, position, token) {
				// var adjustedPos = new vscode.Position(position.line, position.)
				var newWord : string = document.lineAt(position.line).text.split(" ").at(-1)!!
				// const word = document.getText(document.getWordRangeAtPosition(position));
				vscode.commands.executeCommand('editor.action.addToNavigationStack');
				if(document.lineAt(position.line).text.includes("/") == false) {
					yatc_output.appendLine("doing top")
					return vscode.workspace.openTextDocument(getNonDisplayOrderURI(document)).then(doc => {
						let levelPos = getStartingPosOfLevelFromLevelDoc(doc, newWord)
						return new vscode.Location(doc.uri, levelPos)
					})
				}
				yatc_output.appendLine("doing bottom")
				const parent_folder = vscode.Uri.joinPath(vscode.Uri.file(document.fileName), "../")
				const targetUri = vscode.Uri.joinPath(parent_folder, newWord, "display_order.yatc");
				
				let pos: vscode.Position = new vscode.Position(0, 0)
				return new vscode.Location(targetUri, pos);
			}
		}
	);

	context.subscriptions.push(provider);

	vscode.languages.registerInlayHintsProvider('youarethecode', {
		onDidChangeInlayHints,
		provideInlayHints(document, range, token) {
			const hints: vscode.InlayHint[] = [];	
			var curLevelCount = 1
			var curLineNum = 0
			var sawBlank = false
			for (let i = 0; i < document.lineCount - 2; i++) {
				let startsWithEqualSigns = document.lineAt(i).text.startsWith("=====")
				if (i == 0 || startsWithEqualSigns) {
					curLineNum = 0
					sawBlank = false
					if (!document.lineAt(i).text.startsWith("@") && i + 1 < document.lineCount && !document.lineAt(i+1).text.startsWith("@")) {
						var posToShowAt = i == 0 ? new vscode.Position(i, 50) : new vscode.Position(i, 5);
						const hint = new vscode.InlayHint(posToShowAt, `🔎 Level ${curLevelCount}`, vscode.InlayHintKind.Type);
						hints.push(hint);
						curLevelCount += 1
					}
				} 
				
				if (showingLineNumSettingEnabled && !startsWithEqualSigns) {
					if(document.lineAt(i).text.startsWith("@") || document.lineAt(i).text.startsWith("!") || sawBlank) {
						continue
					}
					if(document.lineAt(i).text.trim() == "") {
						sawBlank = true
						continue
					}

					curLineNum += 1
					var lineNumHint = new vscode.Position(i, 0);
					const hint = new vscode.InlayHint(lineNumHint, `[${curLineNum}]`, vscode.InlayHintKind.Type);
					hints.push(hint);
				}

			}
			return hints;
		}
	});
	
}

// This method is called when your extension is deactivated
export function deactivate() { }
