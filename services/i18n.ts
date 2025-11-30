import { translations } from './translations';

type Lang = 'en' | 'es';
const LANG_KEY = 'umbra_lang';

const getInitialLang = (): Lang => {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    return (saved === 'es' ? 'es' : 'en');
  } catch {
    return 'en';
  }
};

let currentLang: Lang = getInitialLang();

// Deprecated but kept for compatibility with existing calls, no-op now
export const initI18n = async () => {
  return Promise.resolve();
};

export const setLanguage = (lang: Lang) => {
  currentLang = lang;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch (e) {
    // Ignore storage errors
  }
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