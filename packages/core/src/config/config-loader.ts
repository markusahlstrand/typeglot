import * as fs from 'node:fs';
import * as path from 'node:path';
import { TypeGlotConfig, TypeGlotConfigSchema } from '../types.js';
import { DEFAULT_CONFIG } from './defaults.js';

const CONFIG_FILE_NAMES = ['typeglot.config.json', 'typeglot.config.js', '.typeglotrc'];

/**
 * Load TypeGlot configuration from the project root
 */
export async function loadConfig(projectRoot: string): Promise<TypeGlotConfig> {
  for (const fileName of CONFIG_FILE_NAMES) {
    const configPath = path.join(projectRoot, fileName);

    if (fs.existsSync(configPath)) {
      const content = await fs.promises.readFile(configPath, 'utf-8');
      const rawConfig = JSON.parse(content) as unknown;
      return TypeGlotConfigSchema.parse(rawConfig);
    }
  }

  // Return default config if no config file found
  return DEFAULT_CONFIG;
}

/**
 * Save TypeGlot configuration to file
 */
export async function saveConfig(
  projectRoot: string,
  config: TypeGlotConfig,
  fileName = 'typeglot.config.json'
): Promise<void> {
  const configPath = path.join(projectRoot, fileName);
  await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Validate a configuration object
 */
export function validateConfig(config: unknown): TypeGlotConfig {
  return TypeGlotConfigSchema.parse(config);
}
