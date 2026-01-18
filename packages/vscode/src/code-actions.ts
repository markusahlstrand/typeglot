import * as vscode from 'vscode';
import { TranslationFileManager } from './services/translation-file-manager';
import { TranslationDecorator, type TranslationMatch } from './decorations';

/**
 * Provides code actions for translation keys:
 * - Translate missing keys with AI
 * - Go to translation definition
 * - Extract hardcoded strings to translations
 */
export class TranslationCodeActionProvider implements vscode.CodeActionProvider {
  private translationFileManager: TranslationFileManager | undefined;
  private decorator: TranslationDecorator | undefined;
  private sourceLocale = 'en';

  constructor() {}

  setTranslationFileManager(manager: TranslationFileManager, sourceLocale = 'en'): void {
    this.translationFileManager = manager;
    this.sourceLocale = sourceLocale;
  }

  setDecorator(decorator: TranslationDecorator): void {
    this.decorator = decorator;
  }

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];
    const line = document.lineAt(range.start.line);
    const text = document.getText();

    // Find translation matches on this line using the decorator's logic
    const matches = this.findTranslationMatchesOnLine(document, text, range.start.line);

    for (const match of matches) {
      const key = match.key;
      const isMissing = !this.translationFileManager?.hasKey(this.sourceLocale, key);
      const missingLocales =
        this.translationFileManager?.getMissingLocales(key, this.sourceLocale) ?? [];

      if (isMissing) {
        // Key doesn't exist in source locale - offer to create it
        const createAction = new vscode.CodeAction(
          `TypeGlot: Create translation for "${key}"`,
          vscode.CodeActionKind.QuickFix
        );
        createAction.command = {
          title: 'Create translation',
          command: 'typeglot.translateMissingKey',
          arguments: [key, document.uri, range.start.line],
        };
        createAction.isPreferred = true;
        actions.push(createAction);
      } else if (missingLocales.length > 0) {
        // Key exists but missing in some locales
        const translateAction = new vscode.CodeAction(
          `TypeGlot: Translate "${key}" to ${missingLocales.length} locale(s)`,
          vscode.CodeActionKind.QuickFix
        );
        translateAction.command = {
          title: 'Translate to missing locales',
          command: 'typeglot.translateKey',
          arguments: [key, missingLocales],
        };
        actions.push(translateAction);
      }

      // Always offer to go to translation
      if (!isMissing) {
        const goToAction = new vscode.CodeAction(
          `TypeGlot: Go to translation for "${key}"`,
          vscode.CodeActionKind.Empty
        );
        goToAction.command = {
          title: 'Go to translation',
          command: 'typeglot.goToTranslation',
          arguments: [key],
        };
        actions.push(goToAction);
      }
    }

    // Check for extractable strings (long hardcoded strings)
    const extractableString = this.findExtractableString(line.text, range);
    if (extractableString && matches.length === 0) {
      const extractAction = new vscode.CodeAction(
        'TypeGlot: Extract string to translation',
        vscode.CodeActionKind.RefactorExtract
      );
      extractAction.command = {
        title: 'Extract to translation',
        command: 'typeglot.extractString',
        arguments: [extractableString, document.uri, range],
      };
      actions.push(extractAction);
    }

    return actions;
  }

  /**
   * Find translation matches on a specific line
   */
  private findTranslationMatchesOnLine(
    document: vscode.TextDocument,
    text: string,
    lineNumber: number
  ): TranslationMatch[] {
    if (!this.decorator) {
      // Fallback patterns if decorator not set
      return this.fallbackFindMatches(document, text, lineNumber);
    }

    return this.decorator
      .findTranslationMatches(document, text)
      .filter((match) => match.range.start.line === lineNumber);
  }

  /**
   * Fallback matching when decorator isn't available
   */
  private fallbackFindMatches(
    document: vscode.TextDocument,
    text: string,
    lineNumber: number
  ): TranslationMatch[] {
    const matches: TranslationMatch[] = [];
    const patterns = [/\bm\.(\w+)\s*\(/g, /\bm\.(\w+)(?!\s*\()/g, /\bt\(\s*['"](\w+)['"]\s*\)/g];

    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match;

      while ((match = pattern.exec(text)) !== null) {
        const startPos = document.positionAt(match.index);

        if (startPos.line === lineNumber) {
          const endPos = document.positionAt(match.index + match[0].length);
          matches.push({
            key: match[1]!,
            range: new vscode.Range(startPos, endPos),
            fullMatch: match[0],
          });
        }
      }
    }

    return matches;
  }

  /**
   * Find extractable hardcoded strings
   */
  private findExtractableString(
    lineText: string,
    range: vscode.Range | vscode.Selection
  ): string | undefined {
    // Look for quoted strings at least 10 characters long
    const stringPatterns = [/'([^']{10,})'/g, /"([^"]{10,})"/g, /`([^`]{10,})`/g];

    for (const pattern of stringPatterns) {
      let match;
      while ((match = pattern.exec(lineText)) !== null) {
        const startChar = match.index;
        const endChar = match.index + match[0].length;

        // Check if the cursor/selection overlaps with this string
        if (range.start.character <= endChar && range.end.character >= startChar) {
          // Make sure it's not already a translation call
          const prefix = lineText.slice(0, startChar).trim();
          if (!prefix.endsWith('t(') && !prefix.endsWith('m.')) {
            return match[1];
          }
        }
      }
    }

    return undefined;
  }
}

/**
 * Extract JSDoc context from the source code around a translation usage
 */
export async function extractJSDocFromSource(
  document: vscode.TextDocument,
  line: number
): Promise<{ description?: string; context?: string } | undefined> {
  // Look for JSDoc comments above the current line
  let searchLine = line - 1;
  const jsDocLines: string[] = [];

  // Search upward for JSDoc comment
  while (searchLine >= 0) {
    const lineText = document.lineAt(searchLine).text.trim();

    if (lineText.startsWith('*/')) {
      // Found end of JSDoc, start collecting
      jsDocLines.unshift(lineText);
      searchLine--;
      continue;
    }

    if (lineText.startsWith('*') || lineText.startsWith('/**')) {
      jsDocLines.unshift(lineText);

      if (lineText.startsWith('/**')) {
        // Found start of JSDoc
        break;
      }
    } else if (jsDocLines.length > 0) {
      // Non-JSDoc line but we were collecting - invalid JSDoc
      return undefined;
    } else if (lineText !== '' && !lineText.startsWith('//')) {
      // Non-comment, non-empty line - stop searching
      break;
    }

    searchLine--;

    // Don't search too far
    if (line - searchLine > 20) break;
  }

  if (jsDocLines.length === 0) {
    return undefined;
  }

  // Parse JSDoc content
  const jsDocText = jsDocLines.join('\n');
  const result: { description?: string; context?: string } = {};

  // Extract @desc or @description tag
  const descMatch = /@desc(?:ription)?\s+(.+?)(?=\n\s*\*\s*@|\n\s*\*\/|$)/is.exec(jsDocText);
  if (descMatch) {
    result.description = descMatch[1].replace(/\n\s*\*\s*/g, ' ').trim();
  }

  // Extract @context tag
  const contextMatch = /@context\s+(.+?)(?=\n\s*\*\s*@|\n\s*\*\/|$)/is.exec(jsDocText);
  if (contextMatch) {
    result.context = contextMatch[1].replace(/\n\s*\*\s*/g, ' ').trim();
  }

  // If no specific tags, use the main description
  if (!result.description && !result.context) {
    const mainDesc = /\/\*\*\s*\n?\s*\*?\s*([^@*].*?)(?=\n\s*\*\s*@|\n\s*\*\/|$)/is.exec(jsDocText);
    if (mainDesc) {
      result.description = mainDesc[1].replace(/\n\s*\*\s*/g, ' ').trim();
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}
