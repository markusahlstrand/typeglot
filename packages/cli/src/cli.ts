#!/usr/bin/env node
import { program } from 'commander';
import { initCommand } from './commands/init.js';
import { devCommand } from './commands/dev.js';
import { translateCommand } from './commands/translate.js';
import { buildCommand } from './commands/build.js';

program.name('typeglot').description('Developer-first, Git-native i18n toolchain').version('0.1.0');

program
  .command('init')
  .description('Initialize TypeGlot in your project')
  .option('-l, --locale <locale>', 'Source locale', 'en')
  .option('-d, --dir <directory>', 'Locales directory', './locales')
  .action(initCommand);

program
  .command('dev')
  .description('Start development mode with file watching and local UI')
  .option('-p, --port <port>', 'Port for the development UI', '3333')
  .option('--no-ui', 'Disable the development UI')
  .option('--project <name>', 'Specify which project to watch (for monorepos)')
  .action(devCommand);

program
  .command('ui')
  .description('Start the translation management UI (alias for dev)')
  .option('-p, --port <port>', 'Port for the UI', '3333')
  .action(devCommand);

program
  .command('build')
  .description('Compile translation files to TypeScript')
  .option('-w, --watch', 'Watch for changes')
  .option('-v, --verbose', 'Verbose output')
  .action(buildCommand);

program
  .command('translate')
  .description('Generate translations for missing keys using AI')
  .option('-t, --target <locales...>', 'Target locales to translate')
  .option('-k, --key <key>', 'Translate a specific key')
  .option('--dry-run', 'Show what would be translated without making changes')
  .action(translateCommand);

program.parse();
