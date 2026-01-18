import * as vscode from 'vscode';
import { TranslationFileManager } from './services/translation-file-manager';

/**
 * Patterns for matching translation function calls
 */
const TRANSLATION_PATTERNS = [
  // m.key_name() - typed function call
  /\bm\.(\w+)\s*\(/g,
  // m.key_name - property access without call
  /\bm\.(\w+)(?!\s*\()/g,
  // t('key_name') or t("key_name")
  /\bt\(\s*['"](\w+)['"]\s*\)/g,
  // useTranslation hook: { t } = useTranslation(); t('key')
  /\bt\(\s*['"]([^'"]+)['"]\s*\)/g,
  // i18n.t('key_name')
  /\bi18n\.t\(\s*['"]([^'"]+)['"]\s*\)/g,
];

export interface TranslationMatch {
  key: string;
  range: vscode.Range;
  fullMatch: string;
}

/**
 * Provides inline decorations showing translation values as ghost text
 */
export class TranslationDecorator implements vscode.Disposable {
  private translationDecorationType: vscode.TextEditorDecorationType;
  private missingDecorationType: vscode.TextEditorDecorationType;
  private translationFileManager: TranslationFileManager | undefined;
  private previewLocale: string;
  private debounceTimer: NodeJS.Timeout | undefined;

  constructor() {
    const config = vscode.workspace.getConfiguration('typeglot');
    this.previewLocale = config.get('previewLocale', 'en');

    // Style for existing translations - subtle ghost text
    this.translationDecorationType = vscode.window.createTextEditorDecorationType({
      after: {
        margin: '0 0 0 1em',
        color: new vscode.ThemeColor('editorCodeLens.foreground'),
        fontStyle: 'italic',
      },
    });

    // Style for missing translations - warning indicator
    this.missingDecorationType = vscode.window.createTextEditorDecorationType({
      after: {
        margin: '0 0 0 1em',
        color: new vscode.ThemeColor('editorWarning.foreground'),
        fontStyle: 'italic',
      },
      backgroundColor: new vscode.ThemeColor('editorWarning.background'),
      borderRadius: '3px',
    });

    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('typeglot.previewLocale')) {
        this.previewLocale = vscode.workspace
          .getConfiguration('typeglot')
          .get('previewLocale', 'en');
        this.refreshActiveEditor();
      }
    });
  }

  /**
   * Set the translation file manager for real translations
   */
  setTranslationFileManager(manager: TranslationFileManager): void {
    this.translationFileManager = manager;

    // Refresh decorations when translations change
    manager.onChange(() => {
      this.refreshActiveEditor();
    });
  }

  /**
   * Update decorations for the given editor
   */
  updateDecorations(editor: vscode.TextEditor): void {
    // Debounce rapid updates
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.doUpdateDecorations(editor);
    }, 100);
  }

  private doUpdateDecorations(editor: vscode.TextEditor): void {
    const document = editor.document;

    // Only process TypeScript/JavaScript files
    if (!this.isSupportedLanguage(document.languageId)) {
      editor.setDecorations(this.translationDecorationType, []);
      editor.setDecorations(this.missingDecorationType, []);
      return;
    }

    const text = document.getText();
    const translatedDecorations: vscode.DecorationOptions[] = [];
    const missingDecorations: vscode.DecorationOptions[] = [];
    const processedRanges = new Set<string>();

    // Find all translation matches
    const matches = this.findTranslationMatches(document, text);

    for (const match of matches) {
      // Avoid duplicate decorations for the same range
      const rangeKey = `${match.range.start.line}:${match.range.start.character}`;
      if (processedRanges.has(rangeKey)) continue;
      processedRanges.add(rangeKey);

      const translation = this.getTranslation(match.key);
      const config = vscode.workspace.getConfiguration('typeglot');
      const highlightMissing = config.get('highlightMissingKeys', true);

      if (translation) {
        translatedDecorations.push({
          range: match.range,
          renderOptions: {
            after: {
              contentText: `→ "${this.truncate(translation, 50)}"`,
            },
          },
          hoverMessage: this.createHoverMessage(match.key, translation),
        });
      } else if (highlightMissing) {
        missingDecorations.push({
          range: match.range,
          renderOptions: {
            after: {
              contentText: `⚠ Missing translation`,
            },
          },
          hoverMessage: this.createMissingHoverMessage(match.key),
        });
      }
    }

    editor.setDecorations(this.translationDecorationType, translatedDecorations);
    editor.setDecorations(this.missingDecorationType, missingDecorations);
  }

  /**
   * Find all translation function calls in the document
   */
  findTranslationMatches(document: vscode.TextDocument, text: string): TranslationMatch[] {
    const matches: TranslationMatch[] = [];

    for (const pattern of TRANSLATION_PATTERNS) {
      // Reset lastIndex for each pattern
      pattern.lastIndex = 0;
      let match;

      while ((match = pattern.exec(text)) !== null) {
        const key = match[1]!;
        const startPos = document.positionAt(match.index);
        const endPos = document.positionAt(match.index + match[0].length);

        matches.push({
          key,
          range: new vscode.Range(startPos, endPos),
          fullMatch: match[0],
        });
      }
    }

    return matches;
  }

  /**
   * Get translation value for a key
   */
  private getTranslation(key: string): string | undefined {
    if (this.translationFileManager) {
      return this.translationFileManager.getTranslation(this.previewLocale, key);
    }
    return undefined;
  }

  /**
   * Create hover message for translated keys
   */
  private createHoverMessage(key: string, translation: string): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.appendMarkdown(`**TypeGlot Translation**\n\n`);
    md.appendMarkdown(`**Key:** \`${key}\`\n\n`);
    md.appendMarkdown(`**${this.previewLocale}:** ${translation}\n\n`);

    // Show translations in other locales if available
    if (this.translationFileManager) {
      const otherLocales = this.translationFileManager
        .getLoadedLocales()
        .filter((l) => l !== this.previewLocale);

      if (otherLocales.length > 0) {
        md.appendMarkdown(`---\n\n`);
        for (const locale of otherLocales.slice(0, 5)) {
          const value = this.translationFileManager.getTranslation(locale, key);
          if (value) {
            md.appendMarkdown(`**${locale}:** ${value}\n\n`);
          } else {
            md.appendMarkdown(`**${locale}:** ⚠ *Missing*\n\n`);
          }
        }
      }
    }

    md.appendMarkdown(`---\n\n`);
    md.appendMarkdown(
      `[Translate with AI](command:typeglot.translateKey?${encodeURIComponent(JSON.stringify([key]))}) | `
    );
    md.appendMarkdown(
      `[Go to JSON](command:typeglot.goToTranslation?${encodeURIComponent(JSON.stringify([key]))})`
    );

    md.isTrusted = true;
    return md;
  }

  /**
   * Create hover message for missing keys
   */
  private createMissingHoverMessage(key: string): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.appendMarkdown(`**⚠ Missing Translation**\n\n`);
    md.appendMarkdown(`Key \`${key}\` is not defined in \`${this.previewLocale}.json\`\n\n`);
    md.appendMarkdown(`---\n\n`);
    md.appendMarkdown(
      `[Add Translation with AI](command:typeglot.translateMissingKey?${encodeURIComponent(JSON.stringify([key]))})`
    );

    md.isTrusted = true;
    return md;
  }

  /**
   * Check if language is supported
   */
  private isSupportedLanguage(languageId: string): boolean {
    return ['typescript', 'typescriptreact', 'javascript', 'javascriptreact'].includes(languageId);
  }

  /**
   * Truncate string to max length
   */
  private truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 1) + '…';
  }

  /**
   * Refresh decorations in active editor
   */
  private refreshActiveEditor(): void {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      this.updateDecorations(editor);
    }
  }

  dispose(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.translationDecorationType.dispose();
    this.missingDecorationType.dispose();
  }
}
