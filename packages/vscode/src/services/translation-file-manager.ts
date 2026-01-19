import * as vscode from 'vscode';
import * as path from 'path';
import { TypeGlotConfig } from '@typeglot/core';

export type TranslationFile = Record<string, string>;

/**
 * Manages reading and writing translation JSON files
 */
export class TranslationFileManager {
  private workspaceRoot: string;
  private localesDir: string;
  private translationCache = new Map<string, TranslationFile>();
  private fileWatcher: vscode.FileSystemWatcher | undefined;
  private onChangeEmitter = new vscode.EventEmitter<string>();

  public readonly onChange = this.onChangeEmitter.event;

  constructor(workspaceRoot: string, config?: TypeGlotConfig) {
    this.workspaceRoot = workspaceRoot;
    this.localesDir = config?.localesDir ?? './locales';
  }

  /**
   * Initialize the file manager and start watching for changes
   */
  async initialize(): Promise<void> {
    await this.loadAllTranslations();
    this.startWatching();
  }

  /**
   * Get the absolute path to the locales directory
   */
  private getLocalesPath(): string {
    return path.join(this.workspaceRoot, this.localesDir);
  }

  /**
   * Get the path to a specific locale file
   */
  getLocalePath(locale: string): string {
    return path.join(this.getLocalesPath(), `${locale}.json`);
  }

  /**
   * Load all translation files from the locales directory
   */
  async loadAllTranslations(): Promise<void> {
    this.translationCache.clear();

    const localesPath = this.getLocalesPath();
    const localesUri = vscode.Uri.file(localesPath);

    try {
      const entries = await vscode.workspace.fs.readDirectory(localesUri);

      for (const [name, type] of entries) {
        if (type === vscode.FileType.File && name.endsWith('.json')) {
          const locale = name.replace('.json', '');
          await this.loadTranslation(locale);
        }
      }
    } catch {
      // Locales directory doesn't exist yet
      console.log('Locales directory not found:', localesPath);
    }
  }

  /**
   * Load translations for a specific locale
   */
  async loadTranslation(locale: string): Promise<TranslationFile | undefined> {
    const filePath = this.getLocalePath(locale);
    const uri = vscode.Uri.file(filePath);

    try {
      const content = await vscode.workspace.fs.readFile(uri);
      const translations = JSON.parse(content.toString()) as TranslationFile;
      this.translationCache.set(locale, translations);
      return translations;
    } catch {
      return undefined;
    }
  }

  /**
   * Get translations for a specific locale
   */
  getTranslations(locale: string): TranslationFile | undefined {
    return this.translationCache.get(locale);
  }

  /**
   * Get a specific translation value
   */
  getTranslation(locale: string, key: string): string | undefined {
    return this.translationCache.get(locale)?.[key];
  }

  /**
   * Get all loaded locales
   */
  getLoadedLocales(): string[] {
    return Array.from(this.translationCache.keys());
  }

  /**
   * Check if a key exists in a locale
   */
  hasKey(locale: string, key: string): boolean {
    return this.translationCache.get(locale)?.[key] !== undefined;
  }

  /**
   * Check if a key is missing from any target locale
   */
  getMissingLocales(key: string, sourceLocale: string): string[] {
    const missing: string[] = [];
    for (const [locale, translations] of this.translationCache) {
      if (locale !== sourceLocale && translations[key] === undefined) {
        missing.push(locale);
      }
    }
    return missing;
  }

  /**
   * Get all keys across all locales
   */
  getAllKeys(): Set<string> {
    const keys = new Set<string>();
    for (const translations of this.translationCache.values()) {
      for (const key of Object.keys(translations)) {
        keys.add(key);
      }
    }
    return keys;
  }

  /**
   * Get keys that exist in source but not in target locales
   */
  getMissingKeys(sourceLocale: string): Map<string, string[]> {
    const sourceTranslations = this.translationCache.get(sourceLocale);
    if (!sourceTranslations) return new Map();

    const missing = new Map<string, string[]>();

    for (const key of Object.keys(sourceTranslations)) {
      const missingLocales = this.getMissingLocales(key, sourceLocale);
      if (missingLocales.length > 0) {
        missing.set(key, missingLocales);
      }
    }

    return missing;
  }

