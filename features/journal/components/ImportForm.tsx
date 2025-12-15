
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

  const tabClass = (type: string) => `px-3 py-1.5 rounded text-xs font-bold uppercase transition-all ${importType === type ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`;

  return (
    <div className="min-h-[20rem] flex flex-col">
        <div className="flex gap-2 mb-4 border-b border-slate-200 pb-2">
            <button onClick={() => setImportType('folder')} className={tabClass('folder')}>{t('localFolder', 'import')}</button>
            <button onClick={() => setImportType('repos')} className={tabClass('repos')}>{t('myRepos', 'import')}</button>
            <button onClick={() => setImportType('url')} className={tabClass('url')}>{t('publicUrl', 'import')}</button>
        </div>
        
        <div className="flex-1 p-6 bg-white rounded-xl border border-slate-200 shadow-sm relative">
            {isProcessing && (
                <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center flex-col gap-2">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-bold text-indigo-600 uppercase">{t('importing', 'import')}</span>
                </div>
            )}

            {importType === 'folder' && (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
                        <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-xl flex flex-col items-center gap-3 hover:bg-slate-100 transition-colors w-full max-w-sm group">
                            <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                            </div>
                            <div className="text-center">
                                <span className="font-bold text-slate-700 block">{t('selectFolder', 'import')}</span>
                                <span className="text-xs text-slate-400">{t('scanDescription', 'import')}</span>
                            </div>
                        </button>
                        <input type="file" ref={fileInputRef} style={{ display: 'none' }} 
                        // @ts-ignore
                        webkitdirectory="" directory="" onChange={handleFolderImport} />
                </div>
            )}
            
            {importType === 'repos' && (
                <RepoImport repos={userRepos} onImport={handleRepoImport} disabled={isProcessing} hasToken={!!settings.githubToken} />
            )}

            {importType === 'url' && (
                <div className="flex flex-col h-full justify-center max-w-md mx-auto gap-4">
                    <div className="text-center">
                        <h3 className="text-sm font-bold text-slate-800">{t('publicRepoTitle', 'import')}</h3>
                        <p className="text-xs text-slate-500 mt-1">{t('publicRepoDesc', 'import')}</p>
                    </div>
                    <div className="flex gap-2">
                        <input 
                            value={urlInput}
                            onChange={e => setUrlInput(e.target.value)}
                            placeholder="https://github.com/username/repo"
                            className="shadcn-input flex-1"
                        />
                        <button onClick={handleUrlImport} disabled={!urlInput.trim() || isProcessing} className="shadcn-btn shadcn-btn-primary">
                            {t('importButton', 'import')}
                        </button>
                    </div>
                    <div className="text-[10px] text-slate-400 bg-slate-50 p-3 rounded border border-slate-100">
                        <strong>{t('note', 'common')}</strong> {t('largeRepoWarning', 'import')}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
