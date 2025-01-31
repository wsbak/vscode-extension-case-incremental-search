import * as vscode from 'vscode';
import type { ExtensionContext } from "vscode";
import { SrcMmi } from "./mmi_src";


export function activate(context: vscode.ExtensionContext): void {
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
	public static currentPanel: CaseSearchPanel | null;

	public static readonly viewType = 'caseSearch';

	private _context: ExtensionContext;
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private readonly _disposables: vscode.Disposable[] = [];
	private readonly _mmi = new SrcMmi();

	public static createOrShow(context: ExtensionContext): void {
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

	public static revive(panel: vscode.WebviewPanel, context: ExtensionContext): void {
		CaseSearchPanel.currentPanel = new CaseSearchPanel(panel, context);
	}

	private constructor(panel: vscode.WebviewPanel, context: ExtensionContext) {
		this._panel = panel;
		this._context = context;
		this._extensionUri = context.extensionUri;
		this._mmi.srcInit(this._context);

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
				this._mmi.onDidReceiveMessage(message, this._panel.webview, this._context);
			},
			null,
			this._disposables
		);
	}

	public dispose(): void {
		CaseSearchPanel.currentPanel = null;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _update(): void {
		const webview = this._panel.webview;
		this._panel.title = "Case Search";
		this._panel.webview.html = this._getHtmlForWebview(webview);
	}

	private _getHtmlForWebview(webview: vscode.Webview): string {
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

		const html = this._mmi.srcGetHtml(this._context);

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
				${html}

				<script nonce="${nonce}" src="${scriptExportsUri}"></script>
				<script nonce="${nonce}" src="${scriptMmiMediaUri}"></script>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}

function getNonce(): string {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
