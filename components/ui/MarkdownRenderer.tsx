
import React, { useState } from 'react';
import { SyntaxHighlighter } from './SyntaxHighlighter';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const CodeBlock: React.FC<{ language: string; content: string }> = ({ language, content }) => {
    const [isOpen, setIsOpen] = useState(false);
    const lineCount = content.split('\n').length;
    const isTooLong = lineCount > 200;

    return (
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shadow-sm my-4 group text-slate-900 dark:text-slate-100">
            <div 
                className="px-3 py-2 bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-500/20">
                        {language || 'Code'}
                    </span>
                    <span className={`text-[10px] font-mono ${isTooLong ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                       {lineCount} lines {isTooLong && '(>200)'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {isOpen ? 'Hide Code' : 'Show Code'}
                    </span>
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                        className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    >
                        <path d="m6 9 6 6 6-6"/>
                    </svg>
                </div>
            </div>
            
            {isOpen && (
                <div className="relative">
                    <div className="absolute top-2 right-2 z-10">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(content);
                            }}
                            className="p-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded opacity-50 hover:opacity-100 transition-opacity"
                            title="Copy Code"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>
                    </div>
                    <div className="p-4 overflow-x-auto custom-scrollbar bg-[#1e1e1e] animate-in slide-in-from-top-1 duration-200">
                        <SyntaxHighlighter code={content} language={language} />
                    </div>
                </div>
            )}
        </div>
    );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split by code blocks (```language ... ```)
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Push text before code block
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex, match.index)
      });
    }

    // Push code block
    parts.push({
      type: 'code',
      language: match[1] || 'text',
      content: match[2].trim()
    });

    lastIndex = match.index + match[0].length;
  }

  // Push remaining text
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.slice(lastIndex)
    });
  }

  // Helper to render inline markdown (Bold, Italic) within text blocks
  const renderInlineMarkdown = (text: string) => {
    // Split by Bold (**...**)
    const boldParts = text.split(/(\*\*.*?\*\*)/g);
    
    return boldParts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Inherit color, just bold
        return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      
      // Split by Italic (*...*)
      const italicParts = part.split(/(\*.*?\*)/g);
      return (
        <span key={i}>
          {italicParts.map((subPart, j) => {
             if (subPart.startsWith('*') && subPart.endsWith('*') && subPart.length > 2) {
               // Inherit color, just italic
               return <em key={j} className="italic opacity-90">{subPart.slice(1, -1)}</em>;
             }
             return subPart;
          })}
        </span>
      );
    });
  };

  return (
    <div className={`font-sans text-sm leading-relaxed space-y-4 ${className}`}>
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return <CodeBlock key={index} language={part.language} content={part.content} />;
        } else {
          return (
            // Removed fixed text-slate-600 to allow inheritance from parent (e.g. ChatBubble)
            <div key={index} className="whitespace-pre-wrap text-inherit">
               {renderInlineMarkdown(part.content)}
            </div>
          );
        }
      })}
    </div>
  );
};
