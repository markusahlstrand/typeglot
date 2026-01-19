import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverProjects, type DiscoveredProject } from '@typeglot/core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface DevServerOptions {
  port: number;
  workspaceRoot: string;
}

export interface TranslationData {
  key: string;
  values: Record<string, string>;
}

/**
 * Hono-based development server for TypeGlot
 * Serves both the API and the built UI
 */
export class DevServer {
  private app: Hono;
  private server: ReturnType<typeof serve> | null = null;
  private port: number;
  private workspaceRoot: string;
  private currentProjectId: string | null = null;

  constructor(options: DevServerOptions) {
    this.port = options.port;
    this.workspaceRoot = options.workspaceRoot;
    this.app = new Hono();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // API routes
    this.app.get('/api/projects', async (c) => {
      const projects = await discoverProjects(this.workspaceRoot);
      return c.json(
        projects.map((p) => ({
          id: p.id,
          name: p.name,
          path: p.path,
          sourceLocale: p.config.sourceLocale,
          targetLocales: p.config.targetLocales,
        }))
      );
    });

    this.app.get('/api/projects/current', async (c) => {
      const projects = await discoverProjects(this.workspaceRoot);

      if (projects.length === 0) {
        return c.json({ error: 'No projects found' }, 404);
      }

      const projectId = this.currentProjectId || projects[0]!.id;
      const project = projects.find((p) => p.id === projectId) ?? projects[0]!;

      return c.json({
        id: project.id,
        name: project.name,
        path: project.path,
        sourceLocale: project.config.sourceLocale,
        targetLocales: project.config.targetLocales,
      });
    });

    this.app.post('/api/projects/current', async (c) => {
      const body = await c.req.json<{ projectId: string }>();
      const { projectId } = body;

      const projects = await discoverProjects(this.workspaceRoot);
      const project = projects.find((p) => p.id === projectId);

      if (!project) {
        return c.json({ error: 'Project not found' }, 404);
      }

      this.currentProjectId = projectId;
      return c.json({
        id: project.id,
        name: project.name,
        path: project.path,
        sourceLocale: project.config.sourceLocale,
        targetLocales: project.config.targetLocales,
      });
    });

    this.app.get('/api/translations', async (c) => {
      const project = await this.getCurrentProjectData();

      if (!project) {
        return c.json({ error: 'No project selected' }, 404);
      }

      const translations = await this.loadAllTranslations(project);
      return c.json(translations);
    });

    this.app.post('/api/translations', async (c) => {
      const body = await c.req.json<{ key: string; locale: string; value: string }>();
      const { key, locale, value } = body;

      const project = await this.getCurrentProjectData();
      if (!project) {
        return c.json({ error: 'No project selected' }, 404);
      }

      const localeFile = path.join(project.path, project.config.localesDir, `${locale}.json`);

      let translations: Record<string, string> = {};
      if (fs.existsSync(localeFile)) {
        const content = await fs.promises.readFile(localeFile, 'utf-8');
        translations = JSON.parse(content) as Record<string, string>;
      }

      translations[key] = value;

      await fs.promises.writeFile(localeFile, JSON.stringify(translations, null, 2), 'utf-8');

      return c.json({ success: true });
    });

    this.app.get('/api/stats', async (c) => {
      const project = await this.getCurrentProjectData();

      if (!project) {
        return c.json({ totalKeys: 0, languages: 0, missing: 0 });
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

      return c.json({
        totalKeys: translations.length,
        languages: allLocales.length,
        missing,
      });
    });

    this.app.get('/api/config', async (c) => {
      const project = await this.getCurrentProjectData();

      if (!project) {
        return c.json({ error: 'No project selected' }, 404);
      }

      return c.json(project.config);
    });

    // Serve static UI files
    // The UI is built to packages/ui/dist, we need to find it relative to this file
    const uiDistPath = this.findUiDistPath();

    if (uiDistPath && fs.existsSync(uiDistPath)) {
      // Serve static assets (JS, CSS, images, etc.)
      this.app.get('/assets/*', async (c) => {
        const assetPath = c.req.path;
        const filePath = path.join(uiDistPath, assetPath);

        if (fs.existsSync(filePath)) {
          const content = await fs.promises.readFile(filePath);
          const ext = path.extname(filePath).toLowerCase();
          const mimeTypes: Record<string, string> = {
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.svg': 'image/svg+xml',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf',
            '.eot': 'application/vnd.ms-fontobject',
          };
          const contentType = mimeTypes[ext] || 'application/octet-stream';
          return c.body(content, 200, { 'Content-Type': contentType });
        }
        return c.notFound();
      });

      // Serve favicon
      this.app.get('/favicon.svg', async (c) => {
        const faviconPath = path.join(uiDistPath, 'favicon.svg');
        if (fs.existsSync(faviconPath)) {
          const content = await fs.promises.readFile(faviconPath, 'utf-8');
          return c.body(content, 200, { 'Content-Type': 'image/svg+xml' });
        }
        return c.notFound();
      });

      // SPA fallback - serve index.html for all non-API routes
      this.app.get('*', async (c) => {
        const indexPath = path.join(uiDistPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          const html = await fs.promises.readFile(indexPath, 'utf-8');
          return c.html(html);
        }
        return c.text('UI not found. Run `pnpm ui build` first.', 404);
      });
    } else {
      this.app.get('*', (c) => {
        return c.text('UI not built. Run `pnpm ui build` first.', 404);
      });
    }
  }

  private findUiDistPath(): string {
    // Try to find the UI dist folder in order of priority:
    // 1. Bundled with CLI package (for npx usage)
    // 2. Monorepo development paths
    const possiblePaths = [
      // Bundled UI in CLI package (npx @typeglot/cli dev)
      path.resolve(__dirname, '../../ui-dist'),
      // From CLI dist in monorepo (packages/cli/dist/server/)
      path.resolve(__dirname, '../../../ui/dist'),
      // From CLI src during dev
      path.resolve(__dirname, '../../ui/dist'),
      // From monorepo root (when running from workspace root)
      path.resolve(this.workspaceRoot, 'packages/ui/dist'),
      // In node_modules (fallback)
      path.resolve(process.cwd(), 'node_modules/@typeglot/ui/dist'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    // Default path
    return path.resolve(__dirname, '../../../ui/dist');
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = serve(
        {
          fetch: this.app.fetch,
          port: this.port,
        },
        () => {
          resolve();
        }
      );
    });
  }

  stop(): void {
    if (this.server) {
      this.server.close();
    }
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

    const localeData: Record<string, Record<string, string>> = {};

    for (const locale of allLocales) {
      const localeFile = path.join(localesDir, `${locale}.json`);
      if (fs.existsSync(localeFile)) {
        const content = await fs.promises.readFile(localeFile, 'utf-8');
        localeData[locale] = JSON.parse(content) as Record<string, string>;
      } else {
        localeData[locale] = {};
      }
    }

    const allKeys = new Set<string>();
    for (const data of Object.values(localeData)) {
      for (const key of Object.keys(data)) {
        allKeys.add(key);
      }
    }

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
}
