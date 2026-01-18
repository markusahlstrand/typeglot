import * as http from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { discoverProjects, DiscoveredProject, loadConfig } from '@typeglot/core';

export interface ApiServerOptions {
  port: number;
  workspaceRoot: string;
}

export interface TranslationData {
  key: string;
  values: Record<string, string>;
}

/**
 * Simple API server for the TypeGlot UI
 */
export class ApiServer {
  private server: http.Server | null = null;
  private port: number;
  private workspaceRoot: string;
  private currentProjectId: string | null = null;

  constructor(options: ApiServerOptions) {
    this.port = options.port;
    this.workspaceRoot = options.workspaceRoot;
  }

  async start(): Promise<void> {
    this.server = http.createServer(async (req, res) => {
      // Enable CORS for local development
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      try {
        await this.handleRequest(req, res);
      } catch (error) {
        console.error('API Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });

    return new Promise((resolve) => {
      this.server!.listen(this.port, () => {
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const url = new URL(req.url || '/', `http://localhost:${this.port}`);
    const pathname = url.pathname;

    // API routes
    if (pathname === '/api/projects' && req.method === 'GET') {
      return this.getProjects(res);
    }

    if (pathname === '/api/projects/current' && req.method === 'GET') {
      return this.getCurrentProject(res);
    }

    if (pathname === '/api/projects/current' && req.method === 'POST') {
      return this.setCurrentProject(req, res);
    }

    if (pathname === '/api/translations' && req.method === 'GET') {
      return this.getTranslations(res);
    }

    if (pathname === '/api/translations' && req.method === 'POST') {
      return this.saveTranslation(req, res);
    }

    if (pathname === '/api/stats' && req.method === 'GET') {
      return this.getStats(res);
    }

    if (pathname === '/api/config' && req.method === 'GET') {
      return this.getConfig(res);
    }

    // 404 for unknown routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }

  private async getProjects(res: http.ServerResponse): Promise<void> {
    const projects = await discoverProjects(this.workspaceRoot);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify(
        projects.map((p) => ({
          id: p.id,
          name: p.name,
          path: p.path,
          sourceLocale: p.config.sourceLocale,
          targetLocales: p.config.targetLocales,
        }))
      )
    );
  }

  private async getCurrentProject(res: http.ServerResponse): Promise<void> {
    const projects = await discoverProjects(this.workspaceRoot);

    if (projects.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No projects found' }));
      return;
    }

    // Use current project or default to first (we know projects.length > 0 from check above)
    const projectId = this.currentProjectId || projects[0]!.id;
    const project = projects.find((p) => p.id === projectId) ?? projects[0]!;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        id: project.id,
        name: project.name,
        path: project.path,
        sourceLocale: project.config.sourceLocale,
        targetLocales: project.config.targetLocales,
      })
    );
  }

  private async setCurrentProject(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    const body = await this.parseBody(req);
    const { projectId } = body;

    const projects = await discoverProjects(this.workspaceRoot);
    const project = projects.find((p) => p.id === projectId);

    if (!project) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Project not found' }));
      return;
    }

    this.currentProjectId = projectId as string;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        id: project.id,
        name: project.name,
        path: project.path,
        sourceLocale: project.config.sourceLocale,
        targetLocales: project.config.targetLocales,
      })
    );
  }

  private async getTranslations(res: http.ServerResponse): Promise<void> {
    const project = await this.getCurrentProjectData();

    if (!project) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No project selected' }));
      return;
    }

    const translations = await this.loadAllTranslations(project);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(translations));
  }

  private async saveTranslation(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    const body = await this.parseBody(req);
    const { key, locale, value } = body;

    const project = await this.getCurrentProjectData();
    if (!project) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No project selected' }));
      return;
    }

    // Load existing translations for the locale
    const localeFile = path.join(project.path, project.config.localesDir, `${locale}.json`);

    let translations: Record<string, string> = {};
    if (fs.existsSync(localeFile)) {
      const content = await fs.promises.readFile(localeFile, 'utf-8');
      translations = JSON.parse(content);
    }

    // Update the translation
    translations[key as string] = value as string;

    // Save back
    await fs.promises.writeFile(localeFile, JSON.stringify(translations, null, 2), 'utf-8');

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  }

  private async getStats(res: http.ServerResponse): Promise<void> {
    const project = await this.getCurrentProjectData();

    if (!project) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ totalKeys: 0, languages: 0, missing: 0 }));
      return;
    }

    const translations = await this.loadAllTranslations(project);
    const allLocales = [project.config.sourceLocale, ...project.config.targetLocales];

    let missing = 0;
    for (const entry of translations) {
      for (const locale of allLocales) {
        if (!entry.values[locale]) {
          missing++;
        }
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        totalKeys: translations.length,
        languages: allLocales.length,
        missing,
      })
    );
  }

  private async getConfig(res: http.ServerResponse): Promise<void> {
    const project = await this.getCurrentProjectData();

    if (!project) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No project selected' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(project.config));
  }

  private async getCurrentProjectData(): Promise<DiscoveredProject | null> {
    const projects = await discoverProjects(this.workspaceRoot);
    if (projects.length === 0) return null;

    const projectId = this.currentProjectId || projects[0]!.id;
    return projects.find((p) => p.id === projectId) ?? projects[0]!;
  }

  private async loadAllTranslations(project: DiscoveredProject): Promise<TranslationData[]> {
    const localesDir = path.join(project.path, project.config.localesDir);
    const allLocales = [project.config.sourceLocale, ...project.config.targetLocales];

    // Load all locale files
    const localeData: Record<string, Record<string, string>> = {};

    for (const locale of allLocales) {
      const localeFile = path.join(localesDir, `${locale}.json`);
      if (fs.existsSync(localeFile)) {
        const content = await fs.promises.readFile(localeFile, 'utf-8');
        localeData[locale] = JSON.parse(content);
      } else {
        localeData[locale] = {};
      }
    }

    // Merge all keys
    const allKeys = new Set<string>();
    for (const data of Object.values(localeData)) {
      for (const key of Object.keys(data)) {
        allKeys.add(key);
      }
    }

    // Build translation entries
    const translations: TranslationData[] = [];
    for (const key of Array.from(allKeys).sort()) {
      const values: Record<string, string> = {};
      for (const locale of allLocales) {
        values[locale] = localeData[locale]?.[key] ?? '';
      }
      translations.push({ key, values });
    }

    return translations;
  }

  private parseBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          resolve(JSON.parse(body || '{}'));
        } catch {
          resolve({});
        }
      });
      req.on('error', reject);
    });
  }
}
