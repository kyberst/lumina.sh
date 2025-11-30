import React from 'react';
import { SyntaxHighlighter } from './SyntaxHighlighter';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

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
        return <strong key={i} className="text-emerald-400 font-bold">{part.slice(2, -2)}</strong>;
      }
      
      // Split by Italic (*...*)
      const italicParts = part.split(/(\*.*?\*)/g);
      return (
        <span key={i}>
          {italicParts.map((subPart, j) => {
             if (subPart.startsWith('*') && subPart.endsWith('*') && subPart.length > 2) {
               return <em key={j} className="text-emerald-200/80 italic">{subPart.slice(1, -1)}</em>;
             }
             return subPart;
          })}
        </span>
      );
    });
  };

  return (
    <div className={`font-sans text-sm leading-relaxed space-y-3 ${className}`}>
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return (
            <div key={index} className="rounded-lg overflow-hidden border border-white/10 bg-[#1e1e1e] shadow-lg my-2 group">
              <div className="px-3 py-1.5 bg-white/5 border-b border-white/5 flex justify-between items-center">
                 <span className="text-[10px] text-emerald-400/80 uppercase tracking-widest font-mono">
                  {part.language}
                 </span>
                 <button 
                   onClick={() => navigator.clipboard.writeText(part.content)}
                   className="text-[10px] text-slate-500 hover:text-white uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity"
                 >
                   Copy
                 </button>
              </div>
              <div className="p-3 overflow-x-auto">
                 <SyntaxHighlighter code={part.content} language={part.language} />
              </div>
            </div>
          );
        } else {
          return (
            <div key={index} className="whitespace-pre-wrap text-slate-300">
               {renderInlineMarkdown(part.content)}
            </div>
          );
        }
      })}
    </div>
  );
};