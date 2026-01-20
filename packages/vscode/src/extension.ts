import * as vscode from 'vscode';
import { TranslationDecorator } from './decorations';
import { TranslationCodeActionProvider, extractJSDocFromSource } from './code-actions';
import { TranslationService, TranslationFileManager } from './services';
import { DashboardPanel } from './dashboard';
import { DiagnosticProvider } from './diagnostics';
import { loadConfig, TypeGlotConfig } from '@typeglot/core';

// Global state
let config: TypeGlotConfig | undefined;
let decorator: TranslationDecorator | undefined;
let translationService: TranslationService | undefined;
let translationFileManager: TranslationFileManager | undefined;
let diagnosticProvider: DiagnosticProvider | undefined;
let statusBarItem: vscode.StatusBarItem | undefined;

/**
 * Extension activation
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log('TypeGlot extension activating...');

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    console.log('No workspace folder found');
    return;
  }

  // Load configuration
  try {
    config = await loadConfig(workspaceFolder.uri.fsPath);
    console.log('TypeGlot config loaded:', config);
  } catch {
    console.log('No TypeGlot config found, using defaults');
    config = {
      sourceLocale: 'en',
      targetLocales: [],
      localesDir: './locales',
      outputDir: './src/generated/i18n',
      include: ['src/**/*.{ts,tsx,js,jsx}'],
      exclude: ['node_modules', 'dist'],
      interpolation: 'single',
      filePattern: '{locale}.json',
    };
  }

  // Initialize services
  translationService = new TranslationService();
  context.subscriptions.push({ dispose: () => translationService?.dispose() });

  translationFileManager = new TranslationFileManager(workspaceFolder.uri.fsPath, config);
  await translationFileManager.initialize();
  context.subscriptions.push({ dispose: () => translationFileManager?.dispose() });

  // Initialize decorator for inline previews
  const showDecorations = vscode.workspace
    .getConfiguration('typeglot')
    .get('showInlineTranslations', true);

  if (showDecorations) {
    decorator = new TranslationDecorator();
    decorator.setTranslationFileManager(translationFileManager);
    context.subscriptions.push(decorator);
  }

  // Initialize code action provider
  const codeActionProvider = new TranslationCodeActionProvider();
  codeActionProvider.setTranslationFileManager(translationFileManager, config.sourceLocale);
  if (decorator) {
    codeActionProvider.setDecorator(decorator);
  }

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      [
        { language: 'typescript' },
        { language: 'typescriptreact' },
        { language: 'javascript' },
        { language: 'javascriptreact' },
      ],
      codeActionProvider,
      {
        providedCodeActionKinds: [
          vscode.CodeActionKind.QuickFix,
          vscode.CodeActionKind.RefactorExtract,
        ],
      }
    )
  );

  // Initialize diagnostic provider for missing keys
  diagnosticProvider = new DiagnosticProvider(translationFileManager, config.sourceLocale);
  context.subscriptions.push(diagnosticProvider);

  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'typeglot.showTranslationStatus';
  context.subscriptions.push(statusBarItem);
  updateStatusBar();

  // Register all commands
  context.subscriptions.push(
    vscode.commands.registerCommand('typeglot.init', initCommand),
    vscode.commands.registerCommand('typeglot.translateKey', translateKeyCommand),
    vscode.commands.registerCommand('typeglot.translateMissingKey', translateMissingKeyCommand),
    vscode.commands.registerCommand('typeglot.openDashboard', () => openDashboardCommand(context)),
    vscode.commands.registerCommand('typeglot.refreshDecorations', refreshDecorationsCommand),
    vscode.commands.registerCommand('typeglot.goToTranslation', goToTranslationCommand),
    vscode.commands.registerCommand('typeglot.extractString', extractStringCommand),
    vscode.commands.registerCommand('typeglot.translateAllMissing', translateAllMissingCommand),
    vscode.commands.registerCommand('typeglot.showTranslationStatus', showTranslationStatusCommand)
  );

  // Set up editor event listeners
  if (decorator) {
    // Apply decorations to active editor
    if (vscode.window.activeTextEditor) {
      decorator.updateDecorations(vscode.window.activeTextEditor);
      diagnosticProvider?.updateDiagnostics(vscode.window.activeTextEditor.document);
    }

    // Update decorations when active editor changes
    context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
          decorator?.updateDecorations(editor);
          diagnosticProvider?.updateDiagnostics(editor.document);
          updateStatusBar();
        }
      })
    );

    // Update decorations when document changes
    context.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document) {
          decorator?.updateDecorations(editor);
          diagnosticProvider?.updateDiagnostics(event.document);
        }
      })
    );
  }

  // Watch for translation file changes
  translationFileManager.onChange(() => {
    updateStatusBar();
    // Refresh diagnostics for all open documents
    for (const editor of vscode.window.visibleTextEditors) {
      diagnosticProvider?.updateDiagnostics(editor.document);
    }
  });

  console.log('TypeGlot extension activated successfully');
}

