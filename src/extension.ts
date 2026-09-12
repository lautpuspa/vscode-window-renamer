import * as vscode from 'vscode';

const renameCommand = 'windowRenamer.renameWindow';

class RenameWindowProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private readonly changeEmitter = new vscode.EventEmitter<void>();
    readonly onDidChangeTreeData = this.changeEmitter.event;

    constructor(context: vscode.ExtensionContext) {
        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(event => {
                if (event.affectsConfiguration('windowRenamer.showShortcutHint')) {
                    this.changeEmitter.fire();
                }
            })
        );
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(): vscode.TreeItem[] {
        const item = new vscode.TreeItem('Rename Window', vscode.TreeItemCollapsibleState.None);
        item.command = { command: renameCommand, title: 'Rename Window' };
        item.iconPath = new vscode.ThemeIcon('edit');
        item.tooltip = 'Rename the active VS Code window';

        if (vscode.workspace.getConfiguration('windowRenamer').get<boolean>('showShortcutHint', true)) {
            item.description = process.platform === 'darwin' ? '⌘⌥R' : 'Ctrl+Alt+R';
        }

        return [item];
    }
}

export function activate(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('windowRenamer.actions', new RenameWindowProvider(context)),
        vscode.commands.registerCommand(renameCommand, renameActiveWindow)
    );
}

async function renameActiveWindow(): Promise<void> {
    if (!vscode.workspace.workspaceFile && !vscode.workspace.workspaceFolders?.length) {
        void vscode.window.showWarningMessage('Open a folder or workspace before naming this window.');
        return;
    }

    const titleConfiguration = vscode.workspace.getConfiguration('window');
    const currentTitle = titleConfiguration.get<string>('title') ?? '';
    const name = await vscode.window.showInputBox({
        prompt: 'Name this VS Code window',
        placeHolder: 'For example: API, Client, or Production',
        value: currentTitle
    });

    if (name === undefined) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
        void vscode.window.showWarningMessage('Window name cannot be empty.');
        return;
    }

    await titleConfiguration.update('title', trimmedName, vscode.ConfigurationTarget.Workspace);
}
