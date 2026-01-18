import * as vscode from 'vscode';
import { TranslationFileManager, TranslationStatistics } from './services/translation-file-manager';

/**
 * Webview panel for the TypeGlot translation dashboard
 * Provides an overview of translation status and management tools
 */
export class DashboardPanel {
  public static currentPanel: DashboardPanel | undefined;
  private static readonly viewType = 'typeglotDashboard';

  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private translationFileManager: TranslationFileManager | undefined;
  private disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this.panel = panel;
    this.extensionUri = extensionUri;

    // Handle panel disposal
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        await this.handleMessage(message);
      },
      null,
      this.disposables
    );

    // Set initial content
    this.updateContent();
  }

  /**
   * Create or show the dashboard panel
   */
  public static createOrShow(
    extensionUri: vscode.Uri,
    translationFileManager?: TranslationFileManager
  ): DashboardPanel {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (DashboardPanel.currentPanel) {
      DashboardPanel.currentPanel.panel.reveal(column);
      if (translationFileManager) {
        DashboardPanel.currentPanel.setTranslationFileManager(translationFileManager);
      }
      return DashboardPanel.currentPanel;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      DashboardPanel.viewType,
      'TypeGlot Dashboard',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
      }
    );

    DashboardPanel.currentPanel = new DashboardPanel(panel, extensionUri);

    if (translationFileManager) {
      DashboardPanel.currentPanel.setTranslationFileManager(translationFileManager);
    }

    return DashboardPanel.currentPanel;
  }

  /**
   * Set the translation file manager and update content
   */
  public setTranslationFileManager(manager: TranslationFileManager): void {
    this.translationFileManager = manager;

    // Update when translations change
    manager.onChange(() => {
      this.updateContent();
    });

    this.updateContent();
  }

  /**
   * Handle messages from the webview
   */
  private async handleMessage(message: { command: string; [key: string]: unknown }): Promise<void> {
    switch (message.command) {
      case 'refresh':
        await this.translationFileManager?.loadAllTranslations();
        this.updateContent();
        break;

      case 'translateKey':
        await vscode.commands.executeCommand(
          'typeglot.translateKey',
          message.key as string,
          message.locales as string[]
        );
        break;

      case 'translateAllMissing':
        await vscode.commands.executeCommand('typeglot.translateAllMissing');
        break;

      case 'openFile':
        const locale = message.locale as string;
        if (this.translationFileManager) {
          const filePath = this.translationFileManager.getLocalePath(locale);
          const doc = await vscode.workspace.openTextDocument(filePath);
          await vscode.window.showTextDocument(doc);
        }
        break;

      case 'copyKey':
        await vscode.env.clipboard.writeText(message.key as string);
        vscode.window.showInformationMessage(`Copied "${message.key}" to clipboard`);
        break;
    }
  }

  /**
   * Update the webview content
   */
  private updateContent(): void {
    const stats = this.translationFileManager?.getStatistics();
    const missingKeys = this.translationFileManager?.getMissingKeys(stats?.sourceLocale ?? 'en');

    this.panel.webview.html = this.getHtmlContent(stats, missingKeys);
  }

  /**
   * Generate the HTML content for the webview
   */
  private getHtmlContent(
    stats?: TranslationStatistics,
    missingKeys?: Map<string, string[]>
  ): string {
    const nonce = this.getNonce();

    // Build locale cards
    let localeCards = '';
    if (stats) {
      for (const [locale, data] of Object.entries(stats.locales)) {
        const percentage =
          stats.totalKeys > 0 ? Math.round((data.translated / stats.totalKeys) * 100) : 0;

        const progressColor =
          percentage === 100
            ? 'var(--vscode-testing-iconPassed)'
            : percentage > 50
              ? 'var(--vscode-notificationsWarningIcon-foreground)'
              : 'var(--vscode-testing-iconFailed)';

        localeCards += `
          <div class="locale-card" onclick="openFile('${locale}')">
            <div class="locale-header">
              <span class="locale-name">${locale.toUpperCase()}</span>
              <span class="locale-percentage" style="color: ${progressColor}">${percentage}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${percentage}%; background: ${progressColor}"></div>
            </div>
            <div class="locale-stats">
              <span class="stat-item">✓ ${data.translated} translated</span>
              <span class="stat-item ${data.missing > 0 ? 'missing' : ''}">⚠ ${data.missing} missing</span>
            </div>
          </div>
        `;
      }
    }

    // Build missing keys table
    let missingKeysHtml = '';
    if (missingKeys && missingKeys.size > 0) {
      const rows = Array.from(missingKeys.entries())
        .slice(0, 50) // Limit to first 50 for performance
        .map(
          ([key, locales]) => `
          <tr>
            <td class="key-cell">
              <code>${key}</code>
              <button class="icon-btn" onclick="copyKey('${key}')" title="Copy key">📋</button>
            </td>
            <td class="locales-cell">${locales.map((l) => `<span class="locale-badge">${l}</span>`).join(' ')}</td>
            <td class="action-cell">
              <button class="action-btn" onclick="translateKey('${key}', ${JSON.stringify(locales)})">
                🤖 Translate
              </button>
            </td>
          </tr>
        `
        )
        .join('');

      missingKeysHtml = `
        <table class="missing-keys-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Missing in</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        ${missingKeys.size > 50 ? `<p class="more-items">... and ${missingKeys.size - 50} more</p>` : ''}
      `;
    } else {
      missingKeysHtml = `
        <div class="empty-state">
          <span class="empty-icon">✅</span>
          <p>All translations are complete!</p>
        </div>
      `;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
  <title>TypeGlot Dashboard</title>
  <style nonce="${nonce}">
    * {
      box-sizing: border-box;
    }
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      padding: 20px;
      margin: 0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--vscode-widget-border);
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header-actions {
      display: flex;
      gap: 8px;
    }
    .btn {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    }
    .btn:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .btn-secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .summary-card {
      background: var(--vscode-editor-inactiveSelectionBackground);
      padding: 16px;
      border-radius: 8px;
      text-align: center;
    }
    .summary-value {
      font-size: 32px;
      font-weight: 700;
      color: var(--vscode-textLink-foreground);
    }
    .summary-label {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-top: 4px;
    }
    .section {
      margin-bottom: 32px;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
    }
    .locale-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }
    .locale-card {
      background: var(--vscode-editor-inactiveSelectionBackground);
      padding: 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.1s, box-shadow 0.1s;
    }
    .locale-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .locale-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .locale-name {
      font-weight: 600;
      font-size: 18px;
    }
    .locale-percentage {
      font-weight: 700;
      font-size: 14px;
    }
    .progress-bar {
      height: 6px;
      background: var(--vscode-progressBar-background);
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 12px;
    }
    .progress-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s;
    }
    .locale-stats {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }
    .stat-item.missing {
      color: var(--vscode-notificationsWarningIcon-foreground);
    }
    .missing-keys-table {
      width: 100%;
      border-collapse: collapse;
    }
    .missing-keys-table th,
    .missing-keys-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid var(--vscode-widget-border);
    }
    .missing-keys-table th {
      font-weight: 600;
      background: var(--vscode-editor-inactiveSelectionBackground);
    }
    .key-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .key-cell code {
      background: var(--vscode-textCodeBlock-background);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: var(--vscode-editor-font-family);
    }
    .icon-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      opacity: 0.6;
      padding: 4px;
    }
    .icon-btn:hover {
      opacity: 1;
    }
    .locale-badge {
      display: inline-block;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      margin-right: 4px;
    }
    .action-btn {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .action-btn:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    .empty-state {
      text-align: center;
      padding: 48px;
      color: var(--vscode-descriptionForeground);
    }
    .empty-icon {
      font-size: 48px;
      display: block;
      margin-bottom: 16px;
    }
    .more-items {
      text-align: center;
      color: var(--vscode-descriptionForeground);
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🌍 TypeGlot Dashboard</h1>
    <div class="header-actions">
      <button class="btn btn-secondary" onclick="refresh()">🔄 Refresh</button>
      ${missingKeys && missingKeys.size > 0 ? `<button class="btn" onclick="translateAllMissing()">🤖 Translate All Missing</button>` : ''}
    </div>
  </div>

  <div class="summary">
    <div class="summary-card">
      <div class="summary-value">${stats?.totalKeys ?? 0}</div>
      <div class="summary-label">Total Keys</div>
    </div>
    <div class="summary-card">
      <div class="summary-value">${Object.keys(stats?.locales ?? {}).length + 1}</div>
      <div class="summary-label">Languages</div>
    </div>
    <div class="summary-card">
      <div class="summary-value">${missingKeys?.size ?? 0}</div>
      <div class="summary-label">Missing Translations</div>
    </div>
  </div>

  <div class="section">
    <div class="section-header">
      <h2 class="section-title">Translation Progress</h2>
    </div>
    <div class="locale-grid">
      ${localeCards || '<p>No translation files found</p>'}
    </div>
  </div>

  <div class="section">
    <div class="section-header">
      <h2 class="section-title">Missing Translations</h2>
    </div>
    ${missingKeysHtml}
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    function refresh() {
      vscode.postMessage({ command: 'refresh' });
    }

    function translateKey(key, locales) {
      vscode.postMessage({ command: 'translateKey', key, locales });
    }

    function translateAllMissing() {
      vscode.postMessage({ command: 'translateAllMissing' });
    }

    function openFile(locale) {
      vscode.postMessage({ command: 'openFile', locale });
    }

    function copyKey(key) {
      vscode.postMessage({ command: 'copyKey', key });
    }
  </script>
</body>
</html>`;
  }

  /**
   * Generate a random nonce for CSP
   */
  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  /**
   * Dispose of the panel
   */
  public dispose(): void {
    DashboardPanel.currentPanel = undefined;

    this.panel.dispose();

    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}
