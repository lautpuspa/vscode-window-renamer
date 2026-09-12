# VS Code Window Renamer

Rename the current VS Code window without changing its color, theme, or layout.

Open **Window Renamer** in the Activity Bar and click **Rename Window**. The
extension opens VS Code's native input box and saves the name to the active
workspace only.

The default keyboard shortcut is `Ctrl+Alt+R` (`Cmd+Alt+R` on macOS). Change it
from **Global Settings → Rename Window Shortcut** in the sidebar, or through
**Preferences: Open Keyboard Shortcuts**.

## Limitation

VS Code stores window titles with workspace settings. Open a folder or a
`.code-workspace` file before naming a window, so the name stays isolated to
that window.
