
import { translations } from './translations';
import { dbFacade } from './dbFacade';
import { logger } from './logger';
import { AppModule } from '../types';

type Lang = 'en' | 'es';

let currentLang: Lang = 'en'; // Default to English until loaded from DB

// Deprecated but kept for compatibility with existing calls, no-op now
export const initI18n = async () => {
  return Promise.resolve();
};

export const setLanguage = (lang: Lang) => {
  currentLang = lang;
  // Save to DB asynchronously, without blocking
  dbFacade.setConfig('app_language', lang).catch(e => {
    logger.warn(AppModule.CORE, "Failed to persist language setting to DB", e);
  });
};

export const getLanguage = () => currentLang;

export const t = (key: string, module: string = 'common'): string => {
  // Map legacy module names if necessary
  let modFile = module;
  if (module === 'journal') modFile = 'builder';
  if (module === 'insight') modFile = 'assistant';
  
  const dict = translations[currentLang] as any;
  if (dict && dict[modFile] && dict[modFile][key]) {
    return dict[modFile][key];
  }
  return key;
};
