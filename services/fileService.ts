
import { AppError, AppModule, GeneratedFile } from '../types';
import { logger } from './logger';

export const readDirectoryFiles = async (files: FileList): Promise<{ files: GeneratedFile[], projectName: string | null }> => {
  // Expanded list of allowed extensions
  const allowedExtensions = [
    '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.txt', '.css', '.html', 
    '.yml', '.yaml', '.xml', '.svg', '.scss', '.sass', '.less', '.sql', '.graphql',
    '.vue', '.svelte', '.php', '.py', '.rb', '.go', '.java', '.c', '.cpp', '.h', '.sh',
    '.env', '.gitignore', '.conf', '.ini'
  ];
  
  const generatedFiles: GeneratedFile[] = [];
  let detectedProjectName: string | null = null;

  try {
    logger.info(AppModule.INTEGRATION, `Processing selection of ${files.length} files`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Use webkitRelativePath for folder structure, fallback to name for single files
      const path = file.webkitRelativePath || file.name;

      // Skip node_modules, .git, dist, build, coverage folders explicitly
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
          ext = file.name; 
      } else {
          const parts = file.name.split('.');
          if (parts.length > 1) {
              ext = '.' + parts.pop()?.toLowerCase();
          }
      }

      const isAllowed = allowedExtensions.includes(ext) || 
                        file.name === 'Dockerfile' || 
                        file.name === 'package' || 
                        file.name === 'LICENSE' ||
                        file.name === 'README';

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

            let relativePath = file.name;
            if (file.webkitRelativePath) {
                const parts = file.webkitRelativePath.split('/');
                if (parts.length > 1) {
                    if (!detectedProjectName) {
                        detectedProjectName = parts[0];
                    }
                    relativePath = parts.slice(1).join('/');
                } else {
                    relativePath = file.webkitRelativePath;
                }
            }

            if (relativePath) {
                generatedFiles.push({ name: relativePath, content: text, language: lang });
            }
        } catch (readErr) {
            console.warn(`Failed to read file ${file.name}`, readErr);
        }
      }
    }

    if (generatedFiles.length === 0) {
      let fileSample = "";
      try {
          // Safer way to get sample if files is iterable
          fileSample = Array.from(files).slice(0, 3).map(f => f.name).join(', ');
      } catch (e) {
          fileSample = "unknown files";
      }
      throw new Error(`No valid code files found. Checked ${files.length} files (e.g., ${fileSample}). ensure files are < 2MB and have standard extensions.`);
    }

    return { files: generatedFiles, projectName: detectedProjectName };

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
