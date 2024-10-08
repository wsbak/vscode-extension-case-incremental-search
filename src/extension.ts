import * as vscode from 'vscode';
import type { ExtensionContext } from "vscode";
import { paramCase, pascalCase, constantCase, snakeCase, camelCase, capitalCase, pathCase } from "change-case";


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

// Convert function with their separator
const paramCaseData:    any[] = [paramCase,    "-"];
const camelCaseData:    any[] = [camelCase,    ""];
const pascalCaseData:   any[] = [pascalCase,   ""];
const snakeCaseData:    any[] = [snakeCase,    "_"];
const constantCaseData: any[] = [constantCase, "_"];
const capitalCaseData:  any[] = [capitalCase,  " "];
const pathCaseData:     any[] = [pathCase,     "/"];

const convertFunctions: any = [
	paramCaseData,
	camelCaseData,
	pascalCaseData,
	snakeCaseData,
	constantCaseData,
	capitalCaseData,
	pathCaseData,
];

// build regex query with all cases selected
// also returns matchWholeWord for the vscode command workbench.action.findInFiles
function messageToRegexQuery(message: any): [string, boolean] {
	let selectedCaseFunctions: any[] = [];
	if (message.kebabCase)      { selectedCaseFunctions.push(paramCaseData); }
	if (message.camelCase)      { selectedCaseFunctions.push(camelCaseData); }
	if (message.pascalCase)     { selectedCaseFunctions.push(pascalCaseData); }
	if (message.snakeCase)      { selectedCaseFunctions.push(snakeCaseData); }
	if (message.upperSnakeCase) { selectedCaseFunctions.push(constantCaseData); }
	if (message.capitalCase)    { selectedCaseFunctions.push(capitalCaseData); }
	if (message.pathCase)       { selectedCaseFunctions.push(pathCaseData); }

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

// Save status into context.workspaceState
function saveStatus(context: ExtensionContext, message: any) {
	context.workspaceState.update("sensitiveCase",     message.sensitiveCase);
	context.workspaceState.update("beginWord",         message.beginWord);
	context.workspaceState.update("endWord",           message.endWord);
	context.workspaceState.update("text",              message.text);

	context.workspaceState.update("kebabCase",         message.kebabCase);
	context.workspaceState.update("camelCase",         message.camelCase);
	context.workspaceState.update("pascalCase",        message.pascalCase);
	context.workspaceState.update("snakeCase",         message.snakeCase);
	context.workspaceState.update("upperSnakeCase",    message.upperSnakeCase);
	context.workspaceState.update("capitalCase",       message.capitalCase);
	context.workspaceState.update("pathCase",          message.pathCase);
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
		localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
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
				switch (message.command) {
					case 'saveStatus':
						console.log("saveStatus received");
						saveStatus(this._context, message);
						return;
					case 'text-to-search': {
						console.log("text-to-search received", message.text);
						const [query, matchWholeWord] = messageToRegexQuery(message);
						vscode.commands.executeCommand("workbench.action.findInFiles", {
							query: query,
							triggerSearch: true,
							isRegex: true,
							isCaseSensitive: message.sensitiveCase,
							matchWholeWord: matchWholeWord,
						});
						saveStatus(this._context, message);

						// Set the focus back to the input
						this._panel.webview.postMessage({ command: 'focus' });
						return;
					}
				}
			},
			null,
			this._disposables
		);
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

		// Uri to load main script in the webview
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaPathOnDisk, 'main.js'));

		// Uri to load styles into webview
		const stylesResetUri  = webview.asWebviewUri(vscode.Uri.joinPath(mediaPathOnDisk, 'reset.css'));
		const stylesMainUri   = webview.asWebviewUri(vscode.Uri.joinPath(mediaPathOnDisk, 'vscode.css'));
		const stylesStylesUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaPathOnDisk, 'styles.css'));

		// Use a nonce to only allow specific scripts to be run
		const nonce = getNonce();

		const context = this._context;

		const sensitiveCaseState     = readCheckbox(context, "sensitiveCase",     true);
		const beginWordState         = readCheckbox(context, "beginWord");
		const endWordState           = readCheckbox(context, "endWord");
		// wholeWordState computed by main.js
		const text                   = readString(  context, "text");
		const kebabCaseState         = readCheckbox(context, "kebabCase",      true);
		const camelCaseState         = readCheckbox(context, "camelCase",      true);
		const pascalCaseState        = readCheckbox(context, "pascalCase",     true);
		const snakeCaseState         = readCheckbox(context, "snakeCase",      true);
		const upperSnakeCaseState    = readCheckbox(context, "upperSnakeCase", true);
		const capitalCaseState       = readCheckbox(context, "capitalCase",    true);
		const pathCaseState          = readCheckbox(context, "pathCase",       true);
		// allCasesState computed by main.js

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${stylesResetUri}"  rel="stylesheet">
				<link href="${stylesMainUri}"   rel="stylesheet">
				<link href="${stylesStylesUri}" rel="stylesheet">

				<title>Case Search</title>
			</head>
			<body>
				<fieldset id="cases">
					<legend>Cases to search for</legend>
					<div><input type="checkbox"                                            id="all-cases"        /> <label for="all-case"        >All</label></div>
					<div><input type="checkbox" class="subCheckbox" ${kebabCaseState}      id="kebab-case"       /> <label for="kebab-case"      >kebab-case</label></div>
					<div><input type="checkbox" class="subCheckbox" ${camelCaseState}      id="camel-case"       /> <label for="camel-case"      >camelCase</label></div>
					<div><input type="checkbox" class="subCheckbox" ${pascalCaseState}     id="pascal-case"      /> <label for="pascal-case"     >PascalCase</label></div>
					<div><input type="checkbox" class="subCheckbox" ${snakeCaseState}      id="snake-case"       /> <label for="snake-case"      >snake_case</label></div>
					<div><input type="checkbox" class="subCheckbox" ${upperSnakeCaseState} id="upper-snake-case" /> <label for="upper-snake-case">UPPER_SNAKE_CASE</label></div>
					<div><input type="checkbox" class="subCheckbox" ${capitalCaseState}    id="capital-case"     /> <label for="capital-case"    >Capital Case</label></div>
					<div><input type="checkbox" class="subCheckbox" ${pathCaseState}       id="path-case"        /> <label for="path-case"       >path/case</label></div>
				</fieldset>
				<fieldset id="options">
					<legend>Search</legend>
					<input id="text-to-search" type="text" placeholder="Text to search" value="${text}"></input>
					<div><input type="checkbox" ${sensitiveCaseState} id="sensitive-case" /> <label for="sensitive-case">Sensitive case</label></div>
					<div><input type="checkbox"                       id="whole-word"                          /> <label for="whole-word">Whole word</label></div>
					<div><input type="checkbox" ${beginWordState}     id="begin-word"      class="subCheckbox" /> <label for="begin-word">Begin word</label></div>
					<div><input type="checkbox" ${endWordState}       id="end-word"        class="subCheckbox" /> <label for="end-word">End word</label></div>
				</fieldset>

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
	paramCaseData, pascalCaseData, constantCaseData, snakeCaseData, camelCaseData, capitalCaseData, pathCaseData,
	buildRegexQuery, buildRegexQueryNoCaseSelected,
	messageToRegexQuery,
};
