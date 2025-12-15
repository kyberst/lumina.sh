
import { GeneratedFile } from '../../../types';

const IMPORT_REGEX = /import(?:[\s\S]*?from)?\s*['"]((?:\.\/|\.\.\/)[^'"]+)['"]/g;

// A simple path resolver for browser environment
function resolvePath(baseFilePath: string, relativePath: string): string {
    const pathStack = baseFilePath.split('/');
    pathStack.pop(); // Start from the directory containing the file

    const parts = relativePath.split('/');
    for (const part of parts) {
        if (part === '..') {
            pathStack.pop();
        } else if (part !== '.') {
            pathStack.push(part);
        }
    }
    return pathStack.join('/');
}

export const findOrphanedFiles = (files: GeneratedFile[]): string[] => {
    const allFileNames = new Set(files.map(f => f.name));
    const importedFileNames = new Set<string>();

    // The root file is never an orphan. Find it from index.html.
    const indexHtml = files.find(f => f.name === 'index.html');
    if (indexHtml) {
        const scriptSrcMatch = /<script.*src=["'](.+?)["']/.exec(indexHtml.content);
        if (scriptSrcMatch && scriptSrcMatch[1]) {
            let entryPoint = scriptSrcMatch[1];
            if (entryPoint.startsWith('./')) {
                entryPoint = entryPoint.substring(2);
            }
            if (allFileNames.has(entryPoint)) {
                importedFileNames.add(entryPoint);
            }
        }
    }
    
    // Build a set of all imported files by parsing import statements
    files.forEach(file => {
        let match;
        while ((match = IMPORT_REGEX.exec(file.content)) !== null) {
            const relativePath = match[1];
            const resolved = resolvePath(file.name, relativePath);
            
            // Check for file with common extensions
            const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
            for (const ext of extensions) {
                if (allFileNames.has(resolved + ext)) {
                    importedFileNames.add(resolved + ext);
                    break;
                }
            }
        }
    });

    // Determine orphans by finding which files are not in the imported set
    const orphans = files
        .filter(file => 
            /\.(ts|tsx|js|jsx)$/.test(file.name) &&
            !importedFileNames.has(file.name)
        )
        .map(file => file.name);

    return orphans;
};
