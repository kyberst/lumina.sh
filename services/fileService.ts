
import { AppError, AppModule, GeneratedFile } from '../types';
import { logger } from './logger';
import { t } from './i18n';

export const readDirectoryFiles = async (files: FileList): Promise<GeneratedFile[]> => {
  // Expanded list of allowed extensions
  const allowedExtensions = [
    '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.txt', '.css', '.html', 
    '.yml', '.yaml', '.xml', '.svg', '.scss', '.sass', '.less', '.sql', '.graphql',
    '.vue', '.svelte', '.php', '.py', '.rb', '.go', '.java', '.c', '.cpp', '.h', '.sh',
    '.env', '.gitignore', '.conf', '.ini'
  ];
  
  const generatedFiles: GeneratedFile[] = [];

  try {
    logger.info(AppModule.INTEGRATION, `Processing selection of ${files.length} files`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Use webkitRelativePath for folder structure, fallback to name for single files
      const path = file.webkitRelativePath || file.name;

      // Skip node_modules, .git, dist, build, coverage folders explicitly
      // checking for /node_modules/ ensures we don't skip "my_node_modules_test.js"
      if (
          path.includes('/node_modules/') || 
          path.includes('/.git/') || 
          path.includes('/dist/') || 
          path.includes('/build/') ||
          path.includes('/.next/') ||
          path.includes('/coverage/')
      ) {
        continue;
      }

      // Determine extension
      let ext = '';
      if (file.name.startsWith('.') && !file.name.includes('.', 1)) {
          // Handle dotfiles like .env, .gitignore where the name is essentially the extension
          ext = file.name; 
      } else {
          const parts = file.name.split('.');
          if (parts.length > 1) {
              ext = '.' + parts.pop()?.toLowerCase();
          }
      }

      // Check allow list or specific filenames like Dockerfile
      const isAllowed = allowedExtensions.includes(ext) || 
                        file.name === 'Dockerfile' || 
                        file.name === 'package' || 
                        file.name === 'LICENSE' ||
                        file.name === 'README';

      // Limit 2MB per file (increased from 100KB)
      if (isAllowed && file.size < 2000000) { 
        try {
            const text = await readFileAsText(file);
            
            let lang: any = 'javascript';
            if (ext === '.html') lang = 'html';
            if (ext === '.css' || ext === '.scss' || ext === '.sass') lang = 'css';
            if (ext === '.json') lang = 'json';
            if (ext === '.md') lang = 'markdown';
            if (ext === '.ts' || ext === '.tsx') lang = 'typescript';
            if (ext === '.py') lang = 'python';

            // Clean relative path: remove the top-level folder name if it exists to make paths relative to project root
            // e.g. "MyProject/src/index.js" -> "src/index.js"
            let relativePath = file.name;
            if (file.webkitRelativePath) {
                const parts = file.webkitRelativePath.split('/');
                if (parts.length > 1) {
                    relativePath = parts.slice(1).join('/');
                } else {
                    relativePath = file.webkitRelativePath;
                }
            }

            // Don't add if path is empty
            if (relativePath) {
                generatedFiles.push({
                    name: relativePath,
                    content: text,
                    language: lang
                });
            }
        } catch (readErr) {
            console.warn(`Failed to read file ${file.name}`, readErr);
        }
      }
    }

    if (generatedFiles.length === 0) {
      // Provide more detailed error for debugging
      const fileSample = Array.from(files).slice(0, 3).map(f => f.name).join(', ');
      const errorMessage = t('noValidFilesError', 'import')
          .replace('{count}', files.length.toString())
          .replace('{sample}', fileSample);
      throw new Error(errorMessage);
    }

    return generatedFiles;

  } catch (error: any) {
    logger.error(AppModule.INTEGRATION, 'File read failed', error);
    throw new AppError(error.message || 'FileSystem Read Error', 'FS_READ_ERR', AppModule.INTEGRATION);
  }
};

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};
