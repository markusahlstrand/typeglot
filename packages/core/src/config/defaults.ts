import { TypeGlotConfig } from '../types.js';

/**
 * Default TypeGlot configuration
 */
export const DEFAULT_CONFIG: TypeGlotConfig = {
  sourceLocale: 'en',
  targetLocales: [],
  localesDir: './locales',
  outputDir: './src/generated/i18n',
  include: ['src/**/*.{ts,tsx,js,jsx}'],
  exclude: ['node_modules', 'dist'],
};
