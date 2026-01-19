import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { api, type Stats } from '../api/client';

export default function Dashboard() {
  const { currentProject, isLoading: projectLoading } = useProject();
  const [stats, setStats] = useState<Stats>({ totalKeys: 0, languages: 0, missing: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentProject) {
      setIsLoading(true);
      api
        .getStats()
        .then(setStats)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [currentProject]);

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        {currentProject && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span className="font-medium">{currentProject.name}</span>
            <span>•</span>
            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
              {currentProject.id === 'root' ? './' : currentProject.id}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Keys"
          value={isLoading ? '...' : stats.totalKeys.toString()}
          description="Translation keys defined"
        />
        <StatCard
          title="Languages"
          value={isLoading ? '...' : stats.languages.toString()}
          description="Configured locales"
        />
        <StatCard
          title="Missing"
          value={isLoading ? '...' : stats.missing.toString()}
          description="Untranslated strings"
          highlight={stats.missing > 0}
        />
      </div>

      {/* Locale Overview */}
      {currentProject && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Locales</h2>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
              {currentProject.sourceLocale}
              <span className="ml-1 text-xs text-primary-600">(source)</span>
            </span>
            {currentProject.targetLocales.map((locale) => (
              <span
                key={locale}
                className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {locale}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActionCard
            title="Add New Key"
            description="Create a new translation key"
            action="Add Key"
            onClick={() => void navigate('/translations?action=add')}
          />
          <ActionCard
            title="AI Translate"
            description="Generate translations using AI"
            action="Translate"
            disabled={stats.missing === 0}
            onClick={() => alert('AI translation coming soon!')}
          />
          <ActionCard
            title="Add Language"
            description="Add a new target language"
            action="Add Language"
            onClick={() => void navigate('/settings')}
          />
          <ActionCard
            title="Export"
            description="Export translations to JSON"
            action="Export"
            onClick={() => alert('Export coming soon!')}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  highlight = false,
}: {
  title: string;
  value: string;
  description: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border p-6 ${
        highlight ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
      }`}
    >
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className={`text-3xl font-bold mt-1 ${highlight ? 'text-yellow-700' : 'text-gray-900'}`}>
        {value}
      </p>
      <p className="text-sm text-gray-400 mt-1">{description}</p>
    </div>
  );
}

function ActionCard({
  title,
  description,
  action,
  disabled = false,
  onClick,
}: {
  title: string;
  description: string;
  action: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`border rounded-lg p-4 flex justify-between items-center transition-colors ${
        disabled ? 'border-gray-100 bg-gray-50' : 'border-gray-200 hover:border-primary-300'
      }`}
    >
      <div>
        <h3 className={`font-medium ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          disabled
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-primary-500 text-white hover:bg-primary-600'
        }`}
        disabled={disabled}
        onClick={onClick}
      >
        {action}
      </button>
    </div>
  );
}
