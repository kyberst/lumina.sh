
import React from 'react';
import { AppSettings, JournalEntry } from '../../../types';
import { RepoImport } from './import/RepoImport';
import { useImportForm } from '../hooks/useImportForm';
import { t } from '../../../services/i18n';

interface ImportFormProps {
  settings: AppSettings;
  onImport: (entry: JournalEntry) => void;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
  setError: (v: string | null) => void;
}

export const ImportForm: React.FC<ImportFormProps> = ({ settings, onImport, isProcessing, setIsProcessing, setError }) => {
  const { 
      importType, setImportType, userRepos, fileInputRef, 
      urlInput, setUrlInput,
      handleFolderImport, handleRepoImport, handleUrlImport 
  } = useImportForm(settings, onImport, setError, setIsProcessing);

  const tabClass = (type: string) => `flex-1 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${importType === type ? 'bg-background text-foreground shadow-sm scale-[1.02] ring-1 ring-black/5 dark:ring-white/10' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`;

  return (
    <div className="min-h-[22rem] flex flex-col">
        {/* Modern Segmented Control */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl border border-border mb-6">
            <button onClick={() => setImportType('folder')} className={tabClass('folder')}>{t('tab.folder', 'import')}</button>
            <button onClick={() => setImportType('repos')} className={tabClass('repos')}>{t('tab.repos', 'import')}</button>
            <button onClick={() => setImportType('url')} className={tabClass('url')}>{t('tab.url', 'import')}</button>
        </div>
        
        <div className="flex-1 p-1 relative rounded-2xl overflow-hidden border border-border/50 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-md shadow-inner">
            {isProcessing && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex items-center justify-center flex-col gap-4 animate-in fade-in duration-300">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full border-4 border-muted"></div>
                        <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    </div>
                    <span className="text-xs font-bold text-primary uppercase tracking-widest animate-pulse">{t('processing', 'import')}</span>
                </div>
            )}

            <div className="h-full p-6 bg-card/50 rounded-xl">
                {importType === 'folder' && (
                    <div className="flex flex-col items-center justify-center h-full gap-6 py-4 animate-in zoom-in-95 duration-300">
                            <button 
                                onClick={() => fileInputRef.current?.click()} 
                                disabled={isProcessing} 
                                className="group w-full max-w-sm aspect-[4/3] rounded-2xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 bg-muted/20 hover:bg-muted/40 transition-all flex flex-col items-center justify-center gap-4 relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="p-4 bg-background rounded-full shadow-lg group-hover:scale-110 group-hover:text-primary transition-all duration-300 text-muted-foreground ring-1 ring-border">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                                </div>
                                <div className="text-center z-10">
                                    <span className="font-bold text-foreground block text-sm mb-1">{t('folder.select', 'import')}</span>
                                    <span className="text-xs text-muted-foreground">{t('folder.desc', 'import')}</span>
                                </div>
                            </button>
                            <input type="file" ref={fileInputRef} style={{ display: 'none' }} 
                            // @ts-ignore
                            webkitdirectory="" directory="" onChange={handleFolderImport} />
                    </div>
                )}
                
                {importType === 'repos' && (
                    <div className="animate-in slide-in-from-right-4 duration-300 h-full">
                        <RepoImport repos={userRepos} onImport={handleRepoImport} disabled={isProcessing} hasToken={!!settings.githubToken} />
                    </div>
                )}

                {importType === 'url' && (
                    <div className="flex flex-col h-full justify-center max-w-md mx-auto gap-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 bg-background rounded-2xl shadow-sm border border-border flex items-center justify-center mx-auto mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                            </div>
                            <h3 className="text-base font-bold text-foreground">{t('url.title', 'import')}</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">{t('url.desc', 'import')}</p>
                        </div>
                        <div className="flex gap-2 relative">
                            <input 
                                value={urlInput}
                                onChange={e => setUrlInput(e.target.value)}
                                placeholder={t('url.placeholder', 'import')}
                                className="shadcn-input flex-1 pr-20"
                            />
                            <button 
                                onClick={handleUrlImport} 
                                disabled={!urlInput.trim() || isProcessing} 
                                className="absolute right-1 top-1 bottom-1 px-4 bg-primary text-primary-foreground rounded-md text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Import
                            </button>
                        </div>
                        <div className="text-[10px] text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border flex gap-2">
                            <svg className="w-4 h-4 shrink-0 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            <strong>{t('url.note', 'import')}</strong>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
