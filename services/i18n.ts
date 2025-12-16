
type Lang = 'en' | 'es';
const LANG_KEY = 'umbra_lang';

const translations: Record<string, any> = { en: {}, es: {} };
let currentLang: Lang = 'en';
let isInitialized = false;

const MODULES = [
  'common', 'auth', 'nav', 'builder', 'assistant', 'graph', 
  'settings', 'onboarding', 'workspace', 'project', 'profile', 
  'import', 'creation', 'markdown', 'env', 'validation'
];

async function loadAllTranslations(): Promise<void> {
    const langs: Lang[] = ['en', 'es'];
    for (const lang of langs) {
        const promises = MODULES.map(module => 
            fetch(`./assets/locales/${lang}/${module}.json`)
                .then(res => {
                    if (!res.ok) throw new Error(`Failed to fetch ${lang}/${module}.json`);
                    return res.json();
                })
                .then(data => ({ module, data }))
        );
        
        try {
            const results = await Promise.all(promises);
            translations[lang] = {};
            for (const { module, data } of results) {
                translations[lang][module] = data;
            }
        } catch (e) {
            console.error(`Failed to load translations for ${lang}`, e);
        }
    }
}

export const initI18n = async () => {
  if (isInitialized) return;
  
  await loadAllTranslations();

  try {
    const saved = localStorage.getItem(LANG_KEY);
    currentLang = (saved === 'es' ? 'es' : 'en');
  } catch {
    currentLang = 'en';
  }

  isInitialized = true;
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
  let modFile = module;
  // Compatibility mapping for legacy modules
  if (module === 'journal') modFile = 'builder';
  if (module === 'insight') modFile = 'assistant';
  
  const resolveKey = (dict: any, keyPath: string): string | undefined => {
    const keys = keyPath.split('.');
    let current = dict;
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return undefined;
      }
    }
    return typeof current === 'string' ? current : undefined;
  };

  const dict = translations[currentLang] as any;
  if (dict && dict[modFile]) {
    const translation = resolveKey(dict[modFile], key);
    if (translation) return translation;
  }
  
  // Fallback to English if key not found in current language
  if (currentLang !== 'en') {
      const enDict = translations['en'] as any;
      if (enDict && enDict[modFile]) {
          const translation = resolveKey(enDict[modFile], key);
          if (translation) return translation;
      }
  }
  return key; // Return the key itself if not found anywhere
};
