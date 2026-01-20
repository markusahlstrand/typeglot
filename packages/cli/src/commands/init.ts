import * as fs from 'node:fs';
import * as path from 'node:path';
import chalk from 'chalk';
import { select, checkbox, confirm } from '@inquirer/prompts';
import { saveConfig, DEFAULT_CONFIG } from '@typeglot/core';

interface InitOptions {
  locale: string;
  dir: string;
}

interface MonorepoPackage {
  name: string;
  path: string;
}

interface ExistingLocales {
  dir: string;
  locales: string[];
}

interface PackageJson {
  name?: string;
  workspaces?: string[] | { packages?: string[] };
}

/**
 * Search for existing locale files in common locations
 */
async function findExistingLocales(packagePath: string): Promise<ExistingLocales | null> {
  const commonPaths = [
    'locales',
    'src/locales',
    'src/i18n',
    'i18n',
    'lang',
    'src/lang',
    'translations',
    'src/translations',
  ];

  for (const relativePath of commonPaths) {
    const fullPath = path.join(packagePath, relativePath);
    if (fs.existsSync(fullPath)) {
      const locales = await findLocalesInDir(fullPath);
      if (locales.length > 0) {
        return { dir: relativePath, locales };
      }
    }
  }

  // Deep search for locale patterns (e.g., src/*/locales)
  const srcPath = path.join(packagePath, 'src');
  if (fs.existsSync(srcPath)) {
    const found = await deepSearchLocales(srcPath, packagePath);
    if (found) return found;
  }

  return null;
}

/**
 * Find locale files/directories in a given directory
 */
async function findLocalesInDir(dir: string): Promise<string[]> {
  const locales: string[] = [];
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.json')) {
      // File-based locales (en.json, es.json)
      const locale = entry.name.replace('.json', '');
      if (isValidLocaleCode(locale)) {
        locales.push(locale);
      }
    } else if (entry.isDirectory() && isValidLocaleCode(entry.name)) {
      // Directory-based locales (en/, es/)
      locales.push(entry.name);
    }
  }

  return locales;
}

/**
 * Deep search for locales in nested directories
 */
