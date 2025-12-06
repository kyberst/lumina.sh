
import { GeneratedFile } from "../../../types";

interface SourceMapEntry {
    start: number;
    end: number;
    file: string;
}

/**
 * Script injected into the iframe to catch errors and send them to the parent window.
 * Includes stack trace parsing to extract line numbers from console.log/error calls.
 */
const ERROR_HANDLER_SCRIPT = `<script>
(function(){
  // Helper to extract line number from stack trace
  function getStackLine() {
    try { throw new Error(); } catch (e) {
      if (!e.stack) return 0;
      const lines = e.stack.split('\\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if ((line.includes('about:srcdoc') || line.includes('<anonymous>')) && !line.includes('getStackLine')) {
           const match = line.match(/:(\\d+):(\\d+)/);
           if (match) return parseInt(match[1]);
        }
      }
    }
    return 0;
  }

  window.onerror = function(msg, url, line, col, error) {
    window.parent.postMessage({
      type: "CONSOLE_LOG",
      level: "error",
      message: msg,
      line: line || getStackLine(),
      column: col
    }, "*");
    return false;
  };

  const _log = console.log;
  console.log = function(...args) {
    const msg = args.map(a => {
        try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } 
        catch(e) { return String(a); }
    }).join(' ');

    window.parent.postMessage({ 
        type: "CONSOLE_LOG", 
        level: "info", 
        message: msg,
        line: getStackLine()
    }, "*");
    _log.apply(console, args);
  };

  const _error = console.error;
  console.error = function(...args) {
    const msg = args.map(a => {
        try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } 
        catch(e) { return String(a); }
    }).join(' ');

    window.parent.postMessage({ 
        type: "CONSOLE_LOG", 
        level: "error", 
        message: msg,
        line: getStackLine()
    }, "*");
    _error.apply(console, args);
  };
})();
</script>`;

/**
 * Script to validate that all dependencies in the import map can be resolved.
 * Sends 'DEP_LOAD_START' and 'DEP_LOAD_COMPLETE' to the parent.
 */
const DEPENDENCY_VALIDATOR_SCRIPT = (imports: Record<string, string>) => `
<script>
(async function() {
  const deps = ${JSON.stringify(Object.keys(imports))};
  if (deps.length === 0) return;

  window.parent.postMessage({ type: 'DEP_LOAD_START', count: deps.length }, '*');
  
  const results = await Promise.allSettled(deps.map(d => import(d)));
  
  const failures = results
    .map((r, i) => r.status === 'rejected' ? deps[i] : null)
    .filter(Boolean);

  if (failures.length > 0) {
     console.error("Dependency Load Failed for: " + failures.join(', '));
     window.parent.postMessage({ type: 'DEP_LOAD_ERROR', failures }, '*');
  } else {
     window.parent.postMessage({ type: 'DEP_LOAD_COMPLETE' }, '*');
  }
})();
</script>
`;

/**
 * Constructs the final HTML blob for the Live Preview.
 * Injects styles, scripts, dependencies (importmap), error handling, and dependency validation.
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
    // Order: ErrorHandler -> ImportMap -> Validator -> Tailwind -> Styles
    let headInjections = ERROR_HANDLER_SCRIPT + '\n' + importMapScript + '\n' + validatorScript + '\n' + '<script src="https://cdn.tailwindcss.com"></script>\n';
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
