
import React, { useState, useEffect } from 'react';
import { AppSettings, JournalEntry, GitHubRepo } from '../../../types';
import { getUserRepos, publishToGitHub } from '../../../services/githubService';
import { verifyGitHubToken } from '../../../services/github/context';
import { deployToVercel } from '../../../services/vercelService';
import { dbFacade } from '../../../services/dbFacade';
import { toast } from '../../../services/toastService';
import { t } from '../../../services/i18n';

interface Props {
    entry: JournalEntry;
    settings: AppSettings;
    onUpdate: (entry: JournalEntry) => void;
}

export const WorkspacePublish: React.FC<Props> = ({ entry, settings, onUpdate }) => {
    const [mode, setMode] = useState<'github' | 'vercel'>('github');
    const [isLoading, setIsLoading] = useState(false);
    
    // GitHub State
    const [ghToken, setGhToken] = useState(settings.githubToken || '');
    const [ghRepos, setGhRepos] = useState<GitHubRepo[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<string>('');
    const [newRepoName, setNewRepoName] = useState(entry.project || 'my-app');
    const [branchName, setBranchName] = useState('main');
    const [commitMessage, setCommitMessage] = useState('Update from Lumina');
    const [isNewRepo, setIsNewRepo] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);

    // Vercel State
    const [vercelToken, setVercelToken] = useState(settings.vercelToken || '');
    const [vercelProject, setVercelProject] = useState(entry.project || 'my-app');
    const [deployUrl, setDeployUrl] = useState('');

    useEffect(() => {
        if (mode === 'github' && settings.githubToken && ghRepos.length === 0) {
            loadRepos();
        }
    }, [mode, settings.githubToken]);

    const saveSettings = async (updates: Partial<AppSettings>) => {
        const newSettings = { ...settings, ...updates };
        await dbFacade.setConfig('app_settings', JSON.stringify(newSettings));
        // Need to reload page or use context to refresh settings in upper scope (but here we just update local state logic)
        // In a real Redux/Context app this would be automatic. For now, we trust the parent re-renders or next load.
        toast.success("Connection saved");
    };

    const handleConnectGitHub = () => {
        // Opens the GitHub Token generation page with pre-filled scopes
        const url = "https://github.com/settings/tokens/new?scopes=repo,read:user,user:email&description=Lumina%20Builder%20Access";
        window.open(url, '_blank');
    };

    const handleVerifyGitHub = async () => {
        if (!ghToken) return;
        setIsVerifying(true);
        try {
            const user = await verifyGitHubToken(ghToken);
            await saveSettings({ githubToken: ghToken, githubUsername: user.login, githubAvatar: user.avatar_url });
            toast.success(`Connected as ${user.login}`);
            loadRepos();
        } catch (e: any) {
            toast.error("Token verification failed");
        } finally {
            setIsVerifying(false);
        }
    };

    const loadRepos = async () => {
        setIsLoading(true);
        try {
            const repos = await getUserRepos(settings.githubToken || ghToken);
            setGhRepos(repos);
        } catch (e) { toast.error("Failed to load repos"); }
        finally { setIsLoading(false); }
    };

    const handleGitHubPublish = async () => {
        setIsLoading(true);
        try {
            const repo = isNewRepo ? newRepoName : selectedRepo;
            if (!repo) throw new Error("Repository name required");
            
            const url = await publishToGitHub(
                entry, 
                repo, 
                settings.githubToken || ghToken, 
                true, // Private by default
                isNewRepo,
                branchName
            );
            toast.success(`Published to ${url}`);
            onUpdate({ ...entry, installCommand: url }); 
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVercelDeploy = async () => {
        setIsLoading(true);
        try {
            const result = await deployToVercel(entry.files, vercelProject, vercelToken);
            setDeployUrl(result.url);
            toast.success("Deployed successfully!");
            onUpdate({ ...entry, previewUrl: result.url });
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-full bg-slate-50 overflow-y-auto p-6 sm:p-10">
            <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Deployment Center</h2>
                    <p className="text-slate-500 text-sm">Ship your application to the world using your favorite providers.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="flex border-b border-slate-100">
                        <button onClick={() => setMode('github')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mode === 'github' ? 'bg-slate-50 text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                            GitHub
                        </button>
                        <button onClick={() => setMode('vercel')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mode === 'vercel' ? 'bg-slate-50 text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h20L12 4 2 20z"></path></svg>
                            Vercel
                        </button>
                    </div>

                    <div className="p-8">
                        {mode === 'github' && (
                            <div className="space-y-6">
                                {!settings.githubToken ? (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                                        </div>
                                        <h3 className="font-bold text-slate-800 mb-2">Connect to GitHub</h3>
                                        <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">Authorize Lumina to create repositories and push code to your account.</p>
                                        
                                        <div className="space-y-4">
                                            <button onClick={handleConnectGitHub} className="shadcn-btn bg-[#24292e] text-white hover:bg-[#2f363d] w-full max-w-xs mx-auto flex items-center justify-center gap-2 h-11 shadow-lg">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                                                Authorize Connection
                                            </button>
                                            
                                            <div className="flex items-center gap-2 max-w-xs mx-auto">
                                                <input 
                                                    type="password" 
                                                    placeholder="Paste token here..." 
                                                    className="shadcn-input text-xs" 
                                                    value={ghToken}
                                                    onChange={e => setGhToken(e.target.value)} 
                                                />
                                                <button onClick={handleVerifyGitHub} disabled={isVerifying} className="shadcn-btn shadcn-btn-outline text-xs h-9">
                                                    {isVerifying ? "..." : "Connect"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                {settings.githubAvatar && <img src={settings.githubAvatar} className="w-8 h-8 rounded-full border border-slate-200" alt="User" />}
                                                <div>
                                                    <div className="text-xs font-bold text-slate-700">Connected as {settings.githubUsername}</div>
                                                    <div className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={() => saveSettings({githubToken: '', githubUsername: ''})} className="text-[10px] text-red-400 hover:text-red-600 font-bold uppercase">Disconnect</button>
                                        </div>

                                        <div className="flex gap-4 p-1 bg-slate-100 rounded-lg">
                                            <button onClick={() => setIsNewRepo(true)} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${isNewRepo ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>New Repository</button>
                                            <button onClick={() => setIsNewRepo(false)} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${!isNewRepo ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Existing Repository</button>
                                        </div>

                                        {isNewRepo ? (
                                            <div>
                                                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Repository Name</label>
                                                <input className="shadcn-input" value={newRepoName} onChange={e => setNewRepoName(e.target.value)} />
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Select Repository</label>
                                                <select className="shadcn-input" value={selectedRepo} onChange={e => setSelectedRepo(e.target.value)}>
                                                    <option value="">Choose repo...</option>
                                                    {ghRepos.map(r => <option key={r.id} value={r.full_name}>{r.full_name}</option>)}
                                                </select>
                                            </div>
                                        )}

                                        <div>
                                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Branch</label>
                                            <input className="shadcn-input" value={branchName} onChange={e => setBranchName(e.target.value)} placeholder="main" />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Commit Message</label>
                                            <input className="shadcn-input" value={commitMessage} onChange={e => setCommitMessage(e.target.value)} />
                                        </div>

                                        <button onClick={handleGitHubPublish} disabled={isLoading} className="shadcn-btn shadcn-btn-primary w-full h-11 text-sm flex items-center justify-center gap-2">
                                            {isLoading ? <span className="animate-spin">⏳</span> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
                                            Push Code
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {mode === 'vercel' && (
                            <div className="space-y-6">
                                {!settings.vercelToken && !vercelToken ? (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 20h20L12 4 2 20z"></path></svg>
                                        </div>
                                        <h3 className="font-bold text-slate-800 mb-2">Connect to Vercel</h3>
                                        <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">Enter your Vercel Access Token to enable seamless deployments.</p>
                                        <div className="flex gap-2 max-w-sm mx-auto">
                                            <input type="password" placeholder="Token..." className="shadcn-input" onChange={e => setVercelToken(e.target.value)} />
                                            <button onClick={() => saveSettings({ vercelToken })} className="shadcn-btn shadcn-btn-primary">Save</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-600">Vercel Connected</span>
                                            <button onClick={() => saveSettings({vercelToken: ''})} className="text-[10px] text-red-400 hover:text-red-600 font-bold uppercase">Disconnect</button>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Project Name</label>
                                            <input className="shadcn-input" value={vercelProject} onChange={e => setVercelProject(e.target.value)} placeholder="my-awesome-app" />
                                        </div>

                                        <button onClick={handleVercelDeploy} disabled={isLoading} className="shadcn-btn w-full h-11 text-sm flex items-center justify-center gap-2 bg-black text-white hover:bg-slate-800">
                                            {isLoading ? <span className="animate-spin">⏳</span> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 20h20L12 4 2 20z"></path></svg>}
                                            Deploy to Production
                                        </button>

                                        {deployUrl && (
                                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between animate-in zoom-in-95">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Live URL</span>
                                                    <a href={deployUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-slate-900 hover:underline">{deployUrl}</a>
                                                </div>
                                                <a href={deployUrl} target="_blank" rel="noreferrer" className="bg-emerald-500 text-white p-2 rounded-full hover:bg-emerald-600">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                                </a>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