async function deepSearchLocales(
  dir: string,
  packagePath: string
): Promise<ExistingLocales | null> {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subPath = path.join(dir, entry.name);

      // Check if this directory contains locales
      if (entry.name === 'locales' || entry.name === 'i18n' || entry.name === 'lang') {
        const locales = await findLocalesInDir(subPath);
        if (locales.length > 0) {
          return {
            dir: path.relative(packagePath, subPath),
            locales,
          };
        }
      }

      // Check subdirectories (only 1 level deep to avoid slow searches)
      const nestedLocalesPath = path.join(subPath, 'locales');
      if (fs.existsSync(nestedLocalesPath)) {
        const locales = await findLocalesInDir(nestedLocalesPath);
        if (locales.length > 0) {
          return {
            dir: path.relative(packagePath, nestedLocalesPath),
            locales,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Check if a string looks like a valid locale code
 */
function isValidLocaleCode(code: string): boolean {
  // Match common locale patterns: en, en-US, en_US, zh-Hans, etc.
  return /^[a-z]{2}(-[A-Z]{2})?(_[A-Z]{2})?(-[A-Za-z]+)?$/i.test(code);
}

/**
 * Read and parse a package.json file
 */
async function readPackageJson(filePath: string): Promise<PackageJson> {
  const content = await fs.promises.readFile(filePath, 'utf-8');
  return JSON.parse(content) as PackageJson;
}

async function detectMonorepo(cwd: string): Promise<MonorepoPackage[] | null> {
  // Check for pnpm-workspace.yaml
  const pnpmWorkspace = path.join(cwd, 'pnpm-workspace.yaml');
  if (fs.existsSync(pnpmWorkspace)) {
    const packagesDir = path.join(cwd, 'packages');
    if (fs.existsSync(packagesDir)) {
      const packages: MonorepoPackage[] = [];
      const entries = await fs.promises.readdir(packagesDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pkgJsonPath = path.join(packagesDir, entry.name, 'package.json');
          if (fs.existsSync(pkgJsonPath)) {
            const pkgJson = await readPackageJson(pkgJsonPath);
            packages.push({
              name: pkgJson.name ?? entry.name,
              path: path.join(packagesDir, entry.name),
            });
          }
        }
      }
      return packages.length > 0 ? packages : null;
    }
  }

  // Check for package.json workspaces
  const pkgJsonPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    const pkgJson = await readPackageJson(pkgJsonPath);
    if (pkgJson.workspaces) {
      const workspaces = Array.isArray(pkgJson.workspaces)
        ? pkgJson.workspaces
        : (pkgJson.workspaces.packages ?? []);

      const packages: MonorepoPackage[] = [];
      for (const pattern of workspaces) {
        const glob = pattern.replace('*', '');
        const workspaceDir = path.join(cwd, glob);

        if (fs.existsSync(workspaceDir)) {
          const entries = await fs.promises.readdir(workspaceDir, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory()) {
              const pkgPath = path.join(workspaceDir, entry.name, 'package.json');
              if (fs.existsSync(pkgPath)) {
                const pkg = await readPackageJson(pkgPath);
                packages.push({
                  name: pkg.name ?? entry.name,
                  path: path.join(workspaceDir, entry.name),
                });
              }
            }
          }
        }
      }
      return packages.length > 0 ? packages : null;
    }
  }

  return null;
}

async function initializePackage(
  packagePath: string,
  locale: string,
  localesDir: string
): Promise<void> {
  // Check for existing locale files
  const existingLocales = await findExistingLocales(packagePath);

  let finalLocalesDir = localesDir;
  let finalLocale = locale;

  if (existingLocales) {
    console.log(chalk.yellow(`\n📂 Found existing locale files in ${existingLocales.dir}/`));
    console.log(chalk.dim(`   Locales: ${existingLocales.locales.join(', ')}`));

    const useExisting = await confirm({
      message: `Use existing locales directory (${existingLocales.dir})?`,
      default: true,
    });

    if (useExisting) {
      finalLocalesDir = existingLocales.dir;

      // Ask which locale is the source
      if (existingLocales.locales.length > 1) {
        finalLocale = await select<string>({
          message: 'Which locale is your source (primary) locale?',
          choices: existingLocales.locales.map((loc) => ({ name: loc, value: loc })),
          default: existingLocales.locales.includes('en') ? 'en' : existingLocales.locales[0],
        });
      } else if (existingLocales.locales[0]) {
        finalLocale = existingLocales.locales[0];
      }
    }
  }

  // Create config file
  const config = {
    ...DEFAULT_CONFIG,
    sourceLocale: finalLocale,
    localesDir: finalLocalesDir,
  };

  await saveConfig(packagePath, config);
  console.log(chalk.green('✓'), 'Created typeglot.config.json');

  // Create locales directory if it doesn't exist
  const localesDirPath = path.join(packagePath, finalLocalesDir);
  if (!fs.existsSync(localesDirPath)) {
    await fs.promises.mkdir(localesDirPath, { recursive: true });
    console.log(chalk.green('✓'), `Created ${finalLocalesDir}/`);
  }

  // Create source locale file only if directory is new
  const sourceFile = path.join(localesDirPath, `${finalLocale}.json`);
  if (!existingLocales && !fs.existsSync(sourceFile)) {
    const initialContent = {
      hello: 'Hello',
      welcome: 'Welcome, {name}!',
      items_count: '{count, plural, one {# item} other {# items}}',
    };
    await fs.promises.writeFile(sourceFile, JSON.stringify(initialContent, null, 2), 'utf-8');
    console.log(
      chalk.green('✓'),
      `Created ${finalLocalesDir}/${finalLocale}.json with example keys`
    );
  }

  // Create output directory
  const outputDir = path.join(packagePath, config.outputDir);
  await fs.promises.mkdir(outputDir, { recursive: true });
  console.log(chalk.green('✓'), `Created ${config.outputDir}/`);
}

export async function initCommand(options: InitOptions): Promise<void> {
  const projectRoot = process.cwd();

  console.log(chalk.blue('🌐 Initializing TypeGlot...\n'));

  // Detect monorepo
  const monorepoPackages = await detectMonorepo(projectRoot);

  if (monorepoPackages && monorepoPackages.length > 0) {
    console.log(chalk.yellow('📦 Detected monorepo with packages:\n'));

    const initLocation = await select<'root' | 'packages'>({
      message: 'Where would you like to initialize TypeGlot?',
      choices: [
        { name: 'Root (shared translations)', value: 'root' },
        { name: 'Specific packages', value: 'packages' },
      ],
    });

    if (initLocation === 'root') {
      await initializePackage(projectRoot, options.locale, options.dir);
      console.log('\n' + chalk.green('TypeGlot initialized at root level! 🎉'));
    } else {
      const selectedPackages = await checkbox<string>({
        message: 'Select packages to initialize:',
        choices: monorepoPackages.map((pkg) => ({
          name: pkg.name,
          value: pkg.path,
        })),
      });

      if (selectedPackages.length === 0) {
        console.log(chalk.yellow('No packages selected. Exiting.'));
        return;
      }

      for (const pkgPath of selectedPackages) {
        const pkg = monorepoPackages.find((p) => p.path === pkgPath);
        console.log(chalk.cyan(`\nInitializing ${pkg?.name}...`));
        await initializePackage(pkgPath, options.locale, options.dir);
      }

      console.log(
        '\n' +
          chalk.green(`TypeGlot initialized in ${String(selectedPackages.length)} package(s)! 🎉`)
      );
    }
  } else {
    // Single package initialization
    await initializePackage(projectRoot, options.locale, options.dir);
    console.log('\n' + chalk.green('TypeGlot initialized successfully! 🎉'));
  }

  console.log('\nNext steps:');
  console.log(
    chalk.cyan('  1.'),
    `Add translations to your ${options.dir}/${options.locale}.json file(s)`
  );
  console.log(chalk.cyan('  2.'), 'Run', chalk.yellow('typeglot build'), 'to generate TypeScript');
  console.log(chalk.cyan('  3.'), 'Run', chalk.yellow('typeglot dev'), 'to start development mode');
}
