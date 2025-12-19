
import { GeneratedFile, DependencyDetails } from "../../../types";
import { ERROR_HANDLER_SCRIPT, DEPENDENCY_VALIDATOR_SCRIPT, ENV_HANDLING_SCRIPT, ELEMENT_SELECTOR_SCRIPT } from "./previewScripts";

interface SourceMapEntry {
    start: number;
    end: number;
    file: string;
}

/**
 * Constructs the final HTML blob for the Live Preview.
 * Injects styles, scripts, dependencies (importmap), error handling, and dependency validation.
 */
export const generateIframeHtml = (
    files: GeneratedFile[], 
    dependencies: Record<string, string | DependencyDetails> | undefined
): { html: string; sourceMap: Record<string, SourceMapEntry> } => {
    
    const indexFile = files.find(x => x.name === 'index.html'); 
    if(!indexFile) return { html: '', sourceMap: {} };
    
    let finalHtml = indexFile.content;
    const newSourceMap: Record<string, SourceMapEntry> = {};

    // 1. Build Import Map (Filter for Node/JS runtime)
    const imports: Record<string, string> = {
       "react": "https://esm.sh/react@18.2.0",
       "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
       "lucide-react": "https://esm.sh/lucide-react@0.263.1",
    };

    if (dependencies) {
        Object.entries(dependencies).forEach(([k, v]) => {
            // Handle legacy string format or new object format
            const version = typeof v === 'string' ? v : v.version;
            const runtime = typeof v === 'string' ? 'node' : v.runtime;

            if (runtime === 'node') {
                imports[k] = `https://esm.sh/${k}@${version}`;
            }
        });
    }

    const importMapScript = `<script type="importmap">\n${JSON.stringify({ imports }, null, 2)}\n</script>`;
    const validatorScript = DEPENDENCY_VALIDATOR_SCRIPT(imports);
    
    // 2. Prepare Injection Assets
    const styles = files.filter(x => x.name.endsWith('.css')).map(f => ({ name: f.name, content: `<style>/* ${f.name} */\n${f.content}\n</style>` }));
    const modules = files.filter(x => /\.(js|jsx|ts|tsx)$/.test(x.name)).map(f => {
        return { name: f.name, content: `<script type="module">\n// ${f.name}\n${f.content}\n</script>` };
    });

    const countLines = (str: string) => (str.match(/\n/g) || []).length;

    // 3. Split HTML for Injection
    const parts = finalHtml.split('</head>');
    let headPart = parts[0];
    if (!headPart.includes('<head>')) headPart = '<head>' + headPart;

    const headCloseIndex = finalHtml.indexOf('</head>');
    const bodyCloseIndex = finalHtml.indexOf('</body>');
    
    let currentLine = 1;
    
    // A. Pre-Head
    const preHead = finalHtml.substring(0, headCloseIndex);
    currentLine += countLines(preHead);
    
    // B. Injections in Head
    // Order: Selector -> EnvHandler -> ErrorHandler -> ImportMap -> Validator -> Tailwind -> Styles
    let headInjections = ELEMENT_SELECTOR_SCRIPT + '\n' + ENV_HANDLING_SCRIPT + '\n' + ERROR_HANDLER_SCRIPT + '\n' + importMapScript + '\n' + validatorScript + '\n' + '<script src="https://cdn.tailwindcss.com"></script>\n';
    currentLine += countLines(headInjections);
    
    let styleInjections = "";
    styles.forEach(s => {
        styleInjections += s.content + '\n';
        currentLine += countLines(s.content) + 1;
    });
    
    // C. Body Content
    const bodyContent = finalHtml.substring(headCloseIndex + 7, bodyCloseIndex);
    currentLine += countLines(bodyContent);

    // D. Script Injections
    let scriptInjections = "";
    modules.forEach(m => {
        const startLine = currentLine + 2; 
        const contentLines = countLines(m.content);
        newSourceMap[m.name] = { start: startLine, end: startLine + contentLines, file: m.name };
        scriptInjections += m.content + '\n';
        currentLine += contentLines + 1;
    });
    
    // E. Post Body
    const postBody = finalHtml.substring(bodyCloseIndex);
    
    const composedHtml = preHead + headInjections + styleInjections + '</head>' + bodyContent + scriptInjections + postBody;
    
    return { html: composedHtml, sourceMap: newSourceMap };
};
