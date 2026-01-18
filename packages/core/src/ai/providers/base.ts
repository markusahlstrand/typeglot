import { TranslationRequest, TranslationResult } from '../../types.js';
import { buildTranslationPrompt } from '../prompt-builder.js';

/**
 * Base interface for AI translation providers
 */
export interface TranslationProvider {
  name: string;
  translate(request: TranslationRequest): Promise<TranslationResult>;
  translateBatch(requests: TranslationRequest[]): Promise<TranslationResult[]>;
}

/**
 * Abstract base class for translation providers
 */
export abstract class BaseTranslationProvider implements TranslationProvider {
  abstract name: string;

  /**
   * Translate a single message
   */
  abstract translate(request: TranslationRequest): Promise<TranslationResult>;

  /**
   * Translate multiple messages (default implementation calls translate sequentially)
   */
  async translateBatch(requests: TranslationRequest[]): Promise<TranslationResult[]> {
    const results: TranslationResult[] = [];

    for (const request of requests) {
      const result = await this.translate(request);
      results.push(result);
    }

    return results;
  }

  /**
   * Build the prompt for translation
   */
  protected buildPrompt(request: TranslationRequest): string {
    return buildTranslationPrompt(request);
  }
}

/**
 * Mock provider for testing
 */
export class MockTranslationProvider extends BaseTranslationProvider {
  name = 'mock';

  async translate(request: TranslationRequest): Promise<TranslationResult> {
    // Return a simple mock translation for testing
    return {
      key: request.message.key,
      sourceValue: request.message.value,
      translatedValue: `[${request.targetLocale}] ${request.message.value}`,
      confidence: 1.0,
      notes: 'Mock translation for testing',
    };
  }
}
