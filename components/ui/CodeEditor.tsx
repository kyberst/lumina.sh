
import React, { useEffect, useRef } from 'react';
import { CodeAnnotation } from '../../types';

/** API exposed by the CodeEditor component */
export interface CodeEditorApi {
  getSelection: () => string;
  getPosition: () => { lineNumber: number, column: number };
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
 * Handles lazy loading, language mapping, and API exposure.
 * NOW INCLUDES: Quick Fix Action Provider for AI Suggestions.
 */
export const CodeEditor: React.FC<CodeEditorProps> = ({ 
    value, language, onChange, className = '', 
    scrollToLine, onMount, annotations = [], readOnly = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const decorationRef = useRef<any[]>([]);
  const annotationsRef = useRef<CodeAnnotation[]>(annotations);
  const providerDisposableRef = useRef<any>(null);

  // Keep annotations ref synced for the callback closure
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

              // Register Quick Fix Provider (Global registry, so we handle it carefully)
              // This allows the Lightbulb to appear when there is an AI Suggestion
              if (!providerDisposableRef.current) {
                  providerDisposableRef.current = monaco.languages.registerCodeActionProvider(monacoLang, {
                      provideCodeActions: (model: any, range: any, context: any) => {
                          const actions: any[] = [];
                          
                          // Check all markers intersecting the range
                          for (const marker of context.markers) {
                              // Find corresponding annotation
                              const anno = annotationsRef.current.find(a => 
                                  a.line === marker.startLineNumber && a.message === marker.message
                              );

                              // If annotation has a suggestion, create a Quick Fix action
                              if (anno && anno.suggestion) {
                                  actions.push({
                                      title: `Fix: Replace with "${anno.suggestion}"`,
                                      kind: "quickfix",
                                      isPreferred: true,
                                      edit: {
                                          edits: [{
                                              resource: model.uri,
                                              edit: {
                                                  range: marker, // Replace the error range
                                                  text: anno.suggestion
                                              }
                                          }]
                                      }
                                  });
                              }
                          }
                          return { actions: actions, dispose: () => {} };
                      }
                  });
              }

              // API Exposure for Parent Components
              if (onMount) {
                  onMount({
                      getSelection: () => {
                          const selection = editorRef.current.getSelection();
                          return editorRef.current.getModel().getValueInRange(selection);
                      },
                      getPosition: () => editorRef.current.getPosition()
                  });
              }
            }
          });
        }
    };
    initMonaco();
    
    // Cleanup provider on unmount to avoid duplicates
    return () => {
        editorRef.current?.dispose();
        if (providerDisposableRef.current) {
            providerDisposableRef.current.dispose();
            providerDisposableRef.current = null;
        }
    };
  }, []);

  // Update value from props
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
       editorRef.current.setValue(value);
    }
  }, [value]);

  // Update language
  useEffect(() => {
    if (editorRef.current && (window as any).monaco) {
       let monacoLang = language === 'js' ? 'javascript' : language === 'ts' ? 'typescript' : language;
       (window as any).monaco.editor.setModelLanguage(editorRef.current.getModel(), monacoLang);
    }
  }, [language]);

  // Update ReadOnly State
  useEffect(() => {
      if (editorRef.current) {
          editorRef.current.updateOptions({ readOnly: readOnly });
      }
  }, [readOnly]);

  // Update Annotations (Markers)
  useEffect(() => {
      if (editorRef.current && (window as any).monaco) {
          const monaco = (window as any).monaco;
          const model = editorRef.current.getModel();
          
          if (!annotations.length) {
              monaco.editor.setModelMarkers(model, "owner", []);
              return;
          }

          const markers = annotations.map(a => ({
              severity: a.type === 'error' ? monaco.MarkerSeverity.Error : 
                        a.type === 'warning' ? monaco.MarkerSeverity.Warning : 
                        monaco.MarkerSeverity.Info,
              startLineNumber: a.line,
              startColumn: 1, // Start of line
              endLineNumber: a.line,
              endColumn: 1000, // End of line (assuming < 1000 cols)
              message: a.message
          }));

          monaco.editor.setModelMarkers(model, "owner", markers);
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
