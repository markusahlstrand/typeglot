import { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { api, type TypeGlotConfig } from '../api/client';

export default function Settings() {
  const { currentProject, isLoading: projectLoading } = useProject();
  const [config, setConfig] = useState<TypeGlotConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentProject) {
      setIsLoading(true);
      api
        .getConfig()
        .then(setConfig)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [currentProject]);

  if (projectLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentProject || !config) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No project selected</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <div className="text-sm text-gray-500">
          <span className="font-medium">{currentProject.name}</span>
          <span className="mx-2">•</span>
          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
            {currentProject.id === 'root'
              ? 'typeglot.config.json'
              : `${currentProject.id}/typeglot.config.json`}
          </code>
        </div>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">General</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source Locale</label>
              <select
                value={config.sourceLocale}
                className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled
              >
                <option value={config.sourceLocale}>{config.sourceLocale}</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                The primary language for your translations
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Locales Directory
              </label>
              <input
                type="text"
                value={config.localesDir}
                readOnly
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
              />
              <p className="text-sm text-gray-500 mt-1">Path to your translation JSON files</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Output Directory
              </label>
              <input
                type="text"
                value={config.outputDir}
                readOnly
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
              />
              <p className="text-sm text-gray-500 mt-1">
                Where generated TypeScript files are placed
              </p>
            </div>
          </div>
        </div>

        {/* AI Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Translation</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AI Provider</label>
              <select
                value={config.ai?.provider || 'openai'}
                className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="copilot">GitHub Copilot</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input
                type="password"
                placeholder="sk-..."
                defaultValue={config.ai?.apiKey || ''}
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="text-sm text-gray-500 mt-1">Your API key for the selected provider</p>
            </div>
          </div>
        </div>

        {/* Target Locales */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Target Locales</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {config.targetLocales.map((locale) => (
              <span
                key={locale}
                className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
              >
                {locale}
                <button className="ml-2 text-primary-600 hover:text-primary-800">×</button>
              </span>
            ))}
            {config.targetLocales.length === 0 && (
              <span className="text-sm text-gray-500 italic">No target locales configured</span>
            )}
          </div>
          <button className="text-primary-600 hover:text-primary-800 text-sm font-medium">
            + Add locale
          </button>
        </div>

        {/* Project Info */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Project Info</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Project Path</dt>
              <dd className="font-mono text-gray-900 mt-1">{currentProject.path}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Include Patterns</dt>
              <dd className="font-mono text-gray-900 mt-1">{config.include.join(', ')}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Exclude Patterns</dt>
              <dd className="font-mono text-gray-900 mt-1">{config.exclude.join(', ')}</dd>
            </div>
          </dl>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="px-6 py-2 bg-primary-500 text-white font-medium rounded-md hover:bg-primary-600 transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
