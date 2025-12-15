
import React, { useState, useEffect, useMemo } from 'react';
import { GeneratedFile, AppSettings } from '../../../types';
import { SyntaxHighlighter } from '../../../components/ui/SyntaxHighlighter';
import { FileDiff } from './FileDiff';
import { toast } from '../../../services/toastService';
import { t } from '../../../services/i18n';
import { createPatch } from '../../../services/ai/diffUtils';

interface FileCardProps {
    file: GeneratedFile;
    originalFile?: GeneratedFile;
    isNew?: boolean;
    settings: AppSettings;
}

export const FileCard: React.FC<FileCardProps> = ({ file, originalFile, isNew, settings }) => {
    const { developerMode } = settings;
    // If it's a modified file, default to expanded and diff mode
    const [expanded, setExpanded] = useState(isNew && !!originalFile);
    const [mode, setMode] = useState<'code' | 'diff' | 'unified'>(
        isNew && !!originalFile ? (developerMode ? 'unified' : 'diff') : 'code'
    );
    
    const lines = file.content.split('\n').length;
    const isTooLong = lines > 200;

    const unifiedDiffContent = useMemo(() => {
        if (originalFile && mode === 'unified') {
            return createPatch(file.name, originalFile.content, file.content);
        }
        return '';
    }, [file, originalFile, mode]);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(file.content);
        toast.success(t('file.copied', 'builder'));
    };

    const getIconColor = (name: string) => {
        if (name.endsWith('ts') || name.endsWith('tsx')) return 'text-blue-500';
        if (name.endsWith('js') || name.endsWith('jsx')) return 'text-yellow-500';
        if (name.endsWith('css')) return 'text-sky-500';
        if (name.endsWith('html')) return 'text-orange-500';
        return 'text-slate-500';
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-all hover:shadow-md mb-3 group/card">
            {/* Header */}
            <div 
                className="flex items-center justify-between px-3 py-2.5 bg-slate-50 border-b border-slate-100 cursor-pointer select-none"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 ${getIconColor(file.name)} shadow-sm`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className="text-xs font-bold text-slate-700 truncate font-mono flex items-center gap-2">
                            {file.name}
                            {isNew && <span className="text-[9px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">{t('file.modified', 'builder')}</span>}
                        </div>
                        <div className={`text-[10px] font-mono flex items-center gap-1 ${isTooLong ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                            {lines} Lines
                            {isTooLong && <span className="text-amber-500 flex items-center gap-1 bg-amber-50 px-1 rounded ml-1" title="Exceeds 200-line modularity rule">⚠ {t('file.splitReq', 'builder')}</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    {expanded && originalFile && developerMode && (
                        <div className="flex bg-slate-200 rounded-md p-0.5 mr-2" onClick={e => e.stopPropagation()}>
                            <button 
                                onClick={() => setMode('unified')}
                                className={`px-3 py-1 text-[10px] font-bold rounded-sm transition-all ${mode === 'unified' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {t('file.unifiedDiff', 'builder')}
                            </button>
                            <button 
                                onClick={() => setMode('diff')}
                                className={`px-3 py-1 text-[10px] font-bold rounded-sm transition-all flex items-center gap-1 ${mode === 'diff' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <span className="w-2 h-2 bg-indigo-500 rounded-full opacity-50"></span>
                                {t('file.blockDiff', 'builder')}
                            </button>
                            <button 
                                onClick={() => setMode('code')}
                                className={`px-3 py-1 text-[10px] font-bold rounded-sm transition-all ${mode === 'code' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {t('file.code', 'builder')}
                            </button>
                        </div>
                    )}

                    <button 
                        onClick={handleCopy}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors opacity-0 group-hover/card:opacity-100"
                        title={t('file.copy', 'builder')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                    <div className={`text-slate-400 transform transition-transform duration-200 bg-slate-100 rounded-full p-1 ${expanded ? 'rotate-180 bg-slate-200 text-slate-600' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {expanded && (
                <div className="animate-in slide-in-from-top-1 duration-200">
                    {mode === 'unified' && originalFile ? (
                        <div className="bg-[#1e1e1e] p-3 text-xs overflow-x-auto max-h-[500px] custom-scrollbar border-t border-slate-900 rounded-b-xl">
                            <SyntaxHighlighter code={unifiedDiffContent} language="diff" />
                        </div>
                    ) : mode === 'diff' && originalFile ? (
                        <FileDiff oldContent={originalFile.content} newContent={file.content} />
                    ) : (
                        <div className="bg-[#1e1e1e] p-0 text-xs overflow-x-auto max-h-[500px] custom-scrollbar border-t border-slate-900 relative rounded-b-xl">
                            <div className="absolute top-0 right-0 p-2 pointer-events-none z-10">
                                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{file.language}</span>
                            </div>
                            <div className="p-3">
                                <SyntaxHighlighter code={file.content} language={file.language} />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};