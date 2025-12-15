
import { GeneratedFile, AppModule } from '../types';
import { logger } from './logger';

declare global {
    interface Window {
        prettier: any;
        prettierPlugins: any;
    }
}

class FormattingService {
  private isReady = false;

  private async ensureReady(): Promise<boolean> {
    if (this.isReady) return true;
    if (window.prettier && window.prettierPlugins) {
        this.isReady = true;
        return true;
    }
    // Prettier scripts are loaded in index.html, but a small delay might be needed for them to be available
    await new Promise(r => setTimeout(r, 200));
    if (window.prettier && window.prettierPlugins) {
        this.isReady = true;
        return true;
    }
    
    logger.warn(AppModule.CORE, "Prettier not available, formatting will be skipped.");
    return false;
  }

  public async format(code: string, language: string): Promise<string> {
    const ready = await this.ensureReady();
    if (!ready) return code;

    let parser: string;
    switch (language) {
        case 'typescript':
        case 'javascript':
            parser = 'typescript';
            break;
        case 'css':
            parser = 'css';
            break;
        case 'html':
            parser = 'html';
            break;
        case 'json':
            parser = 'json';
            break;
        default:
            return code; // Don't format unsupported languages
    }

    try {
        const formatted = await window.prettier.format(code, {
            parser: parser,
            plugins: window.prettierPlugins,
            semi: true,
            singleQuote: true,
            tabWidth: 2,
            trailingComma: 'es5',
            printWidth: 120,
        });
        return formatted;
    } catch (e) {
        logger.error(AppModule.CORE, `Prettier formatting failed for language ${language}.`, e);
        return code;
    }
  }

  public async formatFiles(files: GeneratedFile[], filesToFormat: string[]): Promise<GeneratedFile[]> {
    const promises = files.map(async (file) => {
        if (filesToFormat.includes(file.name)) {
            const formattedContent = await this.format(file.content, file.language);
            return { ...file, content: formattedContent };
        }
        return file;
    });
    return Promise.all(promises);
  }
}

export const formattingService = new FormattingService();
