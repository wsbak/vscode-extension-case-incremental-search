import * as vscode from 'vscode';
import type { ExtensionContext } from "vscode";
import { SrcMmi } from "./mmi_src";


// build regex which exclude letter/number/separator before the beginning or after the end
function buildRegexExclude(separator: string, preceded: boolean): string {
	if (separator === ".") {
		separator = "\\.";
	}
	const precededStr = preceded === true ? "<" : "";
	// \d    = digit
	return `(?${precededStr}![a-zA-Z\\d${separator}])`;

	// \p{L} = any letter, not only ascii/latin
	// xxxCase manage only ascii characters : see test('xxxCase'
	// So using \p{L} seems strange/useless/contradictory
}

// build regex which exclude letter/number/separator before the beginning
function buildRegexExcludePreceded(separator: string): string {
	return buildRegexExclude(separator, true);
}

// build regex which exclude letter/number/separator after the end
function buildRegexExcludeFollowed(separator: string): string {
	return buildRegexExclude(separator, false);
}

// build regex query with all cases selected
function buildRegexQuery(query: string, selectedCaseFunctions: readonly any[], message: any): string {
	const queries: string[] = [];
	for (const caseFunctionData of selectedCaseFunctions) {
		const caseFunction = caseFunctionData[0];
		let queryScope = caseFunction(query) || query;

		const separator: string = caseFunctionData[1];
		if (message.beginWord) {
			queryScope = buildRegexExcludePreceded(separator) + queryScope;
		}
		if (message.endWord) {
			queryScope = queryScope + buildRegexExcludeFollowed(separator);
		}

		queries.push(queryScope);
	}
  
	return removeDuplicates(queries).join("|");
}

// build regex query without any case selected
// also returns matchWholeWord for the vscode command workbench.action.findInFiles
function buildRegexQueryNoCaseSelected(query: string, message: any): [string, boolean] {
	if (message.beginWord && message.endWord) {
		// Managed by matchWholeWord
		return [query, true];
	}

	if (message.beginWord) {
		query = "\\b" + query;
	}
	if (message.endWord) {
		query = query + "\\b";
	}

	return [query, false];
}

/**
 * Construct a copy of an array with duplicate items removed.
 * Where duplicate items exist, only the first instance will be kept.
 */
function removeDuplicates<T>(array: T[]): T[] {
	return [...new Set(array)];
}

const mmi = new SrcMmi();

// build regex query with all cases selected
// also returns matchWholeWord for the vscode command workbench.action.findInFiles
function messageToRegexQuery(message: any): [string, boolean] {
	const selectedCaseFunctions: any[] = mmi.caseManager.srcGetSelectedCaseFunctions(message);

	if (selectedCaseFunctions.length <= 0) {
		return buildRegexQueryNoCaseSelected(message.text, message);
	}

	return [buildRegexQuery(message.text, selectedCaseFunctions, message), false];
}

// Read string from context.workspaceState
function readString(context: ExtensionContext, name: string): string {
	const value = context.workspaceState.get<string>(name, "");
	// console.log(`readString ${name}=${value}`);
	return value;
}

// Read boolean from context.workspaceState
// If not found use defaultValue
function readBoolean(context: ExtensionContext, name: string, defaultValue: boolean = false): boolean {
	const value = context.workspaceState.get<boolean>(name, defaultValue);
	// console.log(`readCheckbox ${name}=${checked}`);
	return value;
}

// Read boolean from context.workspaceState
// If not found use defaultValue
// Returns "checked" if true, "" otherwise
function readCheckbox(context: ExtensionContext, name: string, defaultValue: boolean = false): string {
	const value = readBoolean(context, name, defaultValue);
	const checked = value ? "checked" : "";
	// console.log(`readCheckbox ${name}=${checked}`);
	return checked;
}

  
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('case-incremental-search.start', () => {
			CaseSearchPanel.createOrShow(context);
		})
	);

	if (vscode.window.registerWebviewPanelSerializer) {
		// Make sure we register a serializer in activation event
		vscode.window.registerWebviewPanelSerializer(CaseSearchPanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
				console.log(`Got state: ${state}`);
				// Reset the webview options so we use latest uri for `localResourceRoots`.
				webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
				CaseSearchPanel.revive(webviewPanel, context);
			}
		});
	}
}

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
	return {
		// Enable javascript in the webview
		enableScripts: true,

		// And restrict the webview to only loading content from our extension's `media` directory.
		localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media'),
			                 vscode.Uri.joinPath(extensionUri, 'node_modules', '@vscode/codicons', 'dist')
		]
	};
}

/**
 * Manages case search webview panels
 */
