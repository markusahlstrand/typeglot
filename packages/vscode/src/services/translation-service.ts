import * as vscode from 'vscode';
import {
  buildTranslationPrompt,
  TranslationMessage,
  TranslationRequest,
  JSDocContext,
} from '@typeglot/core';

/**
 * Translation service using VS Code's Language Model API (Copilot)
 * or external providers (OpenAI, Anthropic)
 */
export class TranslationService {
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('TypeGlot AI');
  }

  /**
   * Translate a single key to multiple target locales
   */
  async translateKey(
    key: string,
    sourceValue: string,
    sourceLocale: string,
    targetLocales: string[],
    jsDocContext?: JSDocContext
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    const config = vscode.workspace.getConfiguration('typeglot');
    const provider = config.get<string>('aiProvider', 'copilot');

    this.outputChannel.appendLine(`\n[${new Date().toISOString()}] Translating "${key}"`);
    this.outputChannel.appendLine(`Source (${sourceLocale}): ${sourceValue}`);
    this.outputChannel.appendLine(`Targets: ${targetLocales.join(', ')}`);
    if (jsDocContext) {
      this.outputChannel.appendLine(`JSDoc context: ${JSON.stringify(jsDocContext)}`);
    }

    for (const targetLocale of targetLocales) {
      try {
        const translation = await this.translateSingle(
          key,
          sourceValue,
          sourceLocale,
          targetLocale,
          jsDocContext,
          provider
        );
        results.set(targetLocale, translation);
        this.outputChannel.appendLine(`✓ ${targetLocale}: ${translation}`);
      } catch (error) {
        this.outputChannel.appendLine(`✗ ${targetLocale}: ${error}`);
        throw error;
      }
    }

    return results;
  }

  /**
   * Translate to a single target locale
   */
  private async translateSingle(
    key: string,
    sourceValue: string,
    sourceLocale: string,
    targetLocale: string,
    jsDocContext?: JSDocContext,
    provider = 'copilot'
  ): Promise<string> {
    const message: TranslationMessage = {
      key,
      value: sourceValue,
      params: this.extractParams(sourceValue),
    };

    const request: TranslationRequest = {
      sourceLocale,
      targetLocale,
      message,
      jsDocContext,
    };

    if (provider === 'copilot') {
      return this.translateWithCopilot(request);
    } else {
      // For other providers, we could implement API calls
      // For now, fall back to Copilot
      return this.translateWithCopilot(request);
    }
  }

  /**
   * Use VS Code's built-in Language Model API (GitHub Copilot)
   */
  private async translateWithCopilot(request: TranslationRequest): Promise<string> {
    const prompt = buildTranslationPrompt(request);

    // Check if Language Model API is available
    const models = await vscode.lm.selectChatModels({
      vendor: 'copilot',
    });

    if (models.length === 0) {
      throw new Error(
        'No Copilot language model available. Make sure GitHub Copilot is installed and active.'
      );
    }

    const model = models[0];
    const messages = [vscode.LanguageModelChatMessage.User(prompt)];

    try {
      const response = await model.sendRequest(
        messages,
        {},
        new vscode.CancellationTokenSource().token
      );

      let result = '';
      for await (const chunk of response.text) {
        result += chunk;
      }

      // Clean up the response - remove any markdown formatting or explanations
      return this.cleanTranslationResponse(result);
    } catch (error) {
      if (error instanceof vscode.LanguageModelError) {
        if (error.code === vscode.LanguageModelError.NoPermissions.name) {
          throw new Error('Permission denied. Please allow TypeGlot to access Copilot.');
        }
        if (error.code === vscode.LanguageModelError.Blocked.name) {
          throw new Error('Request blocked by content filter.');
        }
      }
      throw error;
    }
  }

  /**
   * Extract parameters from a translation value
   */
  private extractParams(value: string): { name: string; type: 'string' | 'number' | 'date' }[] {
    const params: { name: string; type: 'string' | 'number' | 'date' }[] = [];
    const regex = /\{(\w+)(?:,\s*(\w+))?\}/g;

    let match;
    while ((match = regex.exec(value)) !== null) {
      const name = match[1]!;
      const typeHint = match[2];
      let type: 'string' | 'number' | 'date' = 'string';

      if (typeHint === 'number' || typeHint === 'plural') {
        type = 'number';
      } else if (typeHint === 'date' || typeHint === 'time') {
        type = 'date';
      }

      if (!params.some((p) => p.name === name)) {
        params.push({ name, type });
      }
    }

    return params;
  }

  /**
   * Clean up AI response to extract just the translation
   */
  private cleanTranslationResponse(response: string): string {
    let cleaned = response.trim();

    // Remove markdown code blocks
    cleaned = cleaned.replace(/^```[\w]*\n?/gm, '').replace(/\n?```$/gm, '');

    // Remove quotes if the entire response is quoted
    if (
      (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))
    ) {
      cleaned = cleaned.slice(1, -1);
    }

    // Remove any "Translation:" prefix
    cleaned = cleaned.replace(/^(Translation|Result|Output):\s*/i, '');

    return cleaned.trim();
  }

  /**
   * Show the output channel for debugging
   */
  showOutput(): void {
    this.outputChannel.show();
  }

  dispose(): void {
    this.outputChannel.dispose();
  }
}
