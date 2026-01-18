import { defineConfig, type DefaultTheme } from 'vitepress';

// Import translations directly for config (static)
import en from '../locales/en.json';
import es from '../locales/es.json';
import de from '../locales/de.json';
import sv from '../locales/sv.json';

type Translations = typeof en;

/**
 * Helper to get translated sidebar
 */
function getSidebar(t: Translations): DefaultTheme.Sidebar {
  return {
    '/guide/': [
      {
        text: t.sidebar_introduction,
        items: [
          { text: t.sidebar_what_is, link: '/guide/what-is-typeglot' },
          { text: t.sidebar_getting_started, link: '/guide/getting-started' },
        ],
      },
      {
        text: t.sidebar_core_concepts,
        items: [
          { text: t.sidebar_translation_files, link: '/guide/translation-files' },
          { text: t.sidebar_type_safety, link: '/guide/type-safety' },
          { text: t.sidebar_ai_translation, link: '/guide/ai-translation' },
          { text: t.sidebar_jsdoc_context, link: '/guide/jsdoc-context' },
        ],
      },
      {
        text: t.sidebar_workflow,
        items: [
          { text: t.sidebar_dev_mode, link: '/guide/development-mode' },
          { text: t.sidebar_ci_cd, link: '/guide/ci-cd' },
        ],
      },
    ],
    '/packages/': [
      {
        text: t.sidebar_packages,
        items: [
          { text: '@typeglot/core', link: '/packages/core' },
          { text: '@typeglot/compiler', link: '/packages/compiler' },
          { text: '@typeglot/cli', link: '/packages/cli' },
          { text: '@typeglot/ui', link: '/packages/ui' },
          { text: 'VS Code Extension', link: '/packages/vscode' },
        ],
      },
    ],
    '/api/': [
      {
        text: t.sidebar_api_reference,
        items: [
          { text: t.sidebar_configuration, link: '/api/config' },
          { text: t.sidebar_cli_commands, link: '/api/cli' },
          { text: t.sidebar_core_functions, link: '/api/core' },
          { text: t.sidebar_compiler_api, link: '/api/compiler' },
        ],
      },
    ],
  };
}

/**
 * Helper to get translated nav
 */
function getNav(t: Translations): DefaultTheme.NavItem[] {
  return [
    { text: t.nav_guide, link: '/guide/getting-started' },
    { text: t.nav_packages, link: '/packages/core' },
    { text: t.nav_api, link: '/api/config' },
    {
      text: t.nav_links,
      items: [
        { text: t.nav_github, link: 'https://github.com/typeglot/typeglot' },
        { text: t.nav_changelog, link: 'https://github.com/typeglot/typeglot/releases' },
      ],
    },
  ];
}

/**
 * Get theme config for a locale
 */
function getThemeConfig(t: Translations): DefaultTheme.Config {
  return {
    nav: getNav(t),
    sidebar: getSidebar(t),
    footer: {
      message: t.footer_license,
      copyright: t.footer_copyright,
    },
    docFooter: {
      prev: t.prev_page,
      next: t.next_page,
    },
    outline: {
      label: t.toc_title,
    },
    lastUpdated: {
      text: t.last_updated,
    },
    editLink: {
      pattern: 'https://github.com/typeglot/typeglot/edit/main/apps/docs/:path',
      text: t.edit_link,
    },
  };
}

export default defineConfig({
  title: 'TypeGlot',
  description: en.site_description,

  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]],

  // Multi-language support
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      title: en.site_title,
      description: en.site_description,
      themeConfig: getThemeConfig(en),
    },
    es: {
      label: 'Español',
      lang: 'es',
      link: '/es/',
      title: es.site_title,
      description: es.site_description,
      themeConfig: getThemeConfig(es),
    },
    de: {
      label: 'Deutsch',
      lang: 'de',
      link: '/de/',
      title: de.site_title,
      description: de.site_description,
      themeConfig: getThemeConfig(de),
    },
    sv: {
      label: 'Svenska',
      lang: 'sv',
      link: '/sv/',
      title: sv.site_title,
      description: sv.site_description,
      themeConfig: getThemeConfig(sv),
    },
  },

  themeConfig: {
    logo: '/logo.svg',

    socialLinks: [{ icon: 'github', link: 'https://github.com/typeglot/typeglot' }],

    search: {
      provider: 'local',
      options: {
        locales: {
          es: {
            translations: {
              button: { buttonText: es.search_placeholder },
              modal: { noResultsText: es.search_no_results },
            },
          },
          de: {
            translations: {
              button: { buttonText: de.search_placeholder },
              modal: { noResultsText: de.search_no_results },
            },
          },
          sv: {
            translations: {
              button: { buttonText: sv.search_placeholder },
              modal: { noResultsText: sv.search_no_results },
            },
          },
        },
      },
    },
  },
});
