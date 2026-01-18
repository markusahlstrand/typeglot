/**
 * TypeGlot i18n module for VitePress
 *
 * This module provides typed translation functions for the documentation site.
 * Translations are loaded from the locales/*.json files.
 */

import en from '../../locales/en.json';
import es from '../../locales/es.json';
import de from '../../locales/de.json';
import sv from '../../locales/sv.json';

export type Locale = 'en' | 'es' | 'de' | 'sv';
export type TranslationKey = keyof typeof en;

const translations: Record<Locale, Record<string, string>> = {
  en,
  es,
  de,
  sv,
};

let currentLocale: Locale = 'en';

/**
 * Set the current locale
 */
export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

/**
 * Get the current locale
 */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Get a translation by key for the current locale
 */
export function t(key: TranslationKey): string {
  return translations[currentLocale][key] ?? translations.en[key] ?? key;
}

/**
 * Get a translation by key for a specific locale
 */
export function tLocale(locale: Locale, key: TranslationKey): string {
  return translations[locale][key] ?? translations.en[key] ?? key;
}

/**
 * Type-safe message functions (m.key_name pattern)
 */
export const m = new Proxy({} as Record<TranslationKey, () => string>, {
  get(_target, prop: string) {
    return () => t(prop as TranslationKey);
  },
});

/**
 * Get all available locales
 */
export function getLocales(): Locale[] {
  return ['en', 'es', 'de', 'sv'];
}

/**
 * Get locale display name
 */
export function getLocaleName(locale: Locale): string {
  const names: Record<Locale, string> = {
    en: 'English',
    es: 'Español',
    de: 'Deutsch',
    sv: 'Svenska',
  };
  return names[locale];
}

export default { t, tLocale, m, setLocale, getLocale, getLocales, getLocaleName };
