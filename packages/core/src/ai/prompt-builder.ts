import { TranslationRequest, InterpolationSyntax } from '../types.js';

export type { InterpolationSyntax };

/**
 * Build a prompt for AI translation with full context
 */
export function buildTranslationPrompt(request: TranslationRequest): string {
  const { sourceLocale, targetLocale, message, jsDocContext, fileContext } = request;

  const lines: string[] = [
    `Translate the following text from ${sourceLocale} to ${targetLocale}.`,
    '',
  ];

  // Add JSDoc context if available
  if (jsDocContext) {
    lines.push('## Context from Developer');
    if (jsDocContext.description) {
      lines.push(`Description: ${jsDocContext.description}`);
    }
    if (jsDocContext.context) {
      lines.push(`Usage Context: ${jsDocContext.context}`);
    }
    if (jsDocContext.example) {
      lines.push(`Example: ${jsDocContext.example}`);
    }
    if (jsDocContext.maxLength) {
      lines.push(`Maximum Length: ${jsDocContext.maxLength} characters`);
    }
    lines.push('');
  }

  // Add file context if available
  if (fileContext) {
    lines.push('## File Context');
    lines.push(fileContext);
    lines.push('');
  }

  // Add the text to translate
  lines.push('## Text to Translate');
  lines.push(`Key: ${message.key}`);
  lines.push(`Source (${sourceLocale}): ${message.value}`);

  // Add parameter information
  if (message.params && message.params.length > 0) {
    lines.push('');
    lines.push('## Parameters');
    lines.push('The following parameters must be preserved in the translation:');
    for (const param of message.params) {
      lines.push(`- {${param.name}} (${param.type})`);
    }
  }

  // Add instructions
  lines.push('');
  lines.push('## Instructions');
  lines.push('1. Preserve all parameter placeholders like {name} exactly as they appear');
  lines.push('2. Maintain the same tone and formality level');
  lines.push('3. Keep any HTML/Markdown formatting intact');
  lines.push('4. Return ONLY the translated text, no explanations');

  return lines.join('\n');
}

/**
 * Parse parameters from a translation message value
 * @param value - The translation message value
 * @param interpolation - The interpolation syntax ('single' for {var}, 'double' for {{var}})
 */
export function parseMessageParams(
  value: string,
  interpolation: InterpolationSyntax = 'single'
): { name: string; type: 'string' | 'number' }[] {
  const params: { name: string; type: 'string' | 'number' }[] = [];

  // Choose regex based on interpolation style
  // Single: {name} or {count, number}
  // Double: {{name}} or {{count, number}}
  const regex =
    interpolation === 'double' ? /\{\{(\w+)(?:,\s*(\w+))?\}\}/g : /\{(\w+)(?:,\s*(\w+))?\}/g;

  let match;
  while ((match = regex.exec(value)) !== null) {
    const name = match[1]!;
    const type = match[2] === 'number' ? 'number' : 'string';

    // Avoid duplicates
    if (!params.some((p) => p.name === name)) {
      params.push({ name, type });
    }
  }

  return params;
}