/**
 * Extension deactivation
 */
export function deactivate(): void {
  console.log('TypeGlot extension deactivated');
}

/**
 * Update status bar with translation statistics
 */
function updateStatusBar(): void {
  if (!statusBarItem || !translationFileManager) return;

  const stats = translationFileManager.getStatistics();
  const missingCount = translationFileManager.getMissingKeys(stats.sourceLocale).size;

  if (missingCount > 0) {
    statusBarItem.text = `$(globe) TypeGlot: ${missingCount} missing`;
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    statusBarItem.tooltip = `${stats.totalKeys} keys, ${missingCount} missing translations\nClick to see status`;
  } else {
    statusBarItem.text = `$(globe) TypeGlot: ✓`;
    statusBarItem.backgroundColor = undefined;
    statusBarItem.tooltip = `All ${stats.totalKeys} keys translated\nClick to see status`;
  }

  statusBarItem.show();
}

// ============================================================================
// Command Implementations
// ============================================================================

/**
 * Initialize TypeGlot in the current workspace
 */
function initCommand(): void {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('Please open a workspace folder first');
    return;
  }

  const terminal = vscode.window.createTerminal('TypeGlot');
  terminal.sendText('npx typeglot init');
  terminal.show();
}

/**
 * Translate a key to specified target locales
 */
