import * as fs from 'node:fs';

export type ParsedTranslations = Record<string, string>;

/**
 * Parse a JSON translation file
 */
export async function parseTranslationFile(filePath: string): Promise<ParsedTranslations> {
  const content = await fs.promises.readFile(filePath, 'utf-8');
  const data = JSON.parse(content) as unknown;

  if (typeof data !== 'object' || data === null) {
    throw new Error(`Invalid translation file: ${filePath}`);
  }

  // Flatten nested objects into dot-notation keys
  return flattenTranslations(data as Record<string, unknown>);
}

/**
 * Flatten nested translation objects
 */
function flattenTranslations(obj: Record<string, unknown>, prefix = ''): ParsedTranslations {
  const result: ParsedTranslations = {};

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      result[fullKey] = value;
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenTranslations(value as Record<string, unknown>, fullKey));
    }
  }

  return result;
}

/**
 * Parse a translation value for parameters
 */
export function parseParameters(value: string): string[] {
  const params: string[] = [];
  const regex = /\{(\w+)\}/g;

  let match;
  while ((match = regex.exec(value)) !== null) {
    const paramName = match[1]!;
    if (!params.includes(paramName)) {
      params.push(paramName);
    }
  }

  return params;
}
