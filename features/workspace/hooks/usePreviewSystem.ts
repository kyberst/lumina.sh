import { useState, useRef, useEffect, useMemo } from 'react';
import { GeneratedFile } from '../../../types';
import { generateIframeHtml } from '../utils/iframeBuilder';

interface SourceMapEntry { start: number; end: number; file: string; }

export const usePreviewSystem = (files: GeneratedFile[], dependencies: Record<string, string> | undefined, iframeKey: number) => {
    const [showConsole, setShowConsole] = useState(false);
    const [consoleLogs, setConsoleLogs] = useState<any[]>([]);
    const [errorCount, setErrorCount] = useState(0);
    const sourceMapRef = useRef<Record<string, SourceMapEntry>>({});

    const iframeSrc = useMemo(() => {
        const { html, sourceMap } = generateIframeHtml(files, dependencies);
        sourceMapRef.current = sourceMap;
        return html;
    }, [files, dependencies, iframeKey]);

    useEffect(() => {
        const handler = (e: MessageEvent) => {
            if (e.data?.type === 'CONSOLE_LOG') {
                const rawLine = e.data.line || 0;
                let mappedSource: any = undefined;
                if (rawLine > 0) {
                    for (const [_, range] of Object.entries(sourceMapRef.current)) {
                        if (rawLine >= range.start && rawLine <= range.end) {
                            mappedSource = { file: range.file, line: rawLine - range.start + 1 };
                            break;
                        }
                    }
                }
                setConsoleLogs(p => [...p, { type: e.data.level, msg: e.data.message, time: new Date().toLocaleTimeString(), source: mappedSource }]);
                if (e.data.level === 'error') setErrorCount(c => c + 1);
            }
        };
        setConsoleLogs([]); setErrorCount(0);
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [iframeKey]);

    return { iframeSrc, consoleLogs, errorCount, showConsole, setShowConsole, clearLogs: () => setConsoleLogs([]) };
};