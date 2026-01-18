/**
 * API client for communicating with the TypeGlot dev server
 */

// In development, Vite proxies /api to the dev server
// In production or when running standalone, use the full URL
const API_BASE = import.meta.env['VITE_API_URL'] || '';

export interface Project {
  id: string;
  name: string;
  path: string;
  sourceLocale: string;
  targetLocales: string[];
}

export interface TranslationEntry {
  key: string;
  values: Record<string, string>;
}

export interface Stats {
  totalKeys: number;
  languages: number;
  missing: number;
}

export interface TypeGlotConfig {
  sourceLocale: string;
  targetLocales: string[];
  localesDir: string;
  outputDir: string;
  include: string[];
  exclude: string[];
  ai?: {
    provider: 'openai' | 'anthropic' | 'copilot';
    model?: string;
    apiKey?: string;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get all discovered projects in the workspace
   */
  async getProjects(): Promise<Project[]> {
    return this.fetch<Project[]>('/api/projects');
  }

  /**
   * Get the currently selected project
   */
  async getCurrentProject(): Promise<Project> {
    return this.fetch<Project>('/api/projects/current');
  }

  /**
   * Set the current project
   */
  async setCurrentProject(projectId: string): Promise<Project> {
    return this.fetch<Project>('/api/projects/current', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    });
  }

  /**
   * Get all translations for the current project
   */
  async getTranslations(): Promise<TranslationEntry[]> {
    return this.fetch<TranslationEntry[]>('/api/translations');
  }

  /**
   * Save a translation for a specific key and locale
   */
  async saveTranslation(key: string, locale: string, value: string): Promise<void> {
    await this.fetch<{ success: boolean }>('/api/translations', {
      method: 'POST',
      body: JSON.stringify({ key, locale, value }),
    });
  }

  /**
   * Get statistics for the current project
   */
  async getStats(): Promise<Stats> {
    return this.fetch<Stats>('/api/stats');
  }

  /**
   * Get configuration for the current project
   */
  async getConfig(): Promise<TypeGlotConfig> {
    return this.fetch<TypeGlotConfig>('/api/config');
  }
}

export const api = new ApiClient();
