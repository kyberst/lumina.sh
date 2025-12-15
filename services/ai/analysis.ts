
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


/**
 * Extracts React component props using Regex.
 * This is a simplified, best-effort approach without a full AST parser.
 * It looks for TypeScript interface/type definitions for props.
 */
export const extractComponentProps = (fileContent: string): { name: string; type: string; isOptional: boolean }[] => {
    const props: { name: string; type: string; isOptional: boolean }[] = [];
    
    // Regex to find `interface ...Props` or `type ...Props` blocks
    const propsBlockRegex = /(?:interface|type)\s+\w*Props\s*=\s*\{([\s\S]*?)\}/;
    const match = fileContent.match(propsBlockRegex);

    if (match && match[1]) {
        const propsContent = match[1];
        // Regex to find individual prop lines like `name?: string;`
        const propLineRegex = /^\s*(\w+)(\??):\s*(\w+);?/gm;
        
        let propMatch;
        while ((propMatch = propLineRegex.exec(propsContent)) !== null) {
            props.push({
                name: propMatch[1],
                isOptional: propMatch[2] === '?',
                type: propMatch[3],
            });
        }
    }

    return props;
};
