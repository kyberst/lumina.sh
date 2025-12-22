
import { translations } from './translations';
import { dbFacade } from './dbFacade';
import { logger } from './logger';
import { AppModule } from '../types';

// Extensible Language Definition
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' }
] as const;

export type Lang = typeof SUPPORTED_LANGUAGES[number]['code'];

let currentLang: Lang = 'en';

export const setLanguage = (lang: string) => {
  // Validate against supported languages
  const isSupported = SUPPORTED_LANGUAGES.some(l => l.code === lang);
  if (isSupported) {
      currentLang = lang as Lang;
      dbFacade.setConfig('app_language', lang).catch(e => {
        logger.warn(AppModule.CORE, "Failed to persist language setting to DB", e);
      });
  }
};

export const getLanguage = () => currentLang;

// Helper to resolve dot notation paths (e.g. "creation.newApp" -> obj["creation"]["newApp"])
const resolvePath = (obj: any, path: string): string | undefined => {
    if (!obj) return undefined;
    return path.split('.').reduce((acc, part) => {
        return acc && acc[part] !== undefined ? acc[part] : undefined;
    }, obj);
};

export const t = (key: string, module: string = 'common'): string => {
  // Map legacy module names if necessary
  let modFile = module;
  if (module === 'journal') modFile = 'builder';
  if (module === 'insight') modFile = 'assistant';
  
  const dict = translations[currentLang] as any;
  const fallbackDict = translations['en'] as any;
  
  // 1. Try current language
  if (dict && dict[modFile]) {
      const val = resolvePath(dict[modFile], key);
      if (val !== undefined) return val;
  }

  // 2. Fallback to English
  if (fallbackDict && fallbackDict[modFile]) {
      const val = resolvePath(fallbackDict[modFile], key);
      if (val !== undefined) return val;
  }

  // 3. Fallback to key
  return key; 
};
