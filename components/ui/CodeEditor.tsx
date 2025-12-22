
import React, { useEffect, useRef } from 'react';
import { CodeAnnotation } from '../../types';
import { PluginFactory } from '../../features/editor/pluginFactory';

/** API exposed by the CodeEditor component */
export interface CodeEditorApi {
  getSelection: () => string;
  getPosition: () => { lineNumber: number, column: number } | null;
}

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  className?: string;
  scrollToLine?: number | null;
  onMount?: (api: CodeEditorApi) => void;
  annotations?: CodeAnnotation[];
  readOnly?: boolean;
}

/**
 * Wrapper for Monaco Editor.
 * Now uses the Plugin Architecture for modular language support and Quick Fixes.
 */
export const CodeEditor: React.FC<CodeEditorProps> = ({ 
    value, language, onChange, className = '', 
    scrollToLine, onMount, annotations = [], readOnly = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const decorationRef = useRef<any[]>([]);
  
  // Refs to hold state for callbacks without re-triggering effects
  const annotationsRef = useRef<CodeAnnotation[]>(annotations);
  const providerDisposableRef = useRef<any>(null);
  const currentPluginRef = useRef<any>(null);

  // Keep annotations ref synced for the callback closure inside Plugins
  useEffect(() => { annotationsRef.current = annotations; }, [annotations]);

  useEffect(() => {
    const initMonaco = async () => {
        // Poll for Monaco global (loaded via script tag)
        let attempts = 0;
        while (!(window as any).require && attempts < 20) {
            await new Promise(r => setTimeout(r, 200));
            attempts++;
        }
        
        if (containerRef.current && (window as any).require) {
          (window as any).require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }});
    
          (window as any).require(['vs/editor/editor.main'], () => {
            let monacoLang = language === 'js' ? 'javascript' : language === 'ts' ? 'typescript' : language;
            const monaco = (window as any).monaco;

            // 1. Initialize Editor Instance
            if (!editorRef.current && containerRef.current) {
              editorRef.current = monaco.editor.create(containerRef.current, {
                value: value,
                language: monacoLang,
                theme: 'vs-dark',
                automaticLayout: true,
                minimap: { enabled: true },
                fontSize: 13,
                fontFamily: 'JetBrains Mono, monospace',
                scrollBeyondLastLine: false,
                padding: { top: 16 },
                readOnly: readOnly
              });
    
              editorRef.current.onDidChangeModelContent(() => {
                if (!readOnly) {
                   onChange(editorRef.current.getValue());
                }
              });

              // API Exposure
              if (onMount) {
                  onMount({
                      getSelection: () => {
                          const selection = editorRef.current?.getSelection();
                          if (!selection) return "";
                          return editorRef.current?.getModel()?.getValueInRange(selection) || "";
                      },
                      getPosition: () => editorRef.current?.getPosition() || null
                  });
              }
            }
            
            // 2. Load Plugin for the specific language
            if (editorRef.current) {
                // Dispose previous plugin resources
                if (providerDisposableRef.current) {
                    providerDisposableRef.current.dispose();
                }

                // Initialize New Plugin
                const plugin = PluginFactory.getPlugin(monacoLang);
                plugin.onMount(monaco, editorRef.current);
                
                // Register Quick Fixes (Linter logic abstracted in plugin)
                const disposable = plugin.registerProviders(monaco, () => annotationsRef.current);
                
                providerDisposableRef.current = disposable;
                currentPluginRef.current = plugin;
                
                // Ensure model language is correct (handling prop updates)
                monaco.editor.setModelLanguage(editorRef.current.getModel(), monacoLang);
            }
          });
        }
    };
    initMonaco();
    
    return () => {
        editorRef.current?.dispose();
        if (providerDisposableRef.current) {
            providerDisposableRef.current.dispose();
        }
    };
  }, []); // Run once on mount, language updates handled below

  // Handle Value Updates
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
       editorRef.current.setValue(value);
    }
  }, [value]);

  // Handle Language/Plugin Updates
  useEffect(() => {
    if (editorRef.current && (window as any).monaco) {
       let monacoLang = language === 'js' ? 'javascript' : language === 'ts' ? 'typescript' : language;
       const monaco = (window as any).monaco;

       // Switch Language
       monaco.editor.setModelLanguage(editorRef.current.getModel(), monacoLang);

       // Switch Plugin Logic
       if (providerDisposableRef.current) providerDisposableRef.current.dispose();
       const plugin = PluginFactory.getPlugin(monacoLang);
       plugin.onMount(monaco, editorRef.current);
       providerDisposableRef.current = plugin.registerProviders(monaco, () => annotationsRef.current);
       currentPluginRef.current = plugin;
    }
  }, [language]);

  // Handle ReadOnly State
  useEffect(() => {
      if (editorRef.current) {
          editorRef.current.updateOptions({ readOnly: readOnly });
      }
  }, [readOnly]);

  // Handle Annotations Visualization (Rendering Markers)
  useEffect(() => {
      if (editorRef.current && (window as any).monaco) {
          const monaco = (window as any).monaco;
          const model = editorRef.current.getModel();
          
          if (!annotations.length) {
              monaco.editor.setModelMarkers(model, "lumina-linter", []);
              return;
          }

          const markers = annotations.map(a => ({
              severity: a.type === 'error' ? monaco.MarkerSeverity.Error : 
                        a.type === 'warning' ? monaco.MarkerSeverity.Warning : 
                        monaco.MarkerSeverity.Info,
              startLineNumber: a.line,
              startColumn: 1, 
              endLineNumber: a.line,
              endColumn: 1000, 
              message: a.message
          }));

          monaco.editor.setModelMarkers(model, "lumina-linter", markers);
      }
  }, [annotations]);

  // Scroll to line logic
  useEffect(() => {
      if (editorRef.current && scrollToLine && (window as any).monaco) {
          editorRef.current.revealLineInCenter(scrollToLine);
          decorationRef.current = editorRef.current.deltaDecorations(decorationRef.current, [{
                  range: new (window as any).monaco.Range(scrollToLine, 1, scrollToLine, 1),
                  options: { isWholeLine: true, className: 'bg-red-500/20 border-l-2 border-red-500' }
          }]);
          setTimeout(() => editorRef.current && (decorationRef.current = editorRef.current.deltaDecorations(decorationRef.current, [])), 2000);
      }
  }, [scrollToLine]);

  return <div ref={containerRef} className={`w-full h-full ${className} ${readOnly ? 'opacity-90' : ''}`} />;
};
