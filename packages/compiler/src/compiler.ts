import * as fs from 'node:fs';
import * as path from 'node:path';
import { TypeGlotConfig } from '@typeglot/core';
import { parseTranslationFile, ParsedTranslations } from './parser.js';
import { generateTypedFunctions } from './generator.js';

export interface CompileResult {
  success: boolean;
  outputPath: string;
  keysCount: number;
  errors?: string[];
}

export interface CompilerOptions {
  config: TypeGlotConfig;
  projectRoot: string;
  verbose?: boolean;
}

/**
 * Represents a locale with its files (for namespace support)
 */
interface LocaleInfo {
  locale: string;
  files: string[]; // Multiple files for namespace format
}

/**
 * Main compiler class for TypeGlot
 */
export class TypeGlotCompiler {
  private config: TypeGlotConfig;
  private projectRoot: string;
  private verbose: boolean;

  constructor(options: CompilerOptions) {
    this.config = options.config;
    this.projectRoot = options.projectRoot;
    this.verbose = options.verbose ?? false;
  }

  /**
   * Compile all translation files to TypeScript
   */
  async compile(): Promise<CompileResult[]> {
    const results: CompileResult[] = [];
    const localesDir = path.resolve(this.projectRoot, this.config.localesDir);

    // Ensure output directory exists
    const outputDir = path.resolve(this.projectRoot, this.config.outputDir);
    await fs.promises.mkdir(outputDir, { recursive: true });

    // Find all locales with their files
    const localeInfos = await this.getLocaleInfos(localesDir);

    if (localeInfos.length === 0) {
      this.log('No translation files found');
      return results;
    }

    // Parse the source locale first
    const sourceLocaleInfo = localeInfos.find((l) => l.locale === this.config.sourceLocale);

    if (!sourceLocaleInfo) {
      return [
        {
          success: false,
          outputPath: '',
          keysCount: 0,
          errors: [`Source locale not found: ${this.config.sourceLocale}`],
        },
      ];
    }

    const sourceTranslations = await this.parseLocaleFiles(sourceLocaleInfo);

    // Generate the main messages module
    const mainOutput = await this.generateMainModule(sourceTranslations, outputDir);
    results.push(mainOutput);

    // Generate locale-specific modules
    for (const localeInfo of localeInfos) {
      const translations = await this.parseLocaleFiles(localeInfo);
      const result = await this.generateLocaleModule(localeInfo.locale, translations, outputDir);
      results.push(result);
    }

    // Generate index file
    const locales = localeInfos.map((l) => l.locale);
    await this.generateIndexFile(locales, outputDir);

    return results;
  }

  /**
   * Compile a single locale file
   */
  async compileSingle(filePath: string): Promise<CompileResult> {
    const locale = this.getLocaleFromPath(filePath);
    const translations = await parseTranslationFile(filePath);
    const outputDir = path.resolve(this.projectRoot, this.config.outputDir);

    return this.generateLocaleModule(locale, translations, outputDir);
  }

  /**
   * Parse all files for a locale and merge them (for namespace support)
   */
  private async parseLocaleFiles(localeInfo: LocaleInfo): Promise<ParsedTranslations> {
    const merged: ParsedTranslations = {};

    for (const file of localeInfo.files) {
      const translations = await parseTranslationFile(file);

      // For namespace format, prefix keys with namespace
      if (this.config.filePattern === '{locale}/{namespace}.json') {
        const namespace = path.basename(file, '.json');
        for (const [key, value] of Object.entries(translations)) {
          // Use namespace prefix only if not 'default'
          const prefixedKey = namespace === 'default' ? key : `${namespace}.${key}`;
          merged[prefixedKey] = value;
        }
      } else {
        Object.assign(merged, translations);
      }
    }

    return merged;
  }

  private async generateMainModule(
    translations: ParsedTranslations,
    outputDir: string
  ): Promise<CompileResult> {
    const outputPath = path.join(outputDir, 'messages.ts');
    const code = generateTypedFunctions(translations, this.config.sourceLocale, {
      interpolation: this.config.interpolation,
    });

    await fs.promises.writeFile(outputPath, code, 'utf-8');

    this.log(`Generated: ${outputPath} (${Object.keys(translations).length} keys)`);

    return {
      success: true,
      outputPath,
      keysCount: Object.keys(translations).length,
    };
  }

