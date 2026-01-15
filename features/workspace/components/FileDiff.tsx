
import React, { useMemo } from 'react';
import { computeSideBySideDiff, DiffBlock } from '../../../services/ai/diffUtils';
import { t } from '../../../services/i18n';

interface FileDiffProps {
    oldContent: string;
    newContent: string;
}

export const FileDiff: React.FC<FileDiffProps> = ({ oldContent, newContent }) => {
    const blocks = useMemo(() => computeSideBySideDiff(oldContent, newContent), [oldContent, newContent]);

    return (
        <div className="flex flex-col text-[10px] sm:text-xs font-mono bg-slate-900 text-slate-300 rounded-b-xl overflow-hidden">
             {/* Header Columns */}
             <div className="grid grid-cols-2 border-b border-slate-700 bg-slate-800 text-slate-400 font-bold select-none">
                 <div className="p-2 text-center border-r border-slate-700">{t('diff.actual', 'journal')}</div>
                 <div className="p-2 text-center">{t('diff.new', 'journal')}</div>
             </div>
             
             <div className="overflow-x-auto custom-scrollbar">
                <div className="min-w-[600px]">
                    {blocks.map((block, bIdx) => (
                        <div key={bIdx}>
                            {block.oldLines.map((oldLine, i) => {
                                const newLine = block.newLines[i];
                                return (
                                    <div key={i} className="grid grid-cols-2 hover:bg-slate-800/50 group border-b border-slate-800/20">
                                        {/* Left Column (Old) */}
                                        <div className={`
                                            flex border-r border-slate-700/50 relative
                                            ${oldLine.type === 'del' ? 'bg-[#3f0f0f] text-red-200' : ''}
                                            ${oldLine.type === 'gap' ? 'bg-[url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhZWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==")] opacity-30' : ''}
                                        `}>
                                            <span className="w-8 text-right pr-2 text-slate-500 select-none bg-slate-900/30 shrink-0 opacity-60">
                                                {oldLine.lineNum || ''}
                                            </span>
                                            <pre className={`whitespace-pre-wrap break-all px-2 py-0.5 flex-1 ${oldLine.type === 'del' ? 'line-through decoration-red-500/50 opacity-70' : ''}`}>
                                                {oldLine.content}
                                            </pre>
                                        </div>

                                        {/* Right Column (New) */}
                                        <div className={`
                                            flex relative
                                            ${newLine.type === 'add' ? 'bg-[#0f3f22] text-emerald-200' : ''}
                                            ${newLine.type === 'gap' ? 'bg-[url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhZWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==")] opacity-30' : ''}
                                        `}>
                                             <span className="w-8 text-right pr-2 text-slate-500 select-none bg-slate-900/30 shrink-0 opacity-60">
                                                {newLine.lineNum || ''}
                                            </span>
                                            <pre className="whitespace-pre-wrap break-all px-2 py-0.5 flex-1">
                                                {newLine.content}
                                            </pre>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
             </div>
        </div>
    );
};
