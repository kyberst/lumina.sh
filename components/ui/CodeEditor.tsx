
import React, { useEffect, useRef } from 'react';

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  className?: string;
  scrollToLine?: number | null;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, language, onChange, className = '', scrollToLine }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const decorationRef = useRef<any[]>([]);

  useEffect(() => {
    const initMonaco = async () => {
        // Wait for loader
        let attempts = 0;
        while (!(window as any).require && attempts < 20) {
            await new Promise(r => setTimeout(r, 200));
            attempts++;
        }
        
        if (containerRef.current && (window as any).require) {
          // Configure Monaco Loader
          (window as any).require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }});
    
          (window as any).require(['vs/editor/editor.main'], () => {
            // Map language to Monaco ID
            let monacoLang = language;
            if (language === 'js') monacoLang = 'javascript';
            if (language === 'ts') monacoLang = 'typescript';
            
            if (!editorRef.current && containerRef.current) {
              editorRef.current = (window as any).monaco.editor.create(containerRef.current, {
                value: value,
                language: monacoLang,
                theme: 'vs-dark',
                automaticLayout: true,
                minimap: { enabled: true },
                fontSize: 13,
                fontFamily: 'JetBrains Mono, monospace',
                scrollBeyondLastLine: false,
                padding: { top: 16 }
              });
    
              editorRef.current.onDidChangeModelContent(() => {
                onChange(editorRef.current.getValue());
              });
            }
          });
        }
    };
    initMonaco();

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, []);

  // Sync external value changes if needed (careful not to loop)
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
       editorRef.current.setValue(value);
    }
  }, [value]);

  // Sync Language
  useEffect(() => {
    if (editorRef.current && (window as any).monaco) {
       let monacoLang = language;
       if (language === 'js') monacoLang = 'javascript';
       if (language === 'ts') monacoLang = 'typescript';
       (window as any).monaco.editor.setModelLanguage(editorRef.current.getModel(), monacoLang);
    }
  }, [language]);

  // Handle Scroll To Line
  useEffect(() => {
      if (editorRef.current && scrollToLine && (window as any).monaco) {
          editorRef.current.revealLineInCenter(scrollToLine);
          
          // Add a temporary decoration highlight
          decorationRef.current = editorRef.current.deltaDecorations(decorationRef.current, [
              {
                  range: new (window as any).monaco.Range(scrollToLine, 1, scrollToLine, 1),
                  options: {
                      isWholeLine: true,
                      className: 'bg-red-500/20 border-l-2 border-red-500' // Custom class needs to be global or injected style
                  }
              }
          ]);
          
          // Clear decoration after 2s
          setTimeout(() => {
              if (editorRef.current) {
                  decorationRef.current = editorRef.current.deltaDecorations(decorationRef.current, []);
              }
          }, 2000);
      }
  }, [scrollToLine]);

  return <div ref={containerRef} className={`w-full h-full ${className}`} />;
};
