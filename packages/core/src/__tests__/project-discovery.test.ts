import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { discoverProjects } from '../config/project-discovery.js';

describe('discoverProjects', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'typeglot-test-'));
  });

  afterEach(async () => {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  });

  it('should find a root project', async () => {
    const config = {
      sourceLocale: 'en',
      targetLocales: ['es'],
    };
    await fs.promises.writeFile(path.join(tempDir, 'typeglot.config.json'), JSON.stringify(config));

    const projects = await discoverProjects(tempDir);

    expect(projects).toHaveLength(1);
    const firstProject = projects[0]!;
    expect(firstProject.id).toBe('root');
    expect(firstProject.config.sourceLocale).toBe('en');
  });

  it('should find nested projects in a monorepo', async () => {
    // Create root config
    await fs.promises.writeFile(
      path.join(tempDir, 'typeglot.config.json'),
      JSON.stringify({ sourceLocale: 'en' })
    );

    // Create nested project
    const appsDir = path.join(tempDir, 'apps', 'docs');
    await fs.promises.mkdir(appsDir, { recursive: true });
    await fs.promises.writeFile(
      path.join(appsDir, 'typeglot.config.json'),
      JSON.stringify({ sourceLocale: 'en', targetLocales: ['de', 'fr'] })
    );

    const projects = await discoverProjects(tempDir);

    expect(projects).toHaveLength(2);
    expect(projects.map((p) => p.id).sort()).toEqual(['apps/docs', 'root']);
  });

  it('should return empty array when no projects found', async () => {
    const projects = await discoverProjects(tempDir);

    expect(projects).toHaveLength(0);
  });

  it('should ignore node_modules', async () => {
    // Create config in node_modules (should be ignored)
    const nodeModulesDir = path.join(tempDir, 'node_modules', 'some-package');
    await fs.promises.mkdir(nodeModulesDir, { recursive: true });
    await fs.promises.writeFile(
      path.join(nodeModulesDir, 'typeglot.config.json'),
      JSON.stringify({ sourceLocale: 'en' })
    );

    const projects = await discoverProjects(tempDir);

    expect(projects).toHaveLength(0);
  });
});
