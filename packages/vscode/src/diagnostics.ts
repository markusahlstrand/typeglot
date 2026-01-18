import * as vscode from 'vscode';
import { TranslationFileManager } from './services/translation-file-manager';

/**
 * Patterns for matching translation function calls
 */
const TRANSLATION_PATTERNS = [
  /\bm\.(\w+)\s*\(/g,
  /\bm\.(\w+)(?!\s*\()/g,
  /\bt\(\s*['"](\w+)['"]\s*\)/g,
  /\bi18n\.t\(\s*['"]([^'"]+)['"]\s*\)/g,
];

/**
 * Provides diagnostics (warnings) for missing translation keys
 */
export class DiagnosticProvider implements vscode.Disposable {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private translationFileManager: TranslationFileManager;
  private sourceLocale: string;
  private debounceTimer: NodeJS.Timeout | undefined;

  constructor(translationFileManager: TranslationFileManager, sourceLocale = 'en') {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('typeglot');
    this.translationFileManager = translationFileManager;
    this.sourceLocale = sourceLocale;
  }

  /**
   * Update diagnostics for a document
   */
  updateDiagnostics(document: vscode.TextDocument): void {
    // Only process TypeScript/JavaScript files
    if (!this.isSupportedLanguage(document.languageId)) {
      this.diagnosticCollection.delete(document.uri);
      return;
    }

    // Debounce rapid updates
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.doUpdateDiagnostics(document);
    }, 250);
  }

  private doUpdateDiagnostics(document: vscode.TextDocument): void {
    const diagnostics: vscode.Diagnostic[] = [];
    const text = document.getText();
    const processedKeys = new Set<string>();

    for (const pattern of TRANSLATION_PATTERNS) {
      pattern.lastIndex = 0;
      let match;

      while ((match = pattern.exec(text)) !== null) {
        const key = match[1]!;
        const rangeKey = `${match.index}:${key}`;

        // Avoid duplicate diagnostics
        if (processedKeys.has(rangeKey)) continue;
        processedKeys.add(rangeKey);

        const isMissing = !this.translationFileManager.hasKey(this.sourceLocale, key);
        const missingLocales = this.translationFileManager.getMissingLocales(
          key,
          this.sourceLocale
        );

        if (isMissing) {
          // Key doesn't exist at all
          const startPos = document.positionAt(match.index);
          const endPos = document.positionAt(match.index + match[0].length);
          const range = new vscode.Range(startPos, endPos);

          const diagnostic = new vscode.Diagnostic(
            range,
            `Translation key "${key}" is not defined in ${this.sourceLocale}.json`,
            vscode.DiagnosticSeverity.Warning
          );
          diagnostic.code = 'typeglot-missing-key';
          diagnostic.source = 'TypeGlot';
          diagnostics.push(diagnostic);
        } else if (missingLocales.length > 0) {
          // Key exists but missing in some locales
          const startPos = document.positionAt(match.index);
          const endPos = document.positionAt(match.index + match[0].length);
          const range = new vscode.Range(startPos, endPos);

          const diagnostic = new vscode.Diagnostic(
            range,
            `Translation key "${key}" is missing in: ${missingLocales.join(', ')}`,
            vscode.DiagnosticSeverity.Hint
          );
          diagnostic.code = 'typeglot-incomplete-key';
          diagnostic.source = 'TypeGlot';
          diagnostics.push(diagnostic);
        }
      }
    }

    this.diagnosticCollection.set(document.uri, diagnostics);
  }

  /**
   * Check if language is supported
   */
  private isSupportedLanguage(languageId: string): boolean {
    return ['typescript', 'typescriptreact', 'javascript', 'javascriptreact'].includes(languageId);
  }

  /**
   * Clear all diagnostics
   */
  clear(): void {
    this.diagnosticCollection.clear();
  }

  dispose(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.diagnosticCollection.dispose();
  }
}
