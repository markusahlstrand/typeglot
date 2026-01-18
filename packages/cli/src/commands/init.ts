import * as fs from 'node:fs';
import * as path from 'node:path';
import chalk from 'chalk';
import { saveConfig, DEFAULT_CONFIG } from '@typeglot/core';

interface InitOptions {
  locale: string;
  dir: string;
}

export async function initCommand(options: InitOptions): Promise<void> {
  const projectRoot = process.cwd();

  console.log(chalk.blue('🌐 Initializing TypeGlot...\n'));

  // Create config file
  const config = {
    ...DEFAULT_CONFIG,
    sourceLocale: options.locale,
    localesDir: options.dir,
  };

  await saveConfig(projectRoot, config);
  console.log(chalk.green('✓'), 'Created typeglot.config.json');

  // Create locales directory
  const localesDir = path.join(projectRoot, options.dir);
  await fs.promises.mkdir(localesDir, { recursive: true });
  console.log(chalk.green('✓'), `Created ${options.dir}/`);

  // Create source locale file
  const sourceFile = path.join(localesDir, `${options.locale}.json`);
  if (!fs.existsSync(sourceFile)) {
    const initialContent = {
      hello: 'Hello',
      welcome: 'Welcome, {name}!',
      items_count: '{count, plural, one {# item} other {# items}}',
    };
    await fs.promises.writeFile(sourceFile, JSON.stringify(initialContent, null, 2), 'utf-8');
    console.log(
      chalk.green('✓'),
      `Created ${options.dir}/${options.locale}.json with example keys`
    );
  }

  // Create output directory
  const outputDir = path.join(projectRoot, config.outputDir);
  await fs.promises.mkdir(outputDir, { recursive: true });
  console.log(chalk.green('✓'), `Created ${config.outputDir}/`);

  console.log('\n' + chalk.green('TypeGlot initialized successfully! 🎉'));
  console.log('\nNext steps:');
  console.log(chalk.cyan('  1.'), `Add translations to ${options.dir}/${options.locale}.json`);
  console.log(
    chalk.cyan('  2.'),
    'Run',
    chalk.yellow('npx typeglot build'),
    'to generate TypeScript'
  );
  console.log(
    chalk.cyan('  3.'),
    'Run',
    chalk.yellow('npx typeglot dev'),
    'to start development mode'
  );
}