async function translateKeyCommand(key?: string, targetLocales?: string[]): Promise<void> {
  if (!translationService || !translationFileManager || !config) {
    vscode.window.showErrorMessage('TypeGlot not initialized');
    return;
  }

  // Get key from argument or prompt
  if (!key) {
    const editor = vscode.window.activeTextEditor;
    const position = editor?.selection.active;
    const wordRange = position ? editor?.document.getWordRangeAtPosition(position) : undefined;
    const word = wordRange ? editor?.document.getText(wordRange) : '';

    key = await vscode.window.showInputBox({
      prompt: 'Enter translation key to translate',
      value: word,
    });
  }

  if (!key) return;

  // Get source value
  const sourceValue = translationFileManager.getTranslation(config.sourceLocale, key);
  if (!sourceValue) {
    vscode.window.showErrorMessage(
      `Key "${key}" not found in source locale (${config.sourceLocale})`
    );
    return;
  }

  // Get target locales from argument, config, or prompt
  if (!targetLocales || targetLocales.length === 0) {
    // Find which locales are missing this key
    const missingLocales = translationFileManager.getMissingLocales(key, config.sourceLocale);

    if (missingLocales.length === 0) {
      // All locales have this key - ask which to retranslate
      const allLocales = translationFileManager
        .getLoadedLocales()
        .filter((l) => l !== config!.sourceLocale);

      if (allLocales.length === 0) {
        vscode.window.showInformationMessage('No target locales configured');
        return;
      }

      const selected = await vscode.window.showQuickPick(allLocales, {
        canPickMany: true,
        placeHolder: 'Select locales to retranslate',
      });

      targetLocales = selected;
    } else {
      targetLocales = missingLocales;
    }
  }

  if (!targetLocales || targetLocales.length === 0) return;

  // Extract JSDoc context if available
  let jsDocContext: { description?: string; context?: string } | undefined;
  const editor = vscode.window.activeTextEditor;
  if (editor && vscode.workspace.getConfiguration('typeglot').get('autoDetectContext', true)) {
    const line = editor.selection.active.line;
    jsDocContext = extractJSDocFromSource(editor.document, line);
  }

  // Perform translation with progress
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Translating "${key}" to ${targetLocales.length} locale(s)...`,
      cancellable: false,
    },
    async (progress) => {
      try {
        const translations = await translationService!.translateKey(
          key,
          sourceValue,
          config!.sourceLocale,
          targetLocales,
          jsDocContext
        );

        // Save translations to files
        for (const [locale, value] of translations) {
          progress.report({ message: `Saving ${locale}...` });
          await translationFileManager!.setTranslation(locale, key, value);
        }

        vscode.window.showInformationMessage(
          `✓ Translated "${key}" to ${targetLocales.join(', ')}`
        );
      } catch (error) {
        vscode.window.showErrorMessage(`Translation failed: ${String(error)}`);
        translationService?.showOutput();
      }
    }
  );
}

/**
 * Create and translate a missing key
 */
async function translateMissingKeyCommand(
  key?: string,
  documentUri?: vscode.Uri,
  line?: number
): Promise<void> {
  if (!translationService || !translationFileManager || !config) {
    vscode.window.showErrorMessage('TypeGlot not initialized');
    return;
  }

  // Get key from argument or prompt
  if (!key) {
    key = await vscode.window.showInputBox({
      prompt: 'Enter key name for new translation',
    });
  }

  if (!key) return;

  // Get JSDoc context if we have document info
  let jsDocContext: { description?: string; context?: string } | undefined;
  if (documentUri && line !== undefined) {
    const doc = await vscode.workspace.openTextDocument(documentUri);
    jsDocContext = extractJSDocFromSource(doc, line);
  }
  void jsDocContext; // TODO: Use jsDocContext in translation

  // Prompt for the source value
  let defaultValue = key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim();
  defaultValue = defaultValue.charAt(0).toUpperCase() + defaultValue.slice(1);

  const sourceValue = await vscode.window.showInputBox({
    prompt: `Enter ${config.sourceLocale} translation for "${key}"`,
    value: defaultValue,
  });

  if (!sourceValue) return;

  // Save source translation
  await translationFileManager.setTranslation(config.sourceLocale, key, sourceValue);

  // Get target locales
  const targetLocales = translationFileManager
    .getLoadedLocales()
    .filter((l) => l !== config!.sourceLocale);

  if (targetLocales.length === 0) {
    vscode.window.showInformationMessage(`Created "${key}" in ${config.sourceLocale}`);
    return;
  }

  // Ask if user wants to translate to other locales
  const translateOthers = await vscode.window.showQuickPick(['Yes', 'No'], {
    placeHolder: `Translate to ${targetLocales.length} other locale(s)?`,
  });

  if (translateOthers === 'Yes') {
    await translateKeyCommand(key, targetLocales);
  } else {
    vscode.window.showInformationMessage(`Created "${key}" in ${config.sourceLocale}`);
  }
}

/**
 * Open the dashboard webview
 */
function openDashboardCommand(context: vscode.ExtensionContext): void {
  const panel = DashboardPanel.createOrShow(context.extensionUri, translationFileManager);
  if (translationFileManager) {
    panel.setTranslationFileManager(translationFileManager);
  }
}

/**
 * Refresh decorations in the active editor
 */
function refreshDecorationsCommand(): void {
  const editor = vscode.window.activeTextEditor;
  if (editor && decorator) {
    decorator.updateDecorations(editor);
    vscode.window.showInformationMessage('TypeGlot decorations refreshed');
  }
}

/**
 * Navigate to a translation key in the JSON file
 */
async function goToTranslationCommand(key?: string): Promise<void> {
  if (!translationFileManager || !config) {
    vscode.window.showErrorMessage('TypeGlot not initialized');
    return;
  }

  if (!key) {
    key = await vscode.window.showInputBox({
      prompt: 'Enter translation key to find',
    });
  }

  if (!key) return;

  // Open the source locale file and find the key
  const filePath = translationFileManager.getLocalePath(config.sourceLocale);

  try {
    const doc = await vscode.workspace.openTextDocument(filePath);
    const text = doc.getText();

    // Find the key in the JSON
    const keyPattern = new RegExp(`"${key}"\\s*:`);
    const match = keyPattern.exec(text);

    if (match) {
      const position = doc.positionAt(match.index);
      const editor = await vscode.window.showTextDocument(doc);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(
        new vscode.Range(position, position),
        vscode.TextEditorRevealType.InCenter
      );
    } else {
      vscode.window.showWarningMessage(`Key "${key}" not found in ${config.sourceLocale}.json`);
    }
  } catch {
    vscode.window.showErrorMessage(`Could not open ${filePath}`);
  }
}

/**
 * Extract a hardcoded string to a translation
 */
async function extractStringCommand(
  stringValue?: string,
  documentUri?: vscode.Uri,
  range?: vscode.Range
): Promise<void> {
  if (!translationFileManager || !config) {
    vscode.window.showErrorMessage('TypeGlot not initialized');
    return;
  }

  // Get string value from selection if not provided
  if (!stringValue) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }

    const selection = editor.selection;
    if (selection.isEmpty) {
      vscode.window.showErrorMessage('Please select a string to extract');
      return;
    }

    stringValue = editor.document.getText(selection);
    // Remove quotes if present
    stringValue = stringValue.replace(/^['"`]|['"`]$/g, '');
    documentUri = editor.document.uri;
    range = selection;
  }

  if (!stringValue) return;

  // Generate a key name from the string
  const suggestedKey = stringValue
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 30);

  const key = await vscode.window.showInputBox({
    prompt: 'Enter key name for this translation',
    value: suggestedKey,
  });

  if (!key) return;

  // Save the translation
  await translationFileManager.setTranslation(config.sourceLocale, key, stringValue);

  // Replace the string in the document with translation call
  if (documentUri && range) {
    const edit = new vscode.WorkspaceEdit();

    // Determine the replacement text based on context
    const replacement = `m.${key}()`;
    edit.replace(documentUri, range, replacement);

    await vscode.workspace.applyEdit(edit);
  }

  // Offer to translate to other locales
  const targetLocales = translationFileManager
    .getLoadedLocales()
    .filter((l) => l !== config!.sourceLocale);

  if (targetLocales.length > 0) {
    const translate = await vscode.window.showQuickPick(['Yes', 'No'], {
      placeHolder: `Translate "${key}" to ${targetLocales.length} other locale(s)?`,
    });

    if (translate === 'Yes') {
      await translateKeyCommand(key, targetLocales);
    }
  }

  vscode.window.showInformationMessage(`Extracted string to "${key}"`);
}

