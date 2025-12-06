import { GeneratedFile } from "../../../types";

interface SourceMapEntry {
    start: number;
    end: number;
    file: string;
}

/**
 * Script injected into the iframe to catch errors and send them to the parent window.
 */
const ERROR_HANDLER_SCRIPT = `<script>
(function(){
  window.onerror = function(msg, url, line, col, error) {
    window.parent.postMessage({
      type: "CONSOLE_LOG",
      level: "error",
      message: msg,
      line: line,
      column: col
    }, "*");
    return false;
  };
  const _log = console.log;
  console.log = function(...args) {
    window.parent.postMessage({ type: "CONSOLE_LOG", level: "info", message: args.join(' ') }, "*");
    _log.apply(console, args);
  };
  const _error = console.error;
  console.error = function(...args) {
    window.parent.postMessage({ type: "CONSOLE_LOG", level: "error", message: args.join(' ') }, "*");
    _error.apply(console, args);
  };
})();
</script>`;

/**
 * Constructs the final HTML blob for the Live Preview.
 * Injects styles, scripts, dependencies (importmap), and error handling.
 * Calculates line numbers for source mapping.
 */
export const generateIframeHtml = (
    files: GeneratedFile[], 
    dependencies: Record<string, string> | undefined
): { html: string; sourceMap: Record<string, SourceMapEntry> } => {
    
    const indexFile = files.find(x => x.name === 'index.html'); 
    if(!indexFile) return { html: '', sourceMap: {} };
    
    let finalHtml = indexFile.content;
    const newSourceMap: Record<string, SourceMapEntry> = {};

    // 1. Build Import Map
    const imports: Record<string, string> = {
       "react": "https://esm.sh/react@18.2.0",
       "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
       "lucide-react": "https://esm.sh/lucide-react@0.263.1",
       ...Object.entries(dependencies || {}).reduce((acc, [k,v]) => ({...acc, [k]: `https://esm.sh/${k}@${v}`}), {})
    };

    const importMapScript = `<script type="importmap">\n${JSON.stringify({ imports }, null, 2)}\n</script>`;
    
    // 2. Prepare Injection Assets
    const styles = files.filter(x => x.name.endsWith('.css')).map(f => ({ name: f.name, content: `<style>/* ${f.name} */\n${f.content}\n</style>` }));
    const modules = files.filter(x => /\.(js|jsx|ts|tsx)$/.test(x.name)).map(f => {
        // Only inject generic entry points or modules automatically
        if (['index.js','script.js','main.js','App.jsx','main.tsx'].includes(f.name)) {
            return { name: f.name, content: `<script type="module">\n// ${f.name}\n${f.content}\n</script>` };
        }
        return null; 
    }).filter(Boolean) as { name: string, content: string }[];

    // 3. Helper to count lines
    const countLines = (str: string) => (str.match(/\n/g) || []).length;

    // 4. Split HTML for Injection
    const parts = finalHtml.split('</head>');
    let headPart = parts[0];
    const restPart = parts[1] || '<body></body></html>';
    
    if (!headPart.includes('<head>')) headPart = '<head>' + headPart;

    // 5. Build Composed HTML & Calculate Map
    const headCloseIndex = finalHtml.indexOf('</head>');
    const bodyCloseIndex = finalHtml.indexOf('</body>');
    
    let currentLine = 1;
    
    // A. Pre-Head
    const preHead = finalHtml.substring(0, headCloseIndex);
    currentLine += countLines(preHead);
    
    // B. Injections in Head
    let headInjections = ERROR_HANDLER_SCRIPT + '\n' + '<script src="https://cdn.tailwindcss.com"></script>\n' + importMapScript + '\n';
    currentLine += countLines(headInjections);
    
    let styleInjections = "";
    styles.forEach(s => {
        styleInjections += s.content + '\n';
        currentLine += countLines(s.content) + 1;
    });
    
    // C. Body Content (between </head> and </body>)
    const bodyContent = finalHtml.substring(headCloseIndex + 7, bodyCloseIndex);
    currentLine += countLines(bodyContent);

    // D. Script Injections (Before </body>)
    let scriptInjections = "";
    modules.forEach(m => {
        const startLine = currentLine + 2; 
        const contentLines = countLines(m.content);
        
        newSourceMap[m.name] = {
            start: startLine,
            end: startLine + contentLines,
            file: m.name
        };
        
        scriptInjections += m.content + '\n';
        currentLine += contentLines + 1;
    });
    
    // E. Post Body
    const postBody = finalHtml.substring(bodyCloseIndex);
    
    const composedHtml = preHead + headInjections + styleInjections + '</head>' + bodyContent + scriptInjections + postBody;
    
    return { html: composedHtml, sourceMap: newSourceMap };
};
