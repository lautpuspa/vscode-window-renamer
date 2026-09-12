import * as vscode from 'vscode';

const renameCommand = 'windowRenamer.renameWindow';
const toggleShortcutCommand = 'windowRenamer.toggleShortcutHint';

type WindowRenamerNode = 'rename' | 'globalSettings' | 'showShortcutHint';

class RenameWindowProvider implements vscode.TreeDataProvider<WindowRenamerNode> {
    private readonly changeEmitter = new vscode.EventEmitter<void>();
    private readonly iconUri: vscode.Uri;
    readonly onDidChangeTreeData = this.changeEmitter.event;

    constructor(context: vscode.ExtensionContext) {
        this.iconUri = vscode.Uri.joinPath(context.extensionUri, 'media', 'rename.svg');
        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(event => {
                if (event.affectsConfiguration('windowRenamer.showShortcutHint')) {
                    this.changeEmitter.fire();
                }
            })
        );
    }

    getTreeItem(element: WindowRenamerNode): vscode.TreeItem {
        if (element === 'globalSettings') {
            const item = new vscode.TreeItem('Global Settings', vscode.TreeItemCollapsibleState.Expanded);
            item.iconPath = new vscode.ThemeIcon('settings-gear');
            return item;
        }

        if (element === 'showShortcutHint') {
            const enabled = vscode.workspace.getConfiguration('windowRenamer').get<boolean>('showShortcutHint', true);
            const item = new vscode.TreeItem('Show Shortcut Hint', vscode.TreeItemCollapsibleState.None);
            item.description = enabled ? 'On' : 'Off';
            item.tooltip = enabled
                ? 'Hide the Ctrl+Alt+R hint shown below Rename Window'
                : 'Show the Ctrl+Alt+R hint shown below Rename Window';
            item.iconPath = new vscode.ThemeIcon(enabled ? 'eye' : 'eye-closed');
            item.command = { command: toggleShortcutCommand, title: 'Toggle Shortcut Hint' };
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
        if (element === 'globalSettings') return ['showShortcutHint'];
        if (element) return [];
        return ['rename', 'globalSettings'];
    }
}

export function activate(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('windowRenamer.actions', new RenameWindowProvider(context)),
        vscode.commands.registerCommand(renameCommand, renameActiveWindow),
        vscode.commands.registerCommand(toggleShortcutCommand, async () => {
            const configuration = vscode.workspace.getConfiguration('windowRenamer');
            const current = configuration.get<boolean>('showShortcutHint', true);
            await configuration.update('showShortcutHint', !current, vscode.ConfigurationTarget.Global);
        })
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