/**
 * Translate all missing keys
 */
async function translateAllMissingCommand(): Promise<void> {
  if (!translationService || !translationFileManager || !config) {
    vscode.window.showErrorMessage('TypeGlot not initialized');
    return;
  }

  const missingKeys = translationFileManager.getMissingKeys(config.sourceLocale);

  if (missingKeys.size === 0) {
    vscode.window.showInformationMessage('All translations are complete!');
    return;
  }

  const confirm = await vscode.window.showWarningMessage(
    `Translate ${missingKeys.size} missing key(s) using AI?`,
    'Yes',
    'No'
  );

  if (confirm !== 'Yes') return;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Translating missing keys...',
      cancellable: true,
    },
    async (progress, token) => {
      let completed = 0;
      const total = missingKeys.size;

      for (const [key, locales] of missingKeys) {
        if (token.isCancellationRequested) break;

        progress.report({
          message: `${key} (${completed + 1}/${total})`,
          increment: 100 / total,
        });

        const sourceValue = translationFileManager!.getTranslation(config!.sourceLocale, key);
        if (!sourceValue) continue;

        try {
          const translations = await translationService!.translateKey(
            key,
            sourceValue,
            config!.sourceLocale,
            locales
          );

          for (const [locale, value] of translations) {
            await translationFileManager!.setTranslation(locale, key, value);
          }
        } catch (error) {
          console.error(`Failed to translate ${key}:`, error);
        }

        completed++;
      }

      vscode.window.showInformationMessage(`Translated ${completed} key(s) successfully`);
    }
  );
}

/**
 * Show translation status summary
 */
function showTranslationStatusCommand(): void {
  if (!translationFileManager || !config) {
    vscode.window.showErrorMessage('TypeGlot not initialized');
    return;
  }

  const stats = translationFileManager.getStatistics();
  const missingKeys = translationFileManager.getMissingKeys(stats.sourceLocale);

  const lines = [
    `📊 **TypeGlot Translation Status**`,
    ``,
    `Source locale: **${stats.sourceLocale}**`,
    `Total keys: **${stats.totalKeys}**`,
    ``,
  ];

  for (const [locale, data] of Object.entries(stats.locales)) {
    const percentage =
      stats.totalKeys > 0 ? Math.round((data.translated / stats.totalKeys) * 100) : 0;
    const icon = percentage === 100 ? '✅' : percentage > 50 ? '🟡' : '🔴';
    lines.push(`${icon} **${locale}**: ${data.translated}/${stats.totalKeys} (${percentage}%)`);
  }

  if (missingKeys.size > 0) {
    lines.push(``);
    lines.push(`⚠️ **${missingKeys.size} key(s) need translation**`);
  }

  const markdown = new vscode.MarkdownString(lines.join('\n'));
  vscode.window
    .showInformationMessage(markdown.value, 'Open Dashboard', 'Translate All')
    .then((action) => {
      if (action === 'Open Dashboard') {
        vscode.commands.executeCommand('typeglot.openDashboard');
      } else if (action === 'Translate All') {
        vscode.commands.executeCommand('typeglot.translateAllMissing');
      }
    });
}
