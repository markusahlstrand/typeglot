import { describe, it, expect } from 'vitest';
import { TypeGlotConfigSchema } from '../types.js';
import { validateConfig } from '../config/config-loader.js';
import { DEFAULT_CONFIG } from '../config/defaults.js';

describe('TypeGlotConfigSchema', () => {
  it('should parse a valid config', () => {
    const config = {
      sourceLocale: 'en',
      targetLocales: ['es', 'fr'],
      localesDir: './locales',
      outputDir: './src/i18n',
    };

    const result = TypeGlotConfigSchema.parse(config);

    expect(result.sourceLocale).toBe('en');
    expect(result.targetLocales).toEqual(['es', 'fr']);
    expect(result.localesDir).toBe('./locales');
    expect(result.outputDir).toBe('./src/i18n');
  });

  it('should apply defaults for missing fields', () => {
    const config = {};

    const result = TypeGlotConfigSchema.parse(config);

    expect(result.sourceLocale).toBe('en');
    expect(result.targetLocales).toEqual([]);
    expect(result.localesDir).toBe('./locales');
    expect(result.outputDir).toBe('./src/generated/i18n');
  });

  it('should parse AI config', () => {
    const config = {
      ai: {
        provider: 'openai',
        model: 'gpt-4',
        apiKey: 'sk-test',
      },
    };

    const result = TypeGlotConfigSchema.parse(config);

    expect(result.ai?.provider).toBe('openai');
    expect(result.ai?.model).toBe('gpt-4');
    expect(result.ai?.apiKey).toBe('sk-test');
  });

  it('should reject invalid AI provider', () => {
    const config = {
      ai: {
        provider: 'invalid-provider',
      },
    };

    expect(() => TypeGlotConfigSchema.parse(config)).toThrow();
  });
});

describe('DEFAULT_CONFIG', () => {
  it('should have sensible defaults', () => {
    expect(DEFAULT_CONFIG.sourceLocale).toBe('en');
    expect(DEFAULT_CONFIG.targetLocales).toEqual([]);
    expect(DEFAULT_CONFIG.localesDir).toBe('./locales');
    expect(DEFAULT_CONFIG.outputDir).toBe('./src/generated/i18n');
    expect(DEFAULT_CONFIG.include).toContain('src/**/*.{ts,tsx,js,jsx}');
    expect(DEFAULT_CONFIG.exclude).toContain('node_modules');
  });
});

describe('validateConfig', () => {
  it('should validate a correct config', () => {
    const config = {
      sourceLocale: 'de',
      targetLocales: ['en', 'fr'],
    };

    const result = validateConfig(config);

    expect(result.sourceLocale).toBe('de');
    expect(result.targetLocales).toEqual(['en', 'fr']);
  });

  it('should throw for invalid config', () => {
    const config = {
      sourceLocale: 123, // should be string
    };

    expect(() => validateConfig(config)).toThrow();
  });
});
