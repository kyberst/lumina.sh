
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
    if (msg === 'ResizeObserver loop completed with undelivered notifications.' || 
        msg === 'ResizeObserver loop limit exceeded') {
        return false;
    }
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
    // Suppress benign ResizeObserver errors in console.error as well if they slip through
    if (msg.includes('ResizeObserver loop')) return;
    
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

/**
 * Script for visual element selection within the iframe.
 * Framework agnostic (works on DOM).
 */
export const ELEMENT_SELECTOR_SCRIPT = `
<style>
  .lumina-inspector-highlight {
    outline: 2px solid #4f46e5 !important;
    outline-offset: -2px !important;
    cursor: crosshair !important;
    background-color: rgba(79, 70, 229, 0.1) !important;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.2) !important;
  }
  #lumina-element-inspector-menu {
    position: absolute;
    z-index: 999999;
    background: #1e293b; /* slate-800 */
    border: 1px solid #334155; /* slate-700 */
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.2), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    border-radius: 8px;
    padding: 6px;
    display: flex;
    gap: 4px;
    font-family: sans-serif;
    transform: translate(-50%, 10px);
  }
  #lumina-element-inspector-menu::before {
    content: '';
    position: absolute;
    top: -5px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-bottom: 5px solid #334155;
  }
  #lumina-element-inspector-menu button {
    background: #334155;
    border: none;
    color: #cbd5e1; /* slate-300 */
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s;
    white-space: nowrap;
  }
  #lumina-element-inspector-menu button:hover {
    background: #4f46e5; /* indigo-600 */
    color: #ffffff; /* white */
  }
</style>
<script>
(function() {
  let menu = null;
  let currentHighlight = null;

  function getCssSelector(el) {
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
        if (nth != 1) selector += ":nth-of-type("+nth+")";
      }
      path.unshift(selector);
      el = el.parentNode;
    }
    return path.join(" > ");
  }

  function getComputedProperties(el) {
    if (!el) return null;
    const s = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    
    // Capture HTML structure for context
    const htmlSnippet = el.outerHTML; 

    return {
        color: s.color,
        backgroundColor: s.backgroundColor,
        fontSize: s.fontSize,
        display: s.display,
        width: Math.round(rect.width) + 'px',
        height: Math.round(rect.height) + 'px',
        margin: {
            top: s.marginTop,
            right: s.marginRight,
            bottom: s.marginBottom,
            left: s.marginLeft
        },
        padding: {
            top: s.paddingTop,
            right: s.paddingRight,
            bottom: s.paddingBottom,
            left: s.paddingLeft
        },
        textContent: el.innerText ? el.innerText.substring(0, 500) : '',
        html: htmlSnippet // New field
    };
  }

  function createMenu(target, selector) {
    if (menu) menu.remove();
    const rect = target.getBoundingClientRect();
    menu = document.createElement('div');
    menu.id = 'lumina-element-inspector-menu';
    menu.innerHTML = \`
      <button id="lumina-btn-chat" title="Use in Chat">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
      </button>
      <button id="lumina-btn-edit" title="Modify Style & Properties">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
        Edit Element
      </button>
    \`;
    document.body.appendChild(menu);
    
    // Position menu centered below element
    const top = window.scrollY + rect.bottom;
    const left = window.scrollX + rect.left + (rect.width / 2);
    
    menu.style.top = top + 'px';
    menu.style.left = left + 'px';

    document.getElementById('lumina-btn-chat').onclick = (e) => {
      e.stopPropagation();
      const styles = getComputedProperties(target);
      window.parent.postMessage({ type: 'ELEMENT_SELECTED_FOR_CHAT', selector, styles }, '*');
      if (menu) menu.remove();
      menu = null;
    };

    document.getElementById('lumina-btn-edit').onclick = (e) => {
      e.stopPropagation();
      const styles = getComputedProperties(target);
      window.parent.postMessage({ type: 'ELEMENT_SELECTED_FOR_EDIT', selector, styles }, '*');
      cleanup();
    };
  }
  
  function handleMouseOver(e) {
    if (e.target.closest('#lumina-element-inspector-menu')) return;
    
    // Stop propagation to ensure we select the exact element under cursor, not parent
    e.stopPropagation();

    // Remove highlight from previous element if it exists
    if (currentHighlight && currentHighlight !== e.target) {
        currentHighlight.classList.remove('lumina-inspector-highlight');
    }

    currentHighlight = e.target;
    currentHighlight.classList.add('lumina-inspector-highlight');
  }

  function handleMouseOut(e) {
    // When mouse leaves an element, remove the highlight
    if (e.target.classList.contains('lumina-inspector-highlight')) {
        e.target.classList.remove('lumina-inspector-highlight');
    }
  }

  function handleClick(e) {
    if (e.target.closest('#lumina-element-inspector-menu')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    
    if (menu) {
        menu.remove();
        menu = null;
    }
    const selector = getCssSelector(e.target);
    createMenu(e.target, selector);
  }

  function cleanup() {
    if (menu) menu.remove();
    menu = null;
    if (currentHighlight) {
        currentHighlight.classList.remove('lumina-inspector-highlight');
        currentHighlight = null;
    }
    document.body.removeAttribute('data-lumina-select-mode');
    document.body.removeEventListener('click', handleClick, true);
    document.body.removeEventListener('mouseover', handleMouseOver, true);
    document.body.removeEventListener('mouseout', handleMouseOut, true);
  }

  window.addEventListener('message', (e) => {
    if (e.data.type === 'TOGGLE_SELECTION_MODE') {
      if (e.data.active) {
        document.body.setAttribute('data-lumina-select-mode', 'true');
        document.body.addEventListener('click', handleClick, true);
        document.body.addEventListener('mouseover', handleMouseOver, true);
        document.body.addEventListener('mouseout', handleMouseOut, true);
      } else {
        cleanup();
      }
    }
  });
})();
</script>
`;