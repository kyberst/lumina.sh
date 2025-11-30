import React, { useEffect, useRef } from 'react';

interface SyntaxHighlighterProps {
  code: string;
  language: string;
  className?: string;
}

export const SyntaxHighlighter: React.FC<SyntaxHighlighterProps> = ({ code, language, className = '' }) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current && (window as any).Prism) {
      // Normalize language for Prism
      let prismLang = language.toLowerCase();
      if (prismLang === 'js' || prismLang === 'jsx') prismLang = 'javascript';
      if (prismLang === 'ts' || prismLang === 'tsx') prismLang = 'typescript';
      if (prismLang === 'html') prismLang = 'markup';
      
      // Ensure the language is loaded in Prism, fallback to javascript or text
      const langObj = (window as any).Prism.languages[prismLang] || (window as any).Prism.languages.javascript;
      
      if (langObj) {
        // Manually highlight to avoid double-escaping issues with innerHTML
         codeRef.current.innerHTML = (window as any).Prism.highlight(code, langObj, prismLang);
      } else {
         codeRef.current.textContent = code;
      }
    }
  }, [code, language]);

  return (
    <pre className={`!m-0 !bg-transparent !p-0 ${className}`}>
      <code ref={codeRef} className={`language-${language}`}>
        {code}
      </code>
    </pre>
  );
};