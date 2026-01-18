import chalk from 'chalk';
import ora from 'ora';
import { discoverProjects, type DiscoveredProject } from '@typeglot/core';
import { TranslationWatcher } from '@typeglot/compiler';
import { ApiServer } from '../server/api-server.js';

interface DevOptions {
  port: string;
  ui: boolean;
  project?: string;
}

export async function devCommand(options: DevOptions): Promise<void> {
  const workspaceRoot = process.cwd();

  console.log(chalk.blue('🌐 Starting TypeGlot development mode...\n'));

  // Discover projects in the workspace
  const spinner = ora('Discovering projects...').start();
  const projects = await discoverProjects(workspaceRoot);

  if (projects.length === 0) {
    spinner.fail('No TypeGlot projects found');
    console.log(chalk.yellow('\nRun `typeglot init` to create a new project.\n'));
    return;
  }

  spinner.succeed(`Found ${projects.length} project${projects.length > 1 ? 's' : ''}`);

  // List discovered projects
  console.log(chalk.dim('\nProjects:'));
  for (const project of projects) {
    const isRoot = project.id === 'root';
    console.log(
      chalk.dim('  • ') +
        chalk.white(project.name) +
        chalk.dim(` (${isRoot ? './' : project.id})`) +
        chalk.dim(
          ` - ${project.config.sourceLocale} → ${project.config.targetLocales.join(', ') || 'none'}`
        )
    );
  }
  console.log('');

  // Determine which project to use for the watcher (we know projects.length > 0 from above)
  let activeProject: DiscoveredProject = projects[0]!;
  if (options.project) {
    const found = projects.find((p) => p.id === options.project || p.name === options.project);
    if (found) {
      activeProject = found;
    } else {
      console.log(
        chalk.yellow(`Project "${options.project}" not found, using ${activeProject.name}`)
      );
    }
  }

  // Load config for active project
  const configSpinner = ora(`Loading configuration for ${activeProject.name}...`).start();
  const config = activeProject.config;
  configSpinner.succeed('Configuration loaded');

  // Start the compiler in watch mode
  const watcher = new TranslationWatcher({
    config,
    projectRoot: activeProject.path,
    verbose: true,
    onCompile: (results) => {
      const successCount = results.filter((r) => r.success).length;
      console.log(chalk.green(`✓ [${activeProject.name}] Compiled ${successCount} files`));
    },
    onError: (error) => {
      console.error(chalk.red('Error:'), error.message);
    },
  });

  await watcher.start();

  // Start the API server
  const apiPort = parseInt(options.port) + 1; // API on port+1 (e.g., 3334 if UI on 3333)
  const apiServer = new ApiServer({
    port: apiPort,
    workspaceRoot,
  });

  await apiServer.start();
  console.log(chalk.cyan(`\n🔌 API server running at http://localhost:${apiPort}`));

  // Start the UI server if enabled
  if (options.ui) {
    console.log(chalk.cyan(`📊 Development UI available at http://localhost:${options.port}`));
    console.log(chalk.dim(`   API endpoint: http://localhost:${apiPort}`));
    console.log(chalk.dim('   (Start UI with: cd packages/ui && pnpm dev)'));
  }

  console.log(chalk.dim('\nPress Ctrl+C to stop\n'));

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log(chalk.yellow('\nShutting down...'));
    await watcher.stop();
    await apiServer.stop();
    process.exit(0);
  });
}
