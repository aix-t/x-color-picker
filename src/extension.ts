import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const provider = new ColorsViewProvider(context.extensionUri);

  //订阅创建的 ColorsViewProvider
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ColorsViewProvider.viewType, provider)
  );
  //订阅clear命令的回调
  context.subscriptions.push(
    vscode.commands.registerCommand('x-color-picker.views.list.clear', () => {
      provider.clearColors();
    })
  );
}

class ColorsViewProvider implements vscode.WebviewViewProvider {

  public static readonly viewType = 'x-color-picker.views.list';
  private _view?: vscode.WebviewView;
  constructor(private readonly _extensionUri: vscode.Uri) {}
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(data => {
      switch (data.type) {
        case 'colorSelected': {
          vscode.window.showInformationMessage('已复制到剪贴板');
          vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`${data.value}`));
          break;
        }
      }
    });
  }

  public clearColors() {
    if (this._view) {
      this._view.webview.postMessage({ type: 'clearColors' });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // 获取在webview中运行的主脚本的本地路径，然后将其转换为我们可以在 webview 中使用的 uri。
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
    );
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css')
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css')
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css')
    );

    // 使用 nonce 仅允许运行特定脚本。
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">
				<title>X Color Picker</title>
			</head>
			<body>
			  <div class="picker">
			    <label class="pick-label">Pick: </label>
			    <input type="color" id="colorPicker" autocomplete />
			  </div>
			  <ul class="color-list">
			  </ul>
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
