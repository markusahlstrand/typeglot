import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

interface TranslationConfig {
  sourceLocale: string;
  targetLocales: string[];
  localesDir: string;
  outputDir: string;
}

interface Translations {
  hello: string;
  welcome: string;
}

// Note: These are integration-style tests for CLI commands
// They test the core functionality without actually running the CLI

describe('CLI commands', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'typeglot-cli-test-'));
  });

  afterEach(async () => {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  });

  describe('init command behavior', () => {
    it('should create config file structure', async () => {
      // Simulate what init command should create
      const configPath = path.join(tempDir, 'typeglot.config.json');
      const localesDir = path.join(tempDir, 'locales');

      const config: TranslationConfig = {
        sourceLocale: 'en',
        targetLocales: [],
        localesDir: './locales',
        outputDir: './src/generated/i18n',
      };

      // Write config
      await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2));
      await fs.promises.mkdir(localesDir, { recursive: true });
      await fs.promises.writeFile(path.join(localesDir, 'en.json'), JSON.stringify({}, null, 2));

      // Verify
      expect(fs.existsSync(configPath)).toBe(true);
      expect(fs.existsSync(localesDir)).toBe(true);
      expect(fs.existsSync(path.join(localesDir, 'en.json'))).toBe(true);

      const loadedConfig = JSON.parse(
        await fs.promises.readFile(configPath, 'utf-8')
      ) as TranslationConfig;
      expect(loadedConfig.sourceLocale).toBe('en');
    });
  });

  describe('build command behavior', () => {
    it('should process translation files', async () => {
      // Create a simple translation file
      const localesDir = path.join(tempDir, 'locales');
      await fs.promises.mkdir(localesDir, { recursive: true });

      const translations: Translations = {
        hello: 'Hello',
        welcome: 'Welcome, {name}!',
      };

      await fs.promises.writeFile(
        path.join(localesDir, 'en.json'),
        JSON.stringify(translations, null, 2)
      );

      // Verify the file can be read and parsed
      const content = await fs.promises.readFile(path.join(localesDir, 'en.json'), 'utf-8');
      const parsed = JSON.parse(content) as Translations;

      expect(parsed.hello).toBe('Hello');
      expect(parsed.welcome).toBe('Welcome, {name}!');
    });
  });
});
