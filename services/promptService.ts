
import { logger } from './logger';
import { AppModule } from '../types';

export type PromptType = 'builder' | 'refactor' | 'protocol' | 'dyad' | 'explain' | 'simplify';

export const getSystemPrompt = async (type: PromptType): Promise<string> => {
  try {
    let filename = '';
    switch(type) {
        case 'builder': filename = 'builder_system.md'; break;
        case 'refactor': filename = 'refactor_system.md'; break;
        case 'protocol': filename = 'protocol.md'; break;
        case 'dyad': filename = 'dyad.md'; break;
        case 'explain': filename = 'explain_system.md'; break;
        case 'simplify': filename = 'simplify_prompt.md'; break;
    }
    
    const response = await fetch(`assets/prompts/${filename}`);
    if (response.ok) {
        return await response.text();
    }
    throw new Error(`File ${filename} not found`);
  } catch (e) {
    logger.warn(AppModule.CORE, `Could not load external prompt for ${type}.`);
    return "";
  }
};