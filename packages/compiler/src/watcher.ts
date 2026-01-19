import * as path from 'node:path';
import chokidar, { type FSWatcher } from 'chokidar';
import { TypeGlotCompiler, CompilerOptions } from './compiler.js';

export interface WatcherOptions extends CompilerOptions {
  onCompile?: (results: { success: boolean; path: string }[]) => void;
  onError?: (error: Error) => void;
}

/**
 * Watch translation files and recompile on changes
 */
export class TranslationWatcher {
  private compiler: TypeGlotCompiler;
  private watcher: FSWatcher | null = null;
  private options: WatcherOptions;

  constructor(options: WatcherOptions) {
    this.options = options;
    this.compiler = new TypeGlotCompiler(options);
  }

  /**
   * Start watching for file changes
   */
  async start(): Promise<void> {
    const localesDir = path.resolve(this.options.projectRoot, this.options.config.localesDir);

    // Initial compilation
    await this.compile();

    // Watch for changes
    this.watcher = chokidar.watch(path.join(localesDir, '*.json'), {
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher.on('add', (filePath: string) => void this.handleChange(filePath, 'added'));
    this.watcher.on('change', (filePath: string) => void this.handleChange(filePath, 'changed'));
    this.watcher.on('unlink', (filePath: string) => void this.handleChange(filePath, 'removed'));
    this.watcher.on('error', (err: unknown) => {
      const error = err instanceof Error ? err : new Error(String(err));
      this.options.onError?.(error);
    });

    console.log(`[typeglot] Watching for changes in ${localesDir}`);
  }

  /**
   * Stop watching
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
  }

  private async handleChange(filePath: string, event: string): Promise<void> {
    console.log(`[typeglot] File ${event}: ${path.basename(filePath)}`);
    await this.compile();
  }

  private async compile(): Promise<void> {
    try {
      const results = await this.compiler.compile();
      this.options.onCompile?.(results.map((r) => ({ success: r.success, path: r.outputPath })));
    } catch (error) {
      this.options.onError?.(error as Error);
    }
  }
}
