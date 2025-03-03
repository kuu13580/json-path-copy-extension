import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
// import * as myExtension from '../../extension';

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Copy JSON Path Test", async () => {
    const uri = vscode.Uri.file(__dirname + "/dummy.json");
    const document = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(document);

    // カーソルを特定の位置に移動
    const position = new vscode.Position(5, 10); // "name": "TechCorp" の "name" の位置
    editor.selection = new vscode.Selection(position, position);

    // コマンドを実行
    await vscode.commands.executeCommand("json-path-copy.copyPath");

    // クリップボードの内容を取得
    const clipboardText = await vscode.env.clipboard.readText();

    // 期待されるJSONパス
    const expectedPath = "organization.name";

    // アサーション
    assert.strictEqual(clipboardText, expectedPath);
  });
});
