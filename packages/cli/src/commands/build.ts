import chalk from 'chalk';
import ora from 'ora';
import { loadConfig } from '@typeglot/core';
import { TypeGlotCompiler, TranslationWatcher } from '@typeglot/compiler';

interface BuildOptions {
  watch?: boolean;
  verbose?: boolean;
}

export async function buildCommand(options: BuildOptions): Promise<void> {
  const projectRoot = process.cwd();

  console.log(chalk.blue('🌐 TypeGlot Build\n'));

  // Load config
  const spinner = ora('Loading configuration...').start();
  const config = await loadConfig(projectRoot);
  spinner.succeed('Configuration loaded');

  if (options.watch) {
    // Watch mode
    const watcher = new TranslationWatcher({
      config,
      projectRoot,
      verbose: options.verbose ?? false,
      onCompile: (results) => {
        const successCount = results.filter((r) => r.success).length;
        console.log(chalk.green(`✓ Compiled ${successCount} files`));
      },
      onError: (error) => {
        console.error(chalk.red('Error:'), error.message);
      },
    });

    await watcher.start();

    console.log(chalk.dim('\nPress Ctrl+C to stop\n'));

    process.on('SIGINT', async () => {
      console.log(chalk.yellow('\nStopping...'));
      await watcher.stop();
      process.exit(0);
    });
  } else {
    // Single build
    spinner.start('Compiling translations...');

    const compiler = new TypeGlotCompiler({
      config,
      projectRoot,
      verbose: options.verbose ?? false,
    });

    try {
      const results = await compiler.compile();
      spinner.succeed('Compilation complete');

      const successCount = results.filter((r) => r.success).length;
      const totalKeys = results.reduce((sum, r) => sum + r.keysCount, 0);

      console.log(chalk.green(`\n✓ Generated ${successCount} files with ${totalKeys} keys`));

      for (const result of results) {
        if (result.success) {
          console.log(chalk.dim(`  ${result.outputPath}`));
        } else {
          console.log(chalk.red(`  ✗ ${result.outputPath}`));
          result.errors?.forEach((e) => console.log(chalk.red(`    ${e}`)));
        }
      }
    } catch (error) {
      spinner.fail('Compilation failed');
      console.error(chalk.red('\nError:'), (error as Error).message);
      process.exit(1);
    }
  }
}