  /**
   * Add or update a translation
   */
  async setTranslation(locale: string, key: string, value: string): Promise<void> {
    let translations = this.translationCache.get(locale);

    if (!translations) {
      translations = {};
      this.translationCache.set(locale, translations);
    }

    translations[key] = value;
    await this.saveTranslation(locale);
  }

  /**
   * Add multiple translations at once
   */
  async setTranslations(locale: string, entries: Record<string, string>): Promise<void> {
    let translations = this.translationCache.get(locale);

    if (!translations) {
      translations = {};
      this.translationCache.set(locale, translations);
    }

    Object.assign(translations, entries);
    await this.saveTranslation(locale);
  }

  /**
   * Save translations for a locale to disk
   */
  private async saveTranslation(locale: string): Promise<void> {
    const translations = this.translationCache.get(locale);
    if (!translations) return;

    const filePath = this.getLocalePath(locale);
    const uri = vscode.Uri.file(filePath);

    // Sort keys alphabetically for consistent output
    const sorted = Object.keys(translations)
      .sort()
      .reduce((acc, key) => {
        acc[key] = translations[key] ?? '';
        return acc;
      }, {} as TranslationFile);

    const content = JSON.stringify(sorted, null, 2) + '\n';
    await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf-8'));
  }

  /**
   * Delete a translation key from all locales
   */
  async deleteKey(key: string): Promise<void> {
    for (const [locale, translations] of this.translationCache) {
      if (translations[key] !== undefined) {
        delete translations[key];
        await this.saveTranslation(locale);
      }
    }
  }

  /**
   * Rename a translation key across all locales
   */
  async renameKey(oldKey: string, newKey: string): Promise<void> {
    for (const [locale, translations] of this.translationCache) {
      if (translations[oldKey] !== undefined) {
        translations[newKey] = translations[oldKey];
        delete translations[oldKey];
        await this.saveTranslation(locale);
      }
    }
  }

  /**
   * Start watching for file changes
   */
  private startWatching(): void {
    const pattern = new vscode.RelativePattern(this.getLocalesPath(), '*.json');
    this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

    this.fileWatcher.onDidChange(async (uri) => {
      const locale = path.basename(uri.fsPath, '.json');
      await this.loadTranslation(locale);
      this.onChangeEmitter.fire(locale);
    });

    this.fileWatcher.onDidCreate(async (uri) => {
      const locale = path.basename(uri.fsPath, '.json');
      await this.loadTranslation(locale);
      this.onChangeEmitter.fire(locale);
    });

    this.fileWatcher.onDidDelete((uri) => {
      const locale = path.basename(uri.fsPath, '.json');
      this.translationCache.delete(locale);
      this.onChangeEmitter.fire(locale);
    });
  }

  /**
   * Get translation statistics
   */
  getStatistics(): TranslationStatistics {
    const sourceLocale = this.getLoadedLocales()[0] ?? 'en';
    const sourceTranslations = this.translationCache.get(sourceLocale) ?? {};
    const totalKeys = Object.keys(sourceTranslations).length;

    const localeStats: Record<string, { translated: number; missing: number }> = {};

    for (const [locale, translations] of this.translationCache) {
      if (locale === sourceLocale) continue;

      let translated = 0;
      let missing = 0;

      for (const key of Object.keys(sourceTranslations)) {
        if (translations[key] !== undefined) {
          translated++;
        } else {
          missing++;
        }
      }

      localeStats[locale] = { translated, missing };
    }

    return {
      sourceLocale,
      totalKeys,
      locales: localeStats,
    };
  }

  dispose(): void {
    this.fileWatcher?.dispose();
    this.onChangeEmitter.dispose();
  }
}

export interface TranslationStatistics {
  sourceLocale: string;
  totalKeys: number;
  locales: Record<string, { translated: number; missing: number }>;
}