  private async generateLocaleModule(
    locale: string,
    translations: ParsedTranslations,
    outputDir: string
  ): Promise<CompileResult> {
    const outputPath = path.join(outputDir, `${locale}.ts`);
    const code = this.generateLocaleData(locale, translations);

    await fs.promises.writeFile(outputPath, code, 'utf-8');

    this.log(`Generated: ${outputPath} (${Object.keys(translations).length} keys)`);

    return {
      success: true,
      outputPath,
      keysCount: Object.keys(translations).length,
    };
  }

  private generateLocaleData(locale: string, translations: ParsedTranslations): string {
    const lines: string[] = [
      '// Auto-generated by @typeglot/compiler',
      '// Do not edit manually',
      '',
      `export const locale = '${locale}' as const;`,
      '',
      'export const messages = {',
    ];

    for (const [key, value] of Object.entries(translations)) {
      const escapedValue = value.replace(/'/g, "\\'").replace(/\n/g, '\\n');
      lines.push(`  '${key}': '${escapedValue}',`);
    }

    lines.push('} as const;');
    lines.push('');
    lines.push('export type MessageKey = keyof typeof messages;');
    lines.push('');

    return lines.join('\n');
  }

  private async generateIndexFile(locales: string[], outputDir: string): Promise<void> {
    const lines: string[] = [
      '// Auto-generated by @typeglot/compiler',
      '// Do not edit manually',
      '',
      "export * from './messages.js';",
      '',
    ];

    for (const locale of locales) {
      lines.push(`export * as ${locale} from './${locale}.js';`);
    }

    lines.push('');
    lines.push(
      `export const availableLocales = [${locales.map((l) => `'${l}'`).join(', ')}] as const;`
    );
    lines.push('export type Locale = (typeof availableLocales)[number];');
    lines.push('');

    const outputPath = path.join(outputDir, 'index.ts');
    await fs.promises.writeFile(outputPath, lines.join('\n'), 'utf-8');

    this.log(`Generated: ${outputPath}`);
  }

  /**
   * Get locale information based on file pattern
   */
  private async getLocaleInfos(localesDir: string): Promise<LocaleInfo[]> {
    const filePattern = this.config.filePattern ?? '{locale}.json';

    if (filePattern === '{locale}/{namespace}.json') {
      return this.getNamespaceLocaleInfos(localesDir);
    }

    return this.getFlatLocaleInfos(localesDir);
  }

  /**
   * Get locale infos for flat format (en.json, es.json)
   */
  private async getFlatLocaleInfos(localesDir: string): Promise<LocaleInfo[]> {
    try {
      const entries = await fs.promises.readdir(localesDir, { withFileTypes: true });
      return entries
        .filter((e) => e.isFile() && e.name.endsWith('.json'))
        .map((e) => ({
          locale: path.basename(e.name, '.json'),
          files: [path.join(localesDir, e.name)],
        }));
    } catch {
      return [];
    }
  }

  /**
   * Get locale infos for namespace format (en/default.json, en/common.json)
   */
  private async getNamespaceLocaleInfos(localesDir: string): Promise<LocaleInfo[]> {
    const localeInfos: LocaleInfo[] = [];

    try {
      const entries = await fs.promises.readdir(localesDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const localePath = path.join(localesDir, entry.name);
          const files: string[] = [];

          try {
            const localeEntries = await fs.promises.readdir(localePath, { withFileTypes: true });
            for (const localeEntry of localeEntries) {
              if (localeEntry.isFile() && localeEntry.name.endsWith('.json')) {
                files.push(path.join(localePath, localeEntry.name));
              }
            }
          } catch {
            // Ignore read errors for locale directory
          }

          if (files.length > 0) {
            localeInfos.push({
              locale: entry.name,
              files,
            });
          }
        }
      }
    } catch {
      return [];
    }

    return localeInfos;
  }

  private getLocaleFromPath(filePath: string): string {
    // For namespace format, get the parent directory name
    if (this.config.filePattern === '{locale}/{namespace}.json') {
      return path.basename(path.dirname(filePath));
    }
    return path.basename(filePath, '.json');
  }

  private log(message: string): void {
    if (this.verbose) {
      console.log(`[typeglot] ${message}`);
    }
  }
}
