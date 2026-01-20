import { z } from 'zod';

/**
 * Translation message with optional parameters and pluralization
 */
export interface TranslationMessage {
  key: string;
  value: string;
  params?: TranslationParam[];
  pluralization?: PluralForm[];
}

/**
 * Parameter in a translation message
 */
export interface TranslationParam {
  name: string;
  type: 'string' | 'number' | 'date';
}

/**
 * Plural form for pluralization support
 */
export interface PluralForm {
  count: 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
  value: string;
}

/**
 * JSDoc context extracted from source code
 */
export interface JSDocContext {
  description?: string;
  example?: string;
  context?: string;
  maxLength?: number;
}

/**
 * Translation request with full context for AI
 */
export interface TranslationRequest {
  sourceLocale: string;
  targetLocale: string;
  message: TranslationMessage;
  jsDocContext?: JSDocContext;
  fileContext?: string;
}

/**
 * Result from AI translation
 */
export interface TranslationResult {
  key: string;
  sourceValue: string;
  translatedValue: string;
  confidence: number;
  notes?: string;
}

/**
 * Supported locale code
 */
export type LocaleCode = string;

/**
 * Translation file structure
 */
export type TranslationFile = Record<string, string>;

/**
 * Interpolation syntax style
 * - 'single' uses {variable} format (default, ICU-style)
 * - 'double' uses {{variable}} format (i18next, Handlebars-style)
 */
export type InterpolationSyntax = 'single' | 'double';

/**
 * Locale file pattern
 * - '{locale}.json' - flat structure (en.json, es.json)
 * - '{locale}/{namespace}.json' - namespace structure (en/default.json, en/common.json)
 */
export type LocaleFilePattern = '{locale}.json' | '{locale}/{namespace}.json';

/**
 * Zod schema for TypeGlot configuration
 */
export const TypeGlotConfigSchema = z.object({
  sourceLocale: z.string().default('en'),
  targetLocales: z.array(z.string()).default([]),
  localesDir: z.string().default('./locales'),
  outputDir: z.string().default('./src/generated/i18n'),
  include: z.array(z.string()).default(['src/**/*.{ts,tsx,js,jsx}']),
  exclude: z.array(z.string()).default(['node_modules', 'dist']),
  interpolation: z.enum(['single', 'double']).default('single'),
  filePattern: z.enum(['{locale}.json', '{locale}/{namespace}.json']).default('{locale}.json'),
  ai: z
    .object({
      provider: z.enum(['openai', 'anthropic', 'copilot']).default('openai'),
      model: z.string().optional(),
      apiKey: z.string().optional(),
    })
    .optional(),
});

export type TypeGlotConfig = z.infer<typeof TypeGlotConfigSchema>;
