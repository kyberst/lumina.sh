
import React, { useState, useEffect } from 'react';
import { GeneratedFile } from '../../../types';
import { SyntaxHighlighter } from '../../../components/ui/SyntaxHighlighter';
import { FileDiff } from './FileDiff';
import { toast } from '../../../services/toastService';
import { t } from '../../../services/i18n';

interface FileCardProps {
    file: GeneratedFile;
    originalFile?: GeneratedFile;
    isNew?: boolean;
}

export const FileCard: React.FC<FileCardProps> = ({ file, originalFile, isNew }) => {
    // If it's a modified file, default to expanded and diff mode
    const [expanded, setExpanded] = useState(isNew && !!originalFile);
    const [mode, setMode] = useState<'code' | 'diff'>(isNew && !!originalFile ? 'diff' : 'code');
    
    const lines = file.content.split('\n').length;
    const isTooLong = lines > 200;

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(file.content);
        toast.success(t('file.copied', 'builder'));
    };

    const getIconColor = (name: string) => {
        if (name.endsWith('ts') || name.endsWith('tsx')) return 'text-blue-500 bg-blue-50 border-blue-100';
        if (name.endsWith('js') || name.endsWith('jsx')) return 'text-yellow-500 bg-yellow-50 border-yellow-100';
        if (name.endsWith('css')) return 'text-sky-500 bg-sky-50 border-sky-100';
        if (name.endsWith('html')) return 'text-orange-500 bg-orange-50 border-orange-100';
        return 'text-slate-500 bg-slate-50 border-slate-200';
    };

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md mb-3 group/card overflow-hidden">
            {/* Header */}
            <div 
                className="flex items-center justify-between px-3 py-3 bg-muted/20 border-b border-border/50 cursor-pointer select-none hover:bg-muted/40 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border shadow-sm ${getIconColor(file.name)}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className="text-xs font-bold text-foreground truncate font-mono flex items-center gap-2">
                            {file.name}
                            {isNew && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold shadow-sm ${
                                    originalFile ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                                }`}>
                                    {originalFile ? t('file.modified', 'builder') : t('file.created', 'builder')}
                                </span>
                            )}
                        </div>
                        <div className={`text-[10px] font-mono flex items-center gap-1 ${isTooLong ? 'text-amber-600 font-bold' : 'text-muted-foreground'}`}>
                            {lines} {t('file.lines', 'builder')}
                            {isTooLong && <span className="text-amber-500 flex items-center gap-1 bg-amber-50 px-1 rounded ml-1" title="Exceeds 200-line modularity rule">⚠ {t('file.splitReq', 'builder')}</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    {expanded && originalFile && (
                        <div className="flex bg-muted rounded-lg p-0.5 mr-2" onClick={e => e.stopPropagation()}>
                            <button 
                                onClick={() => setMode('diff')}
                                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1 ${mode === 'diff' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${mode === 'diff' ? 'bg-primary' : 'bg-slate-300'}`}></span>
                                {t('file.blockDiff', 'builder')}
                            </button>
                            <button 
                                onClick={() => setMode('code')}
                                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${mode === 'code' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {t('file.code', 'builder')}
                            </button>
                        </div>
                    )}

                    <button 
                        onClick={handleCopy}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors opacity-0 group-hover/card:opacity-100"
                        title={t('file.copy', 'builder')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                    <div className={`text-muted-foreground transform transition-transform duration-200 bg-muted/50 rounded-full p-1.5 ${expanded ? 'rotate-180 bg-muted text-foreground' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {expanded && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                    {mode === 'diff' && originalFile ? (
                        <FileDiff oldContent={originalFile.content} newContent={file.content} />
                    ) : (
                        <div className="bg-[#1e1e1e] p-0 text-xs overflow-x-auto max-h-[500px] custom-scrollbar border-t border-slate-900 relative">
                            <div className="absolute top-0 right-0 p-2 pointer-events-none z-10">
                                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest px-2 py-1 rounded border border-white/10 bg-white/5">{file.language}</span>
                            </div>
                            <div className="p-4 font-mono">
                                <SyntaxHighlighter code={file.content} language={file.language} />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
