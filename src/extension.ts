import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "json-path-copy.copyPath",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor found");
        return;
      }

      const document = editor.document;
      if (document.languageId !== "json") {
        vscode.window.showErrorMessage("Active editor is not a JSON file");
        return;
      }

      const selection = editor.selection;
      const cursorPosition = selection.active;
      const path = getJsonPath(document, cursorPosition);

      if (path) {
        vscode.env.clipboard.writeText(path);
        vscode.window.showInformationMessage(`Copied JSON path: ${path}`);
      } else {
        vscode.window.showErrorMessage(
          "Unable to determine JSON path at cursor position."
        );
      }
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function getJsonPath(
  document: vscode.TextDocument,
  position: vscode.Position
): string | null {
  const text = document.getText();
  const offset = document.offsetAt(position);
  const path: string[] = [];

  let inString = false;
  // inStringがtrueの場合、stringStartには文字列の開始位置が格納される
  let stringStart = -1;
  // 現在のキー(value, array上で存在)
  let currentKey = "";
  // 現在の配列のインデックス(array上で-1以外の値を持つ)
  let arrayIndex = -1;

  for (let i = 0; i <= offset; i++) {
    const char = text[i];

    if (char === " " || char === "\t" || char === "\n" || char === "\r") {
      continue;
    }

    if (char === '"' && (i === 0 || text[i - 1] !== "\\")) {
      if (inString) {
        // key or valueの終わり
        inString = false;
        if (stringStart !== -1) {
          if (currentKey) {
            // valueの終わり
          } else {
            // keyの終わり
            currentKey = text.substring(stringStart, i);
          }
        }
      } else {
        // key or valueの開始
        inString = true;
        stringStart = i + 1;
      }
    } else if (!inString) {
      if (char === "{") {
        // 新たなオブジェクトの開始
        if (currentKey) {
          path.push(currentKey);
          currentKey = "";
        }
      } else if (char === "}") {
        // オブジェクトの終了
        path.pop();
      } else if (char === "[") {
        arrayIndex = 0;
        if (currentKey) {
          path.push(currentKey);
          currentKey = "";
        }
      } else if (char === "]") {
        arrayIndex = -1;
        path.pop();
      } else if (char === ",") {
        if (arrayIndex > -1 && !currentKey) {
          // 純粋な配列の場合
          arrayIndex++;
        } else {
          currentKey = "";
        }
      } else if (char === ":") {
        console.log("colon");
      }
    }
  }

  // 現在のキーまたはインデックスをパスに追加
  if (arrayIndex > -1) {
    path.push(arrayIndex.toString());
  }
  if (currentKey) {
    // value上にカーソルがある場合
    path.push(currentKey);
  } else if (inString && !currentKey) {
    // key上にカーソルがある場合、次の'"'までをkeyとして扱う
    const keyEnd = text.indexOf('"', stringStart);
    if (keyEnd > -1) {
      currentKey = text.substring(stringStart, keyEnd);
      path.push(currentKey);
    }
  }

  return path.join(".");
}
