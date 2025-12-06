import React, { useState, useRef, useEffect } from 'react';
import { AppSettings, GitHubRepo, JournalEntry } from '../../../types';
import { getUserRepos, importRepository } from '../../../services/githubService';
import { readDirectoryFiles } from '../../../services/fileService';

interface ImportFormProps {
  settings: AppSettings;
  onImport: (entry: JournalEntry) => void;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
  setError: (v: string | null) => void;
}

export const ImportForm: React.FC<ImportFormProps> = ({ settings, onImport, isProcessing, setIsProcessing, setError }) => {
  const [importType, setImportType] = useState<'folder' | 'repos' | 'url'>('folder');
  const [importName, setImportName] = useState('');
  const [ghUrl, setGhUrl] = useState('');
  const [userRepos, setUserRepos] = useState<GitHubRepo[]>([]);
  const [installCmd, setInstallCmd] = useState('pnpm install');
  const [startCmd, setStartCmd] = useState('pnpm start');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (importType === 'repos' && settings.githubToken) {
        getUserRepos(settings.githubToken).then(setUserRepos).catch(e => {
            console.error("Failed to fetch repos", e);
            setError("Failed to fetch repositories. Check your token in settings.");
        });
    }
  }, [importType, settings.githubToken]);

  const handleFolderImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        setIsProcessing(true);
        try {
            const files = await readDirectoryFiles(e.target.files);
            const entry: JournalEntry = {
                id: crypto.randomUUID(),
                prompt: `Imported from local folder`,
                timestamp: Date.now(),
                description: `Imported project with ${files.length} files.`,
                files: files,
                tags: ['Imported', 'Local'],
                mood: 50,
                sentimentScore: 0.5,
                project: importName || 'Imported App',
                contextSource: 'local',
                installCommand: installCmd,
                startCommand: startCmd
            };
            onImport(entry);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    }
  };

  const handleRepoImport = async (repoFullName: string) => {
      if (!settings.githubToken) {
          setError("GitHub Token required in Settings to import repositories.");
          return;
      }
      setIsProcessing(true);
      setError(null);
      try {
          const files = await importRepository(repoFullName, settings.githubToken);
          const entry: JournalEntry = {
              id: crypto.randomUUID(),
              prompt: `Imported from GitHub: ${repoFullName}`,
              timestamp: Date.now(),
              description: `Clone of ${repoFullName}. Contains ${files.length} files.`,
              files: files,
              tags: ['GitHub', 'Imported'],
              mood: 50,
              sentimentScore: 0.5,
              project: importName || repoFullName.split('/')[1],
              contextSource: 'github',
              installCommand: installCmd,
              startCommand: startCmd
          };
           onImport(entry);
      } catch (err: any) {
          setError(`Import failed: ${err.message}`);
      } finally {
          setIsProcessing(false);
      }
  };

  const handleUrlImportSubmit = () => {
      try {
          // Supports https://github.com/user/repo or just user/repo
          let target = ghUrl;
          if (target.includes('github.com')) {
              const match = target.match(/github\.com\/([^\/]+\/[^\/\.]+)/);
              if (match) target = match[1];
          }
          if (target.split('/').length !== 2) throw new Error("Invalid format");
          handleRepoImport(target);
      } catch (e) {
          setError("Invalid GitHub URL format. Expected: https://github.com/owner/repo");
      }
  };

  return (
    <div className="min-h-[20rem] flex flex-col">
        <div className="flex items-center gap-2 mb-4 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
             <p className="text-xs text-indigo-900 font-medium">
                App import is an experimental feature.
            </p>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-slate-200 pb-2">
            <button onClick={() => setImportType('folder')} className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-all ${importType === 'folder' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Local Folder</button>
            <button onClick={() => setImportType('repos')} className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-all ${importType === 'repos' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>GitHub Repos</button>
            <button onClick={() => setImportType('url')} className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-all ${importType === 'url' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>GitHub URL</button>
        </div>
        
        <div className="flex-1 p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
            {/* LOCAL FOLDER */}
            {importType === 'folder' && (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-4">
                        <input type="text" value={importName} onChange={(e) => setImportName(e.target.value)} placeholder="App name (optional)" className="shadcn-input w-64 text-center font-medium" />
                        <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 text-sm py-8 px-8 rounded-xl transition-all border-2 border-dashed border-slate-200 hover:border-indigo-300 flex flex-col items-center gap-2 w-full max-w-sm group">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                            </div>
                            <span className="font-semibold">Select Folder</span>
                        </button>
                        <input type="file" ref={fileInputRef} style={{ display: 'none' }}
                        // @ts-ignore
                        webkitdirectory="" directory="" onChange={handleFolderImport} />
                </div>
            )}

            {/* GITHUB REPOS */}
            {importType === 'repos' && (
                <div className="h-64 flex flex-col">
                    {!settings.githubToken ? (
                        <div className="text-center text-slate-500 mt-10">Please configure GitHub Token in Settings first.</div>
                    ) : (
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                             {userRepos.map(repo => (
                                 <div key={repo.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors shadow-sm">
                                     <div>
                                         <div className="text-sm font-bold text-slate-800">{repo.name}</div>
                                         <div className="text-[10px] text-slate-500">{repo.full_name} • {repo.private ? 'Private' : 'Public'}</div>
                                     </div>
                                     <button onClick={() => handleRepoImport(repo.full_name)} disabled={isProcessing} className="shadcn-btn shadcn-btn-outline h-8 text-xs">Import</button>
                                 </div>
                             ))}
                        </div>
                    )}
                </div>
            )}

            {/* GITHUB URL */}
            {importType === 'url' && (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                    <input type="text" value={ghUrl} onChange={(e) => setGhUrl(e.target.value)} placeholder="https://github.com/owner/repo" className="shadcn-input w-full max-w-md" />
                    <button onClick={handleUrlImportSubmit} disabled={isProcessing || !ghUrl} className="shadcn-btn shadcn-btn-primary">Import from URL</button>
                </div>
            )}
        </div>

        {/* Advanced Options Toggle */}
        <div className="mt-4">
            <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-[10px] text-slate-600 uppercase tracking-wider hover:text-indigo-600 flex items-center gap-1 font-bold">
                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </button>
            {showAdvanced && (
                <div className="grid grid-cols-2 gap-4 mt-2 bg-slate-100 p-3 rounded border border-slate-200">
                    <div><label className="block text-[10px] text-slate-600 font-bold mb-1">Install Command</label><input value={installCmd} onChange={e => setInstallCmd(e.target.value)} className="shadcn-input h-8 text-xs" /></div>
                    <div><label className="block text-[10px] text-slate-600 font-bold mb-1">Start Command</label><input value={startCmd} onChange={e => setStartCmd(e.target.value)} className="shadcn-input h-8 text-xs" /></div>
                </div>
            )}
        </div>
    </div>
  );
};