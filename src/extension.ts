import * as vscode from 'vscode';

const renameCommand = 'windowRenamer.renameWindow';
const configureShortcutCommand = 'windowRenamer.configureShortcut';

type WindowRenamerNode = 'rename' | 'globalSettings' | 'shortcut';

class RenameWindowProvider implements vscode.TreeDataProvider<WindowRenamerNode> {
    private readonly iconUri: vscode.Uri;

    constructor(context: vscode.ExtensionContext) {
        this.iconUri = vscode.Uri.joinPath(context.extensionUri, 'media', 'rename.svg');
    }

    getTreeItem(element: WindowRenamerNode): vscode.TreeItem {
        if (element === 'globalSettings') {
            const item = new vscode.TreeItem('Global Settings', vscode.TreeItemCollapsibleState.Expanded);
            item.iconPath = new vscode.ThemeIcon('settings-gear');
            return item;
        }

        if (element === 'shortcut') {
            const item = new vscode.TreeItem('Rename Window Shortcut', vscode.TreeItemCollapsibleState.None);
            item.description = process.platform === 'darwin' ? '⌘⌥R' : 'Ctrl+Alt+R';
            item.tooltip = 'Click to customize the keyboard shortcut for Rename Window';
            item.iconPath = new vscode.ThemeIcon('keyboard');
            item.command = { command: configureShortcutCommand, title: 'Configure Rename Window Shortcut' };
            return item;
        }

        const item = new vscode.TreeItem('Rename Window', vscode.TreeItemCollapsibleState.None);
        item.command = { command: renameCommand, title: 'Rename Window' };
        item.iconPath = this.iconUri;
        item.tooltip = 'Rename the active VS Code window';

        if (vscode.workspace.getConfiguration('windowRenamer').get<boolean>('showShortcutHint', true)) {
            item.description = process.platform === 'darwin' ? '⌘⌥R' : 'Ctrl+Alt+R';
            item.tooltip = `Rename the active VS Code window (${item.description})`;
        }

        return item;
    }

    getChildren(element?: WindowRenamerNode): WindowRenamerNode[] {
        if (element === 'globalSettings') return ['shortcut'];
        if (element) return [];
        return ['rename', 'globalSettings'];
    }
}

export function activate(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('windowRenamer.actions', new RenameWindowProvider(context)),
        vscode.commands.registerCommand(renameCommand, renameActiveWindow),
        vscode.commands.registerCommand(configureShortcutCommand, () =>
            vscode.commands.executeCommand(
                'workbench.action.openGlobalKeybindings',
                '@command:windowRenamer.renameWindow'
            )
        )
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
