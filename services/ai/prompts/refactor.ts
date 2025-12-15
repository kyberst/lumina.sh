
import { getSystemPrompt } from "../../promptService";

export const getRefactorSystemPrompt = async (lang: 'en' | 'es', contextSize: string = 'default'): Promise<string> => {
  const langName = lang === 'es' ? 'Spanish' : 'English';
  
  // Load the base prompt from the markdown file
  let basePrompt = await getSystemPrompt('refactor');
  
  // Inject dynamic parts
  basePrompt = basePrompt.replace(/{{LANG}}/g, langName);
  
  return basePrompt;
};
