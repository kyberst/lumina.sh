
import { useState, useRef, useEffect, useMemo } from 'react';
import { GeneratedFile, EnvVarRequest, DependencyDetails, ConsoleLog } from '../../../types';
import { generateIframeHtml } from '../utils/iframeBuilder';

interface SourceMapEntry { start: number; end: number; file: string; }

export const usePreviewSystem = (
    files: GeneratedFile[], 
    dependencies: Record<string, string | DependencyDetails> | undefined, 
    iframeKey: number,
    envVars?: Record<string, string>,
    requiredRequests?: EnvVarRequest[]
) => {
    const [showConsole, setShowConsole] = useState(false);
    const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
    const [errorCount, setErrorCount] = useState(0);
    const sourceMapRef = useRef<Record<string, SourceMapEntry>>({});
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const iframeSrc = useMemo(() => {
        const { html, sourceMap } = generateIframeHtml(files, dependencies);
        sourceMapRef.current = sourceMap;
        return html;
    }, [files, dependencies, iframeKey]);

    useEffect(() => {
        const handler = (e: MessageEvent) => {
            // 1. Secure Env Injection Handshake
            if (e.data?.type === 'PREVIEW_READY') {
                if (envVars && requiredRequests) {
                    // Filter: Only inject keys that were explicitly requested by the AI
                    const allowedKeys = requiredRequests.map(r => r.key);
                    const safeEnv: Record<string, string> = {};
                    
                    Object.entries(envVars).forEach(([k, v]) => {
                        if (allowedKeys.includes(k) || k.startsWith('VITE_') || k.startsWith('PUBLIC_')) {
                            safeEnv[k] = v;
                        }
                    });

                    // Send to specific iframe window
                    const target = iframeRef.current?.contentWindow || (e.source as Window);
                    target.postMessage({ type: 'ENV_INJECTION', env: safeEnv }, '*');
                }
            }
            
            // 2. Console Logs
            else if (e.data?.type === 'CONSOLE_LOG') {
                const rawLine = e.data.line || 0;
                let mappedSource: any = undefined;
                if (rawLine > 0) {
                    for (const [_, range] of Object.entries(sourceMapRef.current)) {
                        const entry = range as SourceMapEntry;
                        if (rawLine >= entry.start && rawLine <= entry.end) {
                            mappedSource = { file: entry.file, line: rawLine - entry.start + 1 };
                            break;
                        }
                    }
                }
                
                const newLog: ConsoleLog = {
                    id: crypto.randomUUID(),
                    type: e.data.level, 
                    msg: e.data.message, 
                    time: new Date().toLocaleTimeString(), 
                    source: mappedSource 
                };

                setConsoleLogs(p => [...p, newLog]);
                if (e.data.level === 'error') setErrorCount(c => c + 1);
            }
        };
        
        setConsoleLogs([]); setErrorCount(0);
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [iframeKey, envVars, requiredRequests]);

    return { 
        iframeSrc, 
        consoleLogs, 
        errorCount, 
        showConsole, 
        setShowConsole, 
        clearLogs: () => setConsoleLogs([]),
        iframeRef // Expose ref to bind to iframe element
    };
};
