import { logger } from './logger';
import { AppModule } from '../types';

// In a real build environment, we might import these. 
// In this runtime, we'll fetch them or fallback to defaults if the file system isn't served.
export const getSystemPrompt = async (type: 'builder' | 'refactor'): Promise<string> => {
  try {
    const filename = type === 'builder' ? 'builder_system.md' : 'refactor_system.md';
    // Attempt to fetch from assets folder
    const response = await fetch(`assets/prompts/${filename}`);
    if (response.ok) {
        return await response.text();
    }
    throw new Error("File not found");
  } catch (e) {
    logger.warn(AppModule.CORE, `Could not load external prompt for ${type}, using fallback.`);
    
    // Fallbacks just in case the static assets aren't served correctly in the environment
    if (type === 'builder') {
        return `You are an AI App Builder. Generate a functional Node.js/Web application. Include index.html with inline styles/Tailwind. Code must be unminified.`;
    } else {
        return `You are a Senior Engineer. Update the code based on instructions. Think step-by-step in 'reasoning'. Return FULL file content. Code must be unminified.`;
    }
  }
};