class CaseSearchPanel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static currentPanel: CaseSearchPanel | undefined;

	public static readonly viewType = 'caseSearch';

	private _context: ExtensionContext;
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(context: ExtensionContext) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (CaseSearchPanel.currentPanel) {
			CaseSearchPanel.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			CaseSearchPanel.viewType,
			'Case Search',
			column || vscode.ViewColumn.One,
			getWebviewOptions(context.extensionUri),
		);

		CaseSearchPanel.currentPanel = new CaseSearchPanel(panel, context);
	}

	public static revive(panel: vscode.WebviewPanel, context: ExtensionContext) {
		CaseSearchPanel.currentPanel = new CaseSearchPanel(panel, context);
	}

	private constructor(panel: vscode.WebviewPanel, context: ExtensionContext) {
		this._panel = panel;
		this._context = context;
		this._extensionUri = context.extensionUri;

		{
			const keys = this._context.workspaceState.keys();
			console.log(keys);
			// for (const key of keys) {
			// 	this._context.workspaceState.update(key, undefined);
			// }
		}

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			_e => {
				if (this._panel.visible) {
					this._update();
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			message => {
				if ('manager' in message) {
					console.log(`manager message ${message.command} received`);
					console.log(message);
					mmi.srcManageManagerMessage(message, this._context);
					return;
				}

				switch (message.command) {
					case 'main-instant':
						console.log(`${message.command} received`, message.text);
						this._saveMainStatus(this._context, message);
						const [query, matchWholeWord] = messageToRegexQuery(message);
						vscode.commands.executeCommand("workbench.action.findInFiles", {
							query: query,
							triggerSearch: true,
							isRegex: true,
							isCaseSensitive: message.sensitiveCase,
							matchWholeWord: matchWholeWord,
						});
						break;

					default:
						console.log(`${message.command} ??? received`, message);
						return;
				}
				if (message.command === 'main-instant') {
					// Set the focus back to the input
					this._panel.webview.postMessage({ command: 'focus' });
				}
			},
			null,
			this._disposables
		);
	}

	// Save status into context.workspaceState
	private _saveMainStatus(context: ExtensionContext, message: any) {
		context.workspaceState.update("sensitiveCase",     message.sensitiveCase);
		context.workspaceState.update("text",              message.text);

		mmi.srcFromMainMessage(message, context);
	}

	public dispose() {
		CaseSearchPanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _update() {
		const webview = this._panel.webview;
		this._panel.title = "Case Search";
		this._panel.webview.html = this._getHtmlForWebview(webview);
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Local path to media directory in the webview
		const mediaPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media');

		// Uri to load scripts in the webview
		const scriptUri         = webview.asWebviewUri(vscode.Uri.joinPath(mediaPathOnDisk, 'main.js'));
		const scriptMmiMediaUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaPathOnDisk, 'mmi_media.js'));
		const scriptExportsUri  = webview.asWebviewUri(vscode.Uri.joinPath(mediaPathOnDisk, 'exports.js'));

		// Uri to load styles into webview
		const stylesResetUri     = webview.asWebviewUri(vscode.Uri.joinPath(mediaPathOnDisk, 'reset.css'));
		const stylesMainUri      = webview.asWebviewUri(vscode.Uri.joinPath(mediaPathOnDisk, 'vscode.css'));
		const stylesStylesUri    = webview.asWebviewUri(vscode.Uri.joinPath(mediaPathOnDisk, 'styles.css'));
		const stylesDraggableUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaPathOnDisk, 'draggable.css'));
		const codiconsUri        = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css'));

		// Use a nonce to only allow specific scripts to be run
		const nonce = getNonce();

		const context = this._context;
		mmi.srcInit(context);

		const wordHtml = mmi.wordManager.srcGetHtml();
		const caseHtml = mmi.caseManager.srcGetHtml();
		const filesToIncludeHtml = mmi.filesToIncludeManager.srcGetHtml();
		const filesToExcludeHtml = mmi.filesToExcludeManager.srcGetHtml();

		const sensitiveCaseState = readCheckbox(context, "sensitiveCase",     true);
		const text               = readString(  context, "text");

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource}; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${stylesResetUri}"     rel="stylesheet">
				<link href="${stylesMainUri}"      rel="stylesheet">
				<link href="${stylesStylesUri}"    rel="stylesheet">
				<link href="${stylesDraggableUri}" rel="stylesheet">
				<link href="${codiconsUri}"        rel="stylesheet">

				<title>Case Search</title>
			</head>
			<body>
				<div>
					<div class="container">
						<div class="left">
							<fieldset id="cases">
								<legend>Cases to search for</legend>
								${caseHtml}
							</fieldset>
						</div>
						<div class="right">
							<fieldset id="options">
								<legend>Search</legend>
								<input id="text-to-search" type="text" placeholder="Text to search" value="${text}"></input>
								<div><input type="checkbox" ${sensitiveCaseState} id="sensitive-case" /> <label for="sensitive-case">Sensitive case</label></div>
								${wordHtml}
							</fieldset>
						</div>
					</div>
				</div>

				<div class="container">
					<div>
						<fieldset>
							<legend>Files to include</legend>
							${filesToIncludeHtml}
						</fieldset>
					</div>
					<div>
						<fieldset>
							<legend>Files to exclude</legend>
							${filesToExcludeHtml}
						</fieldset>
					</div>
				</div>

				<script nonce="${nonce}" src="${scriptExportsUri}"></script>
				<script nonce="${nonce}" src="${scriptMmiMediaUri}"></script>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

// Exports for test only
export const exportedForTesting = {
	buildRegexExcludePreceded, buildRegexExcludeFollowed,
	buildRegexQuery, buildRegexQueryNoCaseSelected,
	messageToRegexQuery,
};
