
import { useEffect, useRef } from 'react';
import { CodeAnnotation } from '../../../types';
import { PluginFactory } from '../../../features/editor/pluginFactory';

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  scrollToLine?: number | null;
  onMount?: (api: any) => void;
  annotations?: CodeAnnotation[];
  readOnly?: boolean;
}

export const useCodeEditor = ({ value, language, onChange, scrollToLine, onMount, annotations = [], readOnly = false }: CodeEditorProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<any>(null);
    const decorationRef = useRef<any[]>([]);
    
    const annotationsRef = useRef<CodeAnnotation[]>(annotations);
    const providerDisposableRef = useRef<any>(null);

    useEffect(() => { annotationsRef.current = annotations; }, [annotations]);

    useEffect(() => {
        const initMonaco = async () => {
            if (!(window as any).require) await new Promise(r => setTimeout(r, 200));
            
            if (containerRef.current && (window as any).require) {
                (window as any).require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }});
                (window as any).require(['vs/editor/editor.main'], () => {
                    const monaco = (window as any).monaco;
                    if (!editorRef.current) {
                        editorRef.current = monaco.editor.create(containerRef.current!, {
                            value, language: 'typescript', theme: 'vs-dark', automaticLayout: true, minimap: { enabled: true },
                            fontSize: 13, fontFamily: 'JetBrains Mono, monospace', scrollBeyondLastLine: false, padding: { top: 16 }, readOnly
                        });
                        editorRef.current.onDidChangeModelContent(() => { if (!readOnly) onChange(editorRef.current.getValue()); });
                        if (onMount) onMount({
                            getSelection: () => editorRef.current.getModel().getValueInRange(editorRef.current.getSelection()),
                            getPosition: () => editorRef.current.getPosition()
                        });
                    }
                });
            }
        };
        initMonaco();
        return () => { editorRef.current?.dispose(); providerDisposableRef.current?.dispose(); };
    }, []);

    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.getValue()) editorRef.current.setValue(value);
    }, [value]);

    useEffect(() => {
        if (editorRef.current && (window as any).monaco) {
            const monaco = (window as any).monaco;
            const monacoLang = language === 'js' ? 'javascript' : language;
            monaco.editor.setModelLanguage(editorRef.current.getModel(), monacoLang);
            if (providerDisposableRef.current) providerDisposableRef.current.dispose();
            const plugin = PluginFactory.getPlugin(monacoLang);
            plugin.onMount(monaco, editorRef.current);
            providerDisposableRef.current = plugin.registerProviders(monaco, () => annotationsRef.current);
        }
    }, [language]);

    useEffect(() => { if (editorRef.current) editorRef.current.updateOptions({ readOnly }); }, [readOnly]);

    useEffect(() => {
        if (editorRef.current && (window as any).monaco) {
            const monaco = (window as any).monaco;
            const model = editorRef.current.getModel();
            const markers = annotations.map(a => ({
                severity: a.type === 'error' ? monaco.MarkerSeverity.Error : a.type === 'warning' ? monaco.MarkerSeverity.Warning : monaco.MarkerSeverity.Info,
                startLineNumber: a.line, startColumn: 1, endLineNumber: a.line, endColumn: 1000, message: a.message
            }));
            monaco.editor.setModelMarkers(model, "lumina-linter", markers);
        }
    }, [annotations]);

    useEffect(() => {
        if (editorRef.current && scrollToLine && (window as any).monaco) {
            editorRef.current.revealLineInCenter(scrollToLine);
            const range = new (window as any).monaco.Range(scrollToLine, 1, scrollToLine, 1);
            decorationRef.current = editorRef.current.deltaDecorations(decorationRef.current, [{ range, options: { isWholeLine: true, className: 'bg-red-500/20 border-l-2 border-red-500' } }]);
            setTimeout(() => { if (editorRef.current) decorationRef.current = editorRef.current.deltaDecorations(decorationRef.current, []); }, 2000);
        }
    }, [scrollToLine]);

    return { containerRef };
};
