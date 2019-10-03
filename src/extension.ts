'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { PickList } from './PickLIst';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	PickList.autoUpdateBackground();
	let randomCommand = vscode.commands.registerCommand('extension.backgroundCover.refresh', () => { PickList.randomUpdateBackground(); });
	let startCommand = vscode.commands.registerCommand('extension.backgroundCover.start', () => { PickList.createItemLIst() });
	context.subscriptions.push(startCommand);
	context.subscriptions.push(randomCommand);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
