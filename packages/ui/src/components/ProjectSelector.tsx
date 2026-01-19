import { useState, useRef, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';

export default function ProjectSelector() {
  const { projects, currentProject, isLoading, switchProject } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (projectId: string) => {
    if (projectId !== currentProject?.id) {
      await switchProject(projectId);
    }
    setIsOpen(false);
  };

  if (isLoading && !currentProject) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-500">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin"></div>
        <span>Loading...</span>
      </div>
    );
  }

  if (projects.length <= 1 && currentProject) {
    // Single project - no need for selector
    return (
      <div className="flex items-center space-x-2 px-3 py-2">
        <FolderIcon className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-700">{currentProject.name}</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
      >
        <FolderIcon className="w-4 h-4 text-gray-500" />
        <span className="max-w-[200px] truncate">{currentProject?.name || 'Select project'}</span>
        <ChevronDownIcon
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Projects ({projects.length})
            </p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => void handleSelect(project.id)}
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-start space-x-3 ${
                  project.id === currentProject?.id ? 'bg-primary-50' : ''
                }`}
              >
                <div
                  className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                    project.id === currentProject?.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  <FolderIcon className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      project.id === currentProject?.id ? 'text-primary-700' : 'text-gray-900'
                    }`}
                  >
                    {project.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate font-mono">
                    {project.id === 'root' ? './' : project.id}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                      {project.sourceLocale}
                    </span>
                    <span className="text-xs text-gray-400">
                      → {project.targetLocales.length} locale
                      {project.targetLocales.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                {project.id === currentProject?.id && (
                  <CheckIcon className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple icon components
function FolderIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
