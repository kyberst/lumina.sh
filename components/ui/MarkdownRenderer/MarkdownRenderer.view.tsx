
import React from 'react';
import { SyntaxHighlighter } from '../SyntaxHighlighter';
import { t } from '../../../services/i18n';

interface Part {
  type: 'text' | 'code';
  content: string;
  language?: string;
}

interface MarkdownRendererViewProps {
  parts: Part[];
  className?: string;
}

const renderInlineMarkdown = (text: string) => {
    const boldParts = text.split(/(\*\*.*?\*\*)/g);
    return boldParts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
        }
        const italicParts = part.split(/(\*.*?\*)/g);
        return <span key={i}>{italicParts.map((subPart, j) => {
            if (subPart.startsWith('*') && subPart.endsWith('*') && subPart.length > 2) {
                return <em key={j} className="italic">{subPart.slice(1, -1)}</em>;
            }
            return subPart;
        })}</span>;
    });
};

export const MarkdownRendererView: React.FC<MarkdownRendererViewProps> = ({ parts, className }) => {
  return (
    <div className={`font-sans text-sm leading-relaxed space-y-4 ${className}`}>
      {parts.map((part, index) => {
        if (part.type === 'code') {
          const lineCount = part.content.split('\n').length;
          const isTooLong = lineCount > 200;
          return (
            <div key={index} className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm my-4 group">
              <div className="px-3 py-2 bg-slate-100/50 border-b flex justify-between items-center select-none">
                 <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">{t('proposedCode', 'markdown')}</span>
                    <div className="h-3 w-px bg-slate-300"></div>
                    <span className="text-[10px] text-slate-500 font-mono font-medium lowercase">{part.language}</span>
                 </div>
                 <div className="flex items-center gap-3">
                     <span className={`text-[10px] font-mono ${isTooLong ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>{lineCount} {t('lines', 'markdown')}</span>
                    <button onClick={() => navigator.clipboard.writeText(part.content)} className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-indigo-600 uppercase tracking-wider transition-colors bg-white border border-slate-200 hover:border-indigo-200 px-2 py-1 rounded shadow-sm" title={t('copy', 'markdown')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        <span>{t('copy', 'markdown')}</span>
                    </button>
                 </div>
              </div>
              <div className="p-4 overflow-x-auto custom-scrollbar bg-[#1e1e1e]"><SyntaxHighlighter code={part.content} language={part.language!} /></div>
            </div>
          );
        } else {
          return <div key={index} className="whitespace-pre-wrap">{renderInlineMarkdown(part.content)}</div>;
        }
      })}
    </div>
  );
};
