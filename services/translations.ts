

import { en } from './i18n/locales/en';
import { es } from './i18n/locales/es';

export const translations = {
  en: {
    ...en,
    // Compatibility mapping for legacy modules
    journal: (en as any).builder,
    insight: (en as any).assistant
  },
  es: {
    ...es,
    // Compatibility mapping for legacy modules
    journal: (es as any).builder,
    insight: (es as any).assistant
  }
};
