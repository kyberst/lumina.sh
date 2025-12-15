
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
    const stack = error ? error.stack : (new Error()).stack;
    window.parent.postMessage({ type: "CONSOLE_LOG", level: "error", message: msg, line: line || getStackLine(), column: col, stack: stack }, "*");
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
    const stack = new Error().stack;
    window.parent.postMessage({ type: "CONSOLE_LOG", level: "error", message: msg, line: getStackLine(), stack: stack }, "*");
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

/**
 * Script injected to allow element inspection in the preview iframe.
 */
export const ELEMENT_INSPECTOR_SCRIPT = `<script>
(function() {
    if (window._luminaInspectorAttached) return;
    window._luminaInspectorAttached = true;

    const style = document.createElement('style');
    style.innerHTML = \`
        [data-lumina-highlight] {
            outline: 2px solid #4f46e5 !important;
            box-shadow: 0 0 10px rgba(79, 70, 229, 0.5) !important;
            cursor: pointer;
        }
        [data-lumina-selected] {
            outline: 2px solid #10b981 !important;
            box-shadow: 0 0 0 4px #fff, 0 0 10px 4px rgba(16, 185, 129, 0.5) !important;
        }
    \`;
    document.head.appendChild(style);

    let highlightedEl = null;
    let selectedEl = null;

    function generateSelector(el) {
        if (!(el instanceof Element)) return;
        const path = [];
        while (el.nodeType === Node.ELEMENT_NODE) {
            let selector = el.nodeName.toLowerCase();
            if (el.id) {
                selector += '#' + el.id;
                path.unshift(selector);
                break;
            } else {
                let sib = el, nth = 1;
                while (sib = sib.previousElementSibling) {
                    if (sib.nodeName.toLowerCase() == selector) nth++;
                }
                if (nth !== 1) selector += ":nth-of-type("+nth+")";
            }
            path.unshift(selector);
            el = el.parentNode;
        }
        return path.join(" > ");
    }

    document.body.addEventListener('mouseover', function(e) {
        if (highlightedEl) highlightedEl.removeAttribute('data-lumina-highlight');
        highlightedEl = e.target;
        if (highlightedEl && highlightedEl.nodeType === 1 && highlightedEl !== selectedEl) {
            highlightedEl.setAttribute('data-lumina-highlight', 'true');
        }
    });

    document.body.addEventListener('mouseout', function(e) {
        if (highlightedEl) {
            highlightedEl.removeAttribute('data-lumina-highlight');
            highlightedEl = null;
        }
    });
    
    document.body.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        if (selectedEl) selectedEl.removeAttribute('data-lumina-selected');
        selectedEl = e.target;
        selectedEl.setAttribute('data-lumina-selected', 'true');
        if (highlightedEl) highlightedEl.removeAttribute('data-lumina-highlight');

        const data = {
            selector: generateSelector(selectedEl),
            tagName: selectedEl.tagName,
            textContent: selectedEl.children.length === 0 ? selectedEl.textContent.trim() : '',
            className: typeof selectedEl.className === 'string' ? selectedEl.className : '',
            outerHTML: selectedEl.outerHTML,
        };
        window.parent.postMessage({ type: 'ELEMENT_SELECTED', element: data }, '*');
    }, true);
})();
</script>`;
