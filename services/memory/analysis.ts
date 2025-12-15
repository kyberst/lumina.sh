import { CodeSymbol, GeneratedFile } from "../../types";

export const extractSymbols = (content: string): CodeSymbol[] => {
    const symbols: CodeSymbol[] = [];
    // Matches: /** doc */ export async function myFunc
    const regex = /(?:\/\*\*([\s\S]*?)\*\/[\s\n]*)?(?:export\s+)?(?:async\s+)?(function|class|const|let|var|interface|type)\s+([a-zA-Z0-9_]+)/gm;
    
    let match;
    let limit = 0;
    // Limit iterations to prevent potential regex DoS on large files
    while ((match = regex.exec(content)) !== null && limit < 100) {
        limit++;
        const jsdoc = match[1] ? match[1].replace(/^\s*\*+/gm, '').trim() : '';
        const type = match[2];
        const name = match[3];
        
        // Only index significant symbols
        if (jsdoc.length > 0 || ['function', 'class', 'interface'].includes(type)) {
            symbols.push({
                name,
                type,
                doc: jsdoc,
                signature: match[0].trim().split('\n').pop() || match[0].trim()
            });
        }
    }
    return symbols;
};

export const extractImports = (file: GeneratedFile): string[] => {
    const imports: Set<string> = new Set();
    const regex = /import\s+(?:[\s\S]*?from\s+)?['"]([^'"]+)['"]|@import\s+['"]([^'"]+)['"]/g;
    
    let match;
    while ((match = regex.exec(file.content)) !== null) {
        let path = match[1] || match[2];
        if (!path) continue;
        path = path.replace(/^\.\//, ''); 
        if (path.startsWith('.') || path.includes('/')) {
            if (!path.includes('.')) path = path + '.tsx';
            imports.add(path);
        }
    }
    return Array.from(imports);
};