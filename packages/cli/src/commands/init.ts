import * as fs from 'node:fs';
import * as path from 'node:path';
import chalk from 'chalk';
import { select, checkbox, confirm } from '@inquirer/prompts';
import { saveConfig, DEFAULT_CONFIG, InterpolationSyntax, LocaleFilePattern } from '@typeglot/core';
import { parse as parseYaml } from 'yaml';
import { glob } from 'glob';

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
  filePattern: LocaleFilePattern;
  namespaces?: string[];
}

interface PackageJson {
  name?: string;
  workspaces?: string[] | { packages?: string[] };
}

interface PnpmWorkspace {
  packages?: string[];
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
      const result = await findLocalesInDir(fullPath);
      if (result && result.locales.length > 0) {
        return {
          dir: relativePath,
          locales: result.locales,
          filePattern: result.filePattern,
          namespaces: result.namespaces,
        };
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

interface LocaleDetectionResult {
  locales: string[];
  filePattern: LocaleFilePattern;
  namespaces?: string[];
}

/**
 * Find locale files/directories in a given directory and detect the pattern
 */
async function findLocalesInDir(dir: string): Promise<LocaleDetectionResult | null> {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });

  const fileLocales: string[] = [];
  const dirLocales: string[] = [];
  const namespaces = new Set<string>();

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.json')) {
      // File-based locales (en.json, es.json)
      const locale = entry.name.replace('.json', '');
      if (isValidLocaleCode(locale)) {
        fileLocales.push(locale);
      }
    } else if (entry.isDirectory() && isValidLocaleCode(entry.name)) {
      // Directory-based locales (en/, es/) - check for namespace files inside
      dirLocales.push(entry.name);

      // Find namespaces (JSON files inside locale directory)
      const localeDir = path.join(dir, entry.name);
      try {
        const localeEntries = await fs.promises.readdir(localeDir, { withFileTypes: true });
        for (const localeEntry of localeEntries) {
          if (localeEntry.isFile() && localeEntry.name.endsWith('.json')) {
            namespaces.add(localeEntry.name.replace('.json', ''));
          }
        }
      } catch {
        // Ignore read errors
      }
    }
  }

  // Prefer namespace format if we found locale directories with JSON files inside
  if (dirLocales.length > 0 && namespaces.size > 0) {
    return {
      locales: dirLocales,
      filePattern: '{locale}/{namespace}.json',
      namespaces: Array.from(namespaces),
    };
  }

  // Fall back to flat format if we found locale JSON files
  if (fileLocales.length > 0) {
    return {
      locales: fileLocales,
      filePattern: '{locale}.json',
    };
  }

  // Also accept directory-based locales without files yet
  if (dirLocales.length > 0) {
    return {
      locales: dirLocales,
      filePattern: '{locale}/{namespace}.json',
      namespaces: ['default'],
    };
  }

  return null;
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
        const result = await findLocalesInDir(subPath);
        if (result && result.locales.length > 0) {
          return {
            dir: path.relative(packagePath, subPath),
            locales: result.locales,
            filePattern: result.filePattern,
            namespaces: result.namespaces,
          };
        }
      }

      // Check subdirectories (only 1 level deep to avoid slow searches)
      const nestedLocalesPath = path.join(subPath, 'locales');
      if (fs.existsSync(nestedLocalesPath)) {
        const result = await findLocalesInDir(nestedLocalesPath);
        if (result && result.locales.length > 0) {
          return {
            dir: path.relative(packagePath, nestedLocalesPath),
            locales: result.locales,
            filePattern: result.filePattern,
            namespaces: result.namespaces,
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
 * Detect interpolation syntax from existing translation files
 * Returns 'double' if {{var}} pattern is found, otherwise 'single'
 */
async function detectInterpolationSyntax(
  localesDir: string,
  filePattern: LocaleFilePattern
): Promise<InterpolationSyntax> {
  try {
    const entries = await fs.promises.readdir(localesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.json')) {
        // Flat format: en.json directly in localesDir
        const filePath = path.join(localesDir, entry.name);
        const content = await fs.promises.readFile(filePath, 'utf-8');

        // Check for double brace pattern {{variable}} (i18next style)
        if (/\{\{[a-zA-Z_]\w*\}\}/.test(content)) {
          return 'double';
        }
      } else if (
        entry.isDirectory() &&
        filePattern === '{locale}/{namespace}.json' &&
        isValidLocaleCode(entry.name)
      ) {
        // Namespace format: check files inside locale directory
        const localeDir = path.join(localesDir, entry.name);
        const localeEntries = await fs.promises.readdir(localeDir, { withFileTypes: true });

        for (const localeEntry of localeEntries) {
          if (localeEntry.isFile() && localeEntry.name.endsWith('.json')) {
            const filePath = path.join(localeDir, localeEntry.name);
            const content = await fs.promises.readFile(filePath, 'utf-8');

            if (/\{\{[a-zA-Z_]\w*\}\}/.test(content)) {
              return 'double';
            }
          }
        }
      }
    }
  } catch {
    // Ignore errors, default to single
  }

  return 'single';
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
  const pnpmWorkspacePath = path.join(cwd, 'pnpm-workspace.yaml');
  if (fs.existsSync(pnpmWorkspacePath)) {
    const packages = await detectPnpmWorkspaces(cwd, pnpmWorkspacePath);
    if (packages && packages.length > 0) {
      return packages;
    }
  }

  // Check for package.json workspaces (npm/yarn workspaces)
  const pkgJsonPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    const pkgJson = await readPackageJson(pkgJsonPath);
    if (pkgJson.workspaces) {
      const workspaces = Array.isArray(pkgJson.workspaces)
        ? pkgJson.workspaces
        : (pkgJson.workspaces.packages ?? []);

      const packages = await findPackagesFromPatterns(cwd, workspaces);
      if (packages.length > 0) {
        return packages;
      }
    }
  }

  return null;
}

/**
 * Detect packages from pnpm-workspace.yaml configuration
 */
async function detectPnpmWorkspaces(
  cwd: string,
  workspacePath: string
): Promise<MonorepoPackage[] | null> {
  try {
    const content = await fs.promises.readFile(workspacePath, 'utf-8');
    const config = parseYaml(content) as PnpmWorkspace;

    if (!config.packages || config.packages.length === 0) {
      // Fallback to default pnpm patterns if packages not specified
      return findPackagesFromPatterns(cwd, ['packages/*']);
    }

    return findPackagesFromPatterns(cwd, config.packages);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(chalk.yellow(`Warning: Could not parse pnpm-workspace.yaml: ${message}`));
    return null;
  }
}

/**
 * Find packages matching glob patterns
 */
async function findPackagesFromPatterns(
  cwd: string,
  patterns: string[]
): Promise<MonorepoPackage[]> {
  const packages: MonorepoPackage[] = [];
  const seenPaths = new Set<string>();

  // Filter out negation patterns and handle them separately
  const includePatterns = patterns.filter((p) => !p.startsWith('!'));
  const excludePatterns = patterns.filter((p) => p.startsWith('!')).map((p) => p.slice(1)); // Remove the ! prefix

  for (const pattern of includePatterns) {
    // Glob patterns in workspace configs point to directories containing package.json
    const matches = await glob(pattern, {
      cwd,
      ignore: ['**/node_modules/**', ...excludePatterns],
      absolute: true,
    });

    for (const match of matches) {
      // Skip if we've already processed this path
      if (seenPaths.has(match)) continue;
      seenPaths.add(match);

      const pkgJsonPath = path.join(match, 'package.json');
      if (fs.existsSync(pkgJsonPath)) {
        try {
          const pkgJson = await readPackageJson(pkgJsonPath);
          packages.push({
            name: pkgJson.name ?? path.basename(match),
            path: match,
          });
        } catch {
          // Skip packages with invalid package.json
        }
      }
    }
  }

  return packages;
}

interface InitResult {
  localesDir: string;
  sourceLocale: string;
  interpolation: InterpolationSyntax;
  filePattern: LocaleFilePattern;
  namespaces?: string[];
}

async function initializePackage(
  packagePath: string,
  locale: string,
  localesDir: string
): Promise<InitResult> {
  // Check for existing locale files
  const existingLocales = await findExistingLocales(packagePath);

  let finalLocalesDir = localesDir;
  let finalLocale = locale;
  let interpolation: InterpolationSyntax = 'single';
  let filePattern: LocaleFilePattern = '{locale}.json';
  let namespaces: string[] | undefined;

  if (existingLocales) {
    console.log(chalk.yellow(`\n📂 Found existing locale files in ${existingLocales.dir}/`));
    console.log(chalk.dim(`   Locales: ${existingLocales.locales.join(', ')}`));
    console.log(chalk.dim(`   Format: ${existingLocales.filePattern}`));
    if (existingLocales.namespaces && existingLocales.namespaces.length > 0) {
      console.log(chalk.dim(`   Namespaces: ${existingLocales.namespaces.join(', ')}`));
    }

    const useExisting = await confirm({
      message: `Use existing locales directory (${existingLocales.dir})?`,
      default: true,
    });

    if (useExisting) {
      finalLocalesDir = existingLocales.dir;
      filePattern = existingLocales.filePattern;
      namespaces = existingLocales.namespaces;

      // Detect interpolation syntax from existing files
      const fullLocalesPath = path.join(packagePath, finalLocalesDir);
      interpolation = await detectInterpolationSyntax(fullLocalesPath, filePattern);

      if (interpolation === 'double') {
        console.log(
          chalk.cyan('   Detected'),
          chalk.bold('{{variable}}'),
          chalk.cyan('interpolation syntax (i18next/Handlebars style)')
        );
      }

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
    interpolation,
    filePattern,
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
  if (!existingLocales) {
    // Determine the file path based on pattern
    let sourceFile: string;
    if (filePattern === '{locale}/{namespace}.json') {
      // Namespace format: create locale directory and default.json
      const localePath = path.join(localesDirPath, finalLocale);
      await fs.promises.mkdir(localePath, { recursive: true });
      sourceFile = path.join(localePath, 'default.json');
    } else {
      // Flat format: create locale.json
      sourceFile = path.join(localesDirPath, `${finalLocale}.json`);
    }

    if (!fs.existsSync(sourceFile)) {
      // Use interpolation syntax matching the config
      const initialContent =
        interpolation === 'double'
          ? {
              hello: 'Hello',
              welcome: 'Welcome, {{name}}!',
              items_count: '{{count}} items',
            }
          : {
              hello: 'Hello',
              welcome: 'Welcome, {name}!',
              items_count: '{count, plural, one {# item} other {# items}}',
            };
      await fs.promises.writeFile(sourceFile, JSON.stringify(initialContent, null, 2), 'utf-8');
      const relativePath = path.relative(packagePath, sourceFile);
      console.log(chalk.green('✓'), `Created ${relativePath} with example keys`);
    }
  }

  // Create output directory
  const outputDir = path.join(packagePath, config.outputDir);
  await fs.promises.mkdir(outputDir, { recursive: true });
  console.log(chalk.green('✓'), `Created ${config.outputDir}/`);

  return {
    localesDir: finalLocalesDir,
    sourceLocale: finalLocale,
    interpolation,
    filePattern,
    namespaces,
  };
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
      const result = await initializePackage(projectRoot, options.locale, options.dir);
      console.log('\n' + chalk.green('TypeGlot initialized at root level! 🎉'));
      showNextSteps(result.localesDir, result.sourceLocale);
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
      // For multiple packages, show generic guidance since each may have different settings
      showNextSteps(options.dir, options.locale, true);
    }
  } else {
    // Single package initialization
    const result = await initializePackage(projectRoot, options.locale, options.dir);
    console.log('\n' + chalk.green('TypeGlot initialized successfully! 🎉'));
    showNextSteps(result.localesDir, result.sourceLocale);
  }
}

/**
 * Display next steps after initialization
 */
function showNextSteps(localesDir: string, sourceLocale: string, isMultiPackage = false): void {
  console.log('\nNext steps:');
  if (isMultiPackage) {
    console.log(chalk.cyan('  1.'), 'Add translations to your locale JSON files in each package');
  } else {
    console.log(
      chalk.cyan('  1.'),
      `Add translations to your ${localesDir}/${sourceLocale}.json file`
    );
  }
  console.log(
    chalk.cyan('  2.'),
    'Run',
    chalk.yellow('npx @typeglot/cli build'),
    'to generate TypeScript'
  );
  console.log(
    chalk.cyan('  3.'),
    'Run',
    chalk.yellow('npx @typeglot/cli dev'),
    'to start development mode'
  );
}
