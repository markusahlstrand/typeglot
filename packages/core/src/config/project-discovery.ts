import * as fs from 'node:fs';
import * as path from 'node:path';
import { glob } from 'glob';
import { TypeGlotConfig, TypeGlotConfigSchema } from '../types.js';

const CONFIG_FILE_NAMES = ['typeglot.config.json', 'typeglot.config.js', '.typeglotrc'];

export interface DiscoveredProject {
  /** Unique identifier for the project (relative path from workspace root) */
  id: string;
  /** Display name for the project */
  name: string;
  /** Absolute path to the project root */
  path: string;
  /** Path to the config file */
  configPath: string;
  /** Loaded configuration */
  config: TypeGlotConfig;
}

/**
 * Discover all TypeGlot projects in a workspace (monorepo support)
 * Searches for typeglot.config.json files recursively
 */
export async function discoverProjects(workspaceRoot: string): Promise<DiscoveredProject[]> {
  const projects: DiscoveredProject[] = [];

  // Search for config files recursively, excluding common directories
  const patterns = CONFIG_FILE_NAMES.map((name) => `**/${name}`);

  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      cwd: workspaceRoot,
      ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**', '**/coverage/**'],
      absolute: true,
    });

    for (const configPath of matches) {
      try {
        const content = await fs.promises.readFile(configPath, 'utf-8');
        const rawConfig = JSON.parse(content) as unknown;
        const config = TypeGlotConfigSchema.parse(rawConfig);

        const projectPath = path.dirname(configPath);
        const relativePath = path.relative(workspaceRoot, projectPath);
        const id = relativePath || 'root';

        // Generate a friendly name from the path
        const name = generateProjectName(workspaceRoot, projectPath);

        projects.push({
          id,
          name,
          path: projectPath,
          configPath,
          config,
        });
      } catch (error) {
        // Skip invalid config files
        console.warn(`Warning: Invalid config at ${configPath}:`, error);
      }
    }
  }

  // Sort by path depth (root projects first)
  projects.sort((a, b) => a.id.split('/').length - b.id.split('/').length);

  return projects;
}

/**
 * Generate a friendly project name from its path
 */
function generateProjectName(workspaceRoot: string, projectPath: string): string {
  if (projectPath === workspaceRoot) {
    // Try to get name from package.json
    const pkgPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { name?: string };
        if (pkg.name) {
          return pkg.name;
        }
      } catch {
        // Ignore
      }
    }
    return 'Root Project';
  }

  const relativePath = path.relative(workspaceRoot, projectPath);
  const parts = relativePath.split(path.sep);

  // Try to get name from package.json in project dir
  const pkgPath = path.join(projectPath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { name?: string };
      if (pkg.name) {
        return pkg.name;
      }
    } catch {
      // Ignore
    }
  }

  // Use the last path segment, capitalized
  const lastPart = parts[parts.length - 1];
  if (!lastPart) {
    return 'Project';
  }
  return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
}

/**
 * Find a specific project by ID
 */
export async function findProject(
  workspaceRoot: string,
  projectId: string
): Promise<DiscoveredProject | null> {
  const projects = await discoverProjects(workspaceRoot);
  return projects.find((p) => p.id === projectId) || null;
}

/**
 * Get the default project (first found, usually root)
 */
export async function getDefaultProject(workspaceRoot: string): Promise<DiscoveredProject | null> {
  const projects = await discoverProjects(workspaceRoot);
  return projects[0] || null;
}
