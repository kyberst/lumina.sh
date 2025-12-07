import React from 'react';
import { AppSettings, JournalEntry } from '../../../types';
import { RepoImport } from './import/RepoImport';
import { useImportForm } from '../hooks/useImportForm';

interface ImportFormProps {
  settings: AppSettings;
  onImport: (entry: JournalEntry) => void;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
  setError: (v: string | null) => void;
}

export const ImportForm: React.FC<ImportFormProps> = ({ settings, onImport, isProcessing, setIsProcessing, setError }) => {
  const { importType, setImportType, userRepos, fileInputRef, handleFolderImport, handleRepoImport } = useImportForm(settings, onImport, setError, setIsProcessing);

  return (
    <div className="min-h-[20rem] flex flex-col">
        <div className="flex gap-2 mb-4 border-b border-slate-200 pb-2">
            <button onClick={() => setImportType('folder')} className={`px-3 py-1.5 rounded text-xs font-bold uppercase ${importType === 'folder' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}>Local Folder</button>
            <button onClick={() => setImportType('repos')} className={`px-3 py-1.5 rounded text-xs font-bold uppercase ${importType === 'repos' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}>GitHub Repos</button>
        </div>
        
        <div className="flex-1 p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
            {importType === 'folder' && (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-4">
                        <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-xl flex flex-col items-center gap-2 hover:bg-slate-100 transition-colors">
                            <span className="font-semibold text-slate-600">Select Folder</span>
                            <span className="text-xs text-slate-400">Supports .js, .ts, .html, .css, .json</span>
                        </button>
                        <input type="file" ref={fileInputRef} style={{ display: 'none' }} 
                        // @ts-ignore
                        webkitdirectory="" directory="" onChange={handleFolderImport} />
                </div>
            )}
            {importType === 'repos' && (
                <RepoImport repos={userRepos} onImport={handleRepoImport} disabled={isProcessing} hasToken={!!settings.githubToken} />
            )}
        </div>
    </div>
  );
};