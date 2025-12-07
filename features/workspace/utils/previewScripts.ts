
/**
 * Script injected to capture errors and send them to parent.
 */
export const ERROR_HANDLER_SCRIPT = `<script>
(function(){
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
    window.parent.postMessage({ type: "CONSOLE_LOG", level: "error", message: msg, line: line || getStackLine(), column: col }, "*");
    return false;
  };
  const _log = console.log;
  console.log = function(...args) {
    const msg = args.map(a => { try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } catch(e) { return String(a); } }).join(' ');
    window.parent.postMessage({ type: "CONSOLE_LOG", level: "info", message: msg, line: getStackLine() }, "*");
    _log.apply(console, args);
  };
  const _error = console.error;
  console.error = function(...args) {
    const msg = args.map(a => { try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } catch(e) { return String(a); } }).join(' ');
    window.parent.postMessage({ type: "CONSOLE_LOG", level: "error", message: msg, line: getStackLine() }, "*");
    _error.apply(console, args);
  };
})();
</script>`;

/**
 * Script to polyfill process.env and listen for secure injection.
 */
export const ENV_HANDLING_SCRIPT = `<script>
(function() {
  window.process = window.process || {};
  window.process.env = window.process.env || {};
  
  // Notify parent we are ready for secrets
  window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');

  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'ENV_INJECTION') {
       window.process.env = { ...window.process.env, ...event.data.env };
       console.log('[System] Secure Environment Variables Injected');
    }
  });
})();
</script>`;

/**
 * Script to validate dependencies.
 */
export const DEPENDENCY_VALIDATOR_SCRIPT = (imports: Record<string, string>) => `
<script>
(async function() {
  const deps = ${JSON.stringify(Object.keys(imports))};
  if (deps.length === 0) return;
  window.parent.postMessage({ type: 'DEP_LOAD_START', count: deps.length }, '*');
  const results = await Promise.allSettled(deps.map(d => import(d)));
  const failures = results.map((r, i) => r.status === 'rejected' ? deps[i] : null).filter(Boolean);
  if (failures.length > 0) {
     console.error("Dependency Load Failed for: " + failures.join(', '));
     window.parent.postMessage({ type: 'DEP_LOAD_ERROR', failures }, '*');
  } else {
     window.parent.postMessage({ type: 'DEP_LOAD_COMPLETE' }, '*');
  }
})();
</script>
`;
