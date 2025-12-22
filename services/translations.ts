
// English Modules
import commonEn from '../assets/locales/en/common';
import builderEn from '../assets/locales/en/builder';
import assistantEn from '../assets/locales/en/assistant';
import settingsEn from '../assets/locales/en/settings';
import navEn from '../assets/locales/en/nav';
import onboardingEn from '../assets/locales/en/onboarding';
import workspaceEn from '../assets/locales/en/workspace';
import importEn from '../assets/locales/en/import';
import graphEn from '../assets/locales/en/graph';

// Spanish Modules
import commonEs from '../assets/locales/es/common';
import builderEs from '../assets/locales/es/builder';
import assistantEs from '../assets/locales/es/assistant';
import settingsEs from '../assets/locales/es/settings';
import navEs from '../assets/locales/es/nav';
import onboardingEs from '../assets/locales/es/onboarding';
import workspaceEs from '../assets/locales/es/workspace';
import importEs from '../assets/locales/es/import';
import graphEs from '../assets/locales/es/graph';

// Placeholder for other languages (Fallbacks to English structure for now to prevent crash)
const commonFr = { ...commonEn };
const commonDe = { ...commonEn };

// Aggregated Translations Object
export const translations = {
  en: {
    common: commonEn,
    builder: builderEn,
    assistant: assistantEn,
    settings: settingsEn,
    nav: navEn,
    onboarding: onboardingEn,
    workspace: workspaceEn,
    import: importEn,
    graph: graphEn,
    // Compatibility aliases
    journal: builderEn,
    insight: assistantEn
  },
  es: {
    common: commonEs,
    builder: builderEs,
    assistant: assistantEs,
    settings: settingsEs,
    nav: navEs,
    onboarding: onboardingEs,
    workspace: workspaceEs,
    import: importEs,
    graph: graphEs,
    journal: builderEs,
    insight: assistantEs
  },
  fr: {
    common: commonFr,
    builder: builderEn,
    assistant: assistantEn,
    settings: settingsEn,
    nav: navEn,
    onboarding: onboardingEn,
    workspace: workspaceEn,
    import: importEn,
    graph: graphEn,
    journal: builderEn,
    insight: assistantEn
  },
  de: {
    common: commonDe,
    builder: builderEn,
    assistant: assistantEn,
    settings: settingsEn,
    nav: navEn,
    onboarding: onboardingEn,
    workspace: workspaceEn,
    import: importEn,
    graph: graphEn,
    journal: builderEn,
    insight: assistantEn
  }
};
