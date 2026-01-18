import { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { api, type TranslationEntry } from '../api/client';

export default function Translations() {
  const { currentProject, isLoading: projectLoading } = useProject();
  const [translations, setTranslations] = useState<TranslationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLocale, setSelectedLocale] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ key: string; locale: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  // All locales for the current project
  const locales = currentProject
    ? [currentProject.sourceLocale, ...currentProject.targetLocales]
    : [];

  useEffect(() => {
    if (currentProject) {
      setIsLoading(true);
      api
        .getTranslations()
        .then(setTranslations)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [currentProject]);

  const filteredTranslations = translations.filter(
    (t) =>
      t.key.toLowerCase().includes(search.toLowerCase()) ||
      Object.values(t.values).some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );

  const handleEditStart = (key: string, locale: string, currentValue: string) => {
    setEditingCell({ key, locale });
    setEditValue(currentValue);
  };

  const handleEditSave = async () => {
    if (!editingCell) return;

    try {
      await api.saveTranslation(editingCell.key, editingCell.locale, editValue);
      // Update local state
      setTranslations((prev) =>
        prev.map((t) =>
          t.key === editingCell.key
            ? { ...t, values: { ...t.values, [editingCell.locale]: editValue } }
            : t
        )
      );
      setEditingCell(null);
    } catch (error) {
      console.error('Failed to save translation:', error);
    }
  };

  const handleEditCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No project selected</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Translations</h1>
        <button className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-md hover:bg-primary-600 transition-colors">
          + Add Key
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search keys or values..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-64 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedLocale(null)}
              className={`px-3 py-2 text-sm rounded-md ${
                selectedLocale === null
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => setSelectedLocale(locale)}
                className={`px-3 py-2 text-sm rounded-md uppercase ${
                  selectedLocale === locale
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {locale}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Translation Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredTranslations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {search ? 'No translations match your search' : 'No translations found'}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Key
                </th>
                {(selectedLocale ? [selectedLocale] : locales).map((locale) => (
                  <th
                    key={locale}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {locale}
                    {locale === currentProject.sourceLocale && (
                      <span className="ml-1 text-primary-500">(source)</span>
                    )}
                  </th>
                ))}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTranslations.map((entry) => (
                <tr key={entry.key} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                      {entry.key}
                    </code>
                  </td>
                  {(selectedLocale ? [selectedLocale] : locales).map((locale) => (
                    <td key={locale} className="px-6 py-4">
                      {editingCell?.key === entry.key && editingCell?.locale === locale ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-primary-300 rounded focus:ring-2 focus:ring-primary-500"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleEditSave();
                              if (e.key === 'Escape') handleEditCancel();
                            }}
                          />
                          <button
                            onClick={handleEditSave}
                            className="text-green-600 hover:text-green-800"
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleEditCancel}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`text-sm cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded ${
                            entry.values[locale] ? 'text-gray-700' : 'text-red-500 italic'
                          }`}
                          onClick={() =>
                            handleEditStart(entry.key, locale, entry.values[locale] || '')
                          }
                        >
                          {entry.values[locale] || 'Missing'}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
