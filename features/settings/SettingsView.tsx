import React, { useState, useEffect } from 'react';
import { AppSettings, AppModule, MCPServer, AIProvider, AIModel } from '../../types';
import { t } from '../../services/i18n';
import { logger } from '../../services/logger';
import { sqliteService } from '../../services/sqliteService';
import { verifyGitHubToken } from '../../services/githubService';
import { toast } from '../../services/toastService';
import { testAIConnection } from '../../services/llmService';

interface SettingsViewProps {
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
  entries: any[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave, entries }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [exported, setExported] = useState(false);
  const [showAuthInput, setShowAuthInput] = useState(false);
  const [ghToken, setGhToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Initial MCP State
  const [editingMcpId, setEditingMcpId] = useState<string | null>(null);
  const [newMcpServer, setNewMcpServer] = useState<Partial<MCPServer>>({ type: 'stdio' });

  // AI Providers State
  const [editingProvider, setEditingProvider] = useState<Partial<AIProvider> | null>(null);
  const [tempApiKey, setTempApiKey] = useState('');
  const [newModel, setNewModel] = useState<Partial<AIModel>>({});
  const [isTestingAI, setIsTestingAI] = useState(false);

  // Update formData if props change (e.g. language changed via header)
  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  // Load secure configs from SQLite
  useEffect(() => {
    const loadSecure = async () => {
      const token = await sqliteService.getConfig('gh_token');
      const user = await sqliteService.getConfig('gh_user');
      setGhToken(token || '');
      setFormData(prev => ({ 
          ...prev, 
          githubToken: token || undefined, 
          githubUsername: user || undefined,
          zoomLevel: prev.zoomLevel || 1.0,
          mcpServers: prev.mcpServers || [],
          customProviders: prev.customProviders || [],
          telemetryId: prev.telemetryId || '14369529-e517-45ab-948c-997201272fd8'
      }));
    };
    loadSecure();
  }, []);

  const handleChange = (field: keyof AppSettings, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onSave(updated);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(entries, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `dyad_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setExported(true);
    setTimeout(() => setExported(false), 3000);
    logger.info(AppModule.SETTINGS, 'Data exported to JSON');
  };

  const handleGithubAuth = () => {
      window.open('https://github.com/settings/tokens/new?scopes=repo,read:user&description=Dyad+App+Builder', '_blank');
      setShowAuthInput(true);
  };

  const saveGithubCreds = async () => {
    if(!ghToken) return;
    setIsVerifying(true);
    try {
        const username = await verifyGitHubToken(ghToken);
        
        await sqliteService.setConfig('gh_token', ghToken);
        await sqliteService.setConfig('gh_user', username);
        
        handleChange('githubToken', ghToken); 
        handleChange('githubUsername', username);
        
        setShowAuthInput(false);
        toast.success(`Connected as ${username}`);
    } catch (e: any) {
        toast.error(e.message);
    } finally {
        setIsVerifying(false);
    }
  };

  const disconnectGithub = async () => {
    if(confirm(t('disconnect', 'settings') + "?")) {
        await sqliteService.deleteConfig('gh_token');
        await sqliteService.deleteConfig('gh_user');
        setGhToken('');
        setFormData(prev => ({ ...prev, githubToken: undefined, githubUsername: undefined }));
        toast.info("GitHub disconnected");
    }
  };
  
  const handleResetEverything = async () => {
      if (confirm("Are you sure? This will WIPE EVERYTHING.")) {
          await sqliteService.resetDatabase();
      }
  };

  // MCP Logic
  const handleEditMcp = (server: MCPServer) => {
      setEditingMcpId(server.id);
      setNewMcpServer({ ...server });
  };

  const cancelMcpEdit = () => {
      setEditingMcpId(null);
      setNewMcpServer({ type: 'stdio', name: '', command: '', args: [] });
  };

  const addOrUpdateMcpServer = () => {
      if (!newMcpServer.command) {
          toast.error("Command is required");
          return;
      }
      
      let updatedServers = [...(formData.mcpServers || [])];

      if (editingMcpId) {
          updatedServers = updatedServers.map(s => s.id === editingMcpId ? {
              ...s,
              name: newMcpServer.name || 'Untitled',
              type: newMcpServer.type as 'stdio',
              command: newMcpServer.command!,
              args: newMcpServer.args || []
          } : s);
          toast.success("MCP Server Updated");
      } else {
          const newServer: MCPServer = {
              id: crypto.randomUUID(),
              name: newMcpServer.name || 'Untitled Server',
              type: newMcpServer.type as 'stdio',
              command: newMcpServer.command!,
              args: newMcpServer.args || []
          };
          updatedServers.push(newServer);
          toast.success("MCP Server Added");
      }

      handleChange('mcpServers', updatedServers);
      cancelMcpEdit(); 
  };

  const removeMcpServer = (id: string) => {
      if(confirm("Remove this server?")) {
        const updatedServers = (formData.mcpServers || []).filter(s => s.id !== id);
        handleChange('mcpServers', updatedServers);
      }
  };
  
  const handleDirSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          const name = file.webkitRelativePath.split('/')[0] || file.name;
          handleChange('compilerDir', name); 
          toast.info("Folder selected. Note: Browsers hide full system paths.");
      }
  };

  // --- AI PROVIDER LOGIC ---

  const handleEditProvider = (provider?: AIProvider) => {
      if (provider) {
        setEditingProvider({ ...provider });
        setTempApiKey(''); // Don't show existing key
      } else {
        setEditingProvider({ 
            id: crypto.randomUUID().split('-')[0], // Short ID
            name: '', 
            baseUrl: 'https://api.example.com/v1', 
            models: [],
            apiKeyConfigKey: `provider_key_${Date.now()}`
        });
        setTempApiKey('');
      }
  };

  const saveProvider = async () => {
      if (!editingProvider?.name || !editingProvider?.baseUrl || !editingProvider?.id) {
          toast.error("Name, ID and URL are required");
          return;
      }

      const isNew = !formData.customProviders.some(p => p.id === editingProvider.id);
      
      // Save Key if provided
      if (tempApiKey) {
          await sqliteService.setConfig(editingProvider.apiKeyConfigKey!, tempApiKey);
      } else if (isNew) {
          toast.error("API Key required for new provider");
          return;
      }

      const fullProvider = editingProvider as AIProvider;
      
      let updatedList = [...formData.customProviders];
      if (isNew) {
          updatedList.push(fullProvider);
      } else {
          updatedList = updatedList.map(p => p.id === fullProvider.id ? fullProvider : p);
      }

      handleChange('customProviders', updatedList);
      setEditingProvider(null);
      setTempApiKey('');
      toast.success("Provider Saved");
  };

  const deleteProvider = async (id: string) => {
      if(confirm("Delete this provider?")) {
          const provider = formData.customProviders.find(p => p.id === id);
          if(provider) await sqliteService.deleteConfig(provider.apiKeyConfigKey);
          
          const updated = formData.customProviders.filter(p => p.id !== id);
          handleChange('customProviders', updated);
          if (formData.activeProviderId === id) {
              handleChange('activeProviderId', 'gemini');
          }
      }
  };

  const addModelToProvider = () => {
      if (!newModel.name || !newModel.id) {
          toast.error("Model Name and ID required");
          return;
      }
      if (!editingProvider) return;

      const updatedModels = [...(editingProvider.models || [])];
      
      // Check if updating existing
      const existingIdx = updatedModels.findIndex(m => m.id === newModel.id);
      const modelObj = {
          id: newModel.id!,
          name: newModel.name!,
          contextWindow: newModel.contextWindow || 4096,
          maxOutput: newModel.maxOutput || 4096,
          description: newModel.description || ''
      };

      if(existingIdx >= 0) {
          updatedModels[existingIdx] = modelObj;
      } else {
          updatedModels.push(modelObj);
      }

      setEditingProvider({ ...editingProvider, models: updatedModels });
      setNewModel({});
  };

  const removeModelFromProvider = (modelId: string) => {
      if (!editingProvider) return;
      const updatedModels = editingProvider.models?.filter(m => m.id !== modelId) || [];
      setEditingProvider({ ...editingProvider, models: updatedModels });
  };
  
  const editModelInProvider = (model: AIModel) => {
      setNewModel({ ...model });
  };

  const testProviderConnection = async () => {
      if (!editingProvider || !tempApiKey) {
          toast.error("Please enter URL and API Key to test");
          return;
      }
      const modelId = editingProvider.models?.[0]?.id || 'gpt-3.5-turbo'; // Fallback guess
      setIsTestingAI(true);
      try {
          await testAIConnection(editingProvider as AIProvider, modelId, tempApiKey);
          toast.success("Connection Successful!");
      } catch (e: any) {
          toast.error("Connection Failed: " + e.message);
      } finally {
          setIsTestingAI(false);
      }
  };
  
  const toggleActiveProvider = (id: string) => {
      if (formData.activeProviderId === id) {
          handleChange('activeProviderId', 'gemini'); // Revert to default
          toast.info("Reverted to Gemini Default");
      } else {
          handleChange('activeProviderId', id);
          toast.success(`Set ${id} as active provider`);
      }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500 pb-20">
      <header className="mb-8 border-b border-[#ffc93a]/30 pb-4">
        <h2 className="text-2xl text-slate-800 font-serif font-medium">
          {t('title', 'settings')}
        </h2>
      </header>

      <div className="space-y-12">
        {/* General Preferences */}
        <section>
          <h3 className="text-sm font-semibold text-[#ff7e15] mb-4 tracking-wide uppercase">
             {t('general', 'settings')}
          </h3>
          
          <div className="bg-white p-6 rounded-2xl border border-[#ffc93a]/30 mb-4 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-sm">
             {/* Language */}
             <div>
                 <label className="block text-xs font-medium text-slate-500 mb-2">{t('language', 'settings')}</label>
                 <div className="flex bg-[#ffffbb] rounded-lg p-1 border border-[#ffc93a]/30 w-fit">
                    <button 
                      onClick={() => handleChange('language', 'en')}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${formData.language === 'en' ? 'bg-[#ff7e15] text-white' : 'text-slate-500 hover:text-[#ff7e15]'}`}
                    >
                      English
                    </button>
                    <button 
                      onClick={() => handleChange('language', 'es')}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${formData.language === 'es' ? 'bg-[#ff7e15] text-white' : 'text-slate-500 hover:text-[#ff7e15]'}`}
                    >
                      Español
                    </button>
                 </div>
             </div>

             {/* Zoom Level */}
             <div>
                 <label className="block text-xs font-medium text-slate-500 mb-2">{t('zoom', 'settings')}: {Math.round(formData.zoomLevel * 100)}%</label>
                 <input 
                    type="range" min="0.8" max="1.2" step="0.1" 
                    value={formData.zoomLevel} 
                    onChange={e => handleChange('zoomLevel', parseFloat(e.target.value))}
                    className="w-full accent-[#ff7e15] bg-[#ffffbb] rounded-lg h-2 appearance-none cursor-pointer"
                 />
                 <div className="text-[10px] text-slate-500 mt-1">Adjusts the zoom level to make content easier to read.</div>
             </div>
          </div>
        </section>

        {/* AI Providers */}
        <section>
             <h3 className="text-sm font-semibold text-[#ff7e15] mb-4 tracking-wide uppercase">
                {t('aiProviders', 'settings')}
             </h3>
             
             {editingProvider ? (
                 <div className="bg-white p-6 rounded-2xl border border-[#ff7e15]/30 space-y-4 shadow-sm">
                     <h4 className="text-slate-800 text-sm font-bold mb-2">
                        {editingProvider.name ? `Edit ${editingProvider.name}` : 'Add Custom Provider'}
                     </h4>
                     
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-[10px] uppercase text-slate-500 mb-1">ID (No spaces)</label>
                             <input value={editingProvider.id} onChange={e => setEditingProvider({...editingProvider, id: e.target.value})} className="w-full bg-[#ffffbb]/30 border border-[#ffc93a] rounded px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-[#ff7e15]" placeholder="e.g. deepseek" />
                        </div>
                        <div>
                             <label className="block text-[10px] uppercase text-slate-500 mb-1">Name</label>
                             <input value={editingProvider.name} onChange={e => setEditingProvider({...editingProvider, name: e.target.value})} className="w-full bg-[#ffffbb]/30 border border-[#ffc93a] rounded px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-[#ff7e15]" placeholder="e.g. DeepSeek" />
                        </div>
                     </div>
                     
                     <div>
                         <label className="block text-[10px] uppercase text-slate-500 mb-1">Base URL</label>
                         <input value={editingProvider.baseUrl} onChange={e => setEditingProvider({...editingProvider, baseUrl: e.target.value})} className="w-full bg-[#ffffbb]/30 border border-[#ffc93a] rounded px-2 py-1.5 text-sm text-slate-700 font-mono outline-none focus:border-[#ff7e15]" placeholder="https://api.example.com/v1" />
                     </div>

                     <div>
                         <label className="block text-[10px] uppercase text-slate-500 mb-1">Update API Key</label>
                         <div className="flex gap-2">
                             <input type="password" value={tempApiKey} onChange={e => setTempApiKey(e.target.value)} className="flex-1 bg-[#ffffbb]/30 border border-[#ffc93a] rounded px-2 py-1.5 text-sm text-slate-700 font-mono outline-none focus:border-[#ff7e15]" placeholder="Enter new API Key here" />
                             <button onClick={testProviderConnection} disabled={isTestingAI || !tempApiKey} className="px-3 bg-[#ffff7e] border border-[#ffc93a] text-[#ff7e15] hover:bg-[#ffc93a] hover:text-white rounded text-xs font-bold transition-all whitespace-nowrap">
                                 {isTestingAI ? 'Testing...' : 'Test Connection'}
                             </button>
                         </div>
                     </div>

                     <div className="border-t border-[#ffc93a]/30 pt-4">
                         <h5 className="text-xs text-slate-400 mb-2">Models</h5>
                         <div className="space-y-2 mb-3">
                             {editingProvider.models?.map(m => (
                                 <div key={m.id} className="flex justify-between items-center bg-[#ffffbb]/30 p-2 rounded border border-[#ffc93a]/30">
                                     <div className="text-xs text-slate-700">
                                         <span className="font-bold text-[#ff7e15]">{m.name}</span> <span className="text-slate-500">({m.id})</span>
                                         <div className="text-[10px] text-slate-600">Ctx: {m.contextWindow} | Out: {m.maxOutput}</div>
                                     </div>
                                     <div className="flex gap-2">
                                         <button onClick={() => editModelInProvider(m)} className="text-slate-400 hover:text-[#ff7e15]">✎</button>
                                         <button onClick={() => removeModelFromProvider(m.id)} className="text-red-400 hover:text-red-500">&times;</button>
                                     </div>
                                 </div>
                             ))}
                         </div>
                         <div className="flex flex-col gap-2 bg-[#ffffbb]/30 p-3 rounded border border-[#ffc93a]/30">
                             <div className="grid grid-cols-2 gap-2">
                                 <input value={newModel.id || ''} onChange={e => setNewModel({...newModel, id: e.target.value})} placeholder="Model ID (api-name)" className="bg-white border border-[#ffc93a] rounded px-2 py-1 text-xs text-slate-700 outline-none" />
                                 <input value={newModel.name || ''} onChange={e => setNewModel({...newModel, name: e.target.value})} placeholder="Friendly Name" className="bg-white border border-[#ffc93a] rounded px-2 py-1 text-xs text-slate-700 outline-none" />
                             </div>
                             <div className="grid grid-cols-2 gap-2">
                                 <input type="number" value={newModel.contextWindow || ''} onChange={e => setNewModel({...newModel, contextWindow: parseInt(e.target.value)})} placeholder="Context (e.g. 128000)" className="bg-white border border-[#ffc93a] rounded px-2 py-1 text-xs text-slate-700 outline-none" />
                                 <input type="number" value={newModel.maxOutput || ''} onChange={e => setNewModel({...newModel, maxOutput: parseInt(e.target.value)})} placeholder="Max Out (e.g. 4096)" className="bg-white border border-[#ffc93a] rounded px-2 py-1 text-xs text-slate-700 outline-none" />
                             </div>
                             <button onClick={addModelToProvider} className="bg-[#ff7e15] hover:bg-[#ff2935] text-white text-xs py-1.5 rounded w-full mt-2 font-bold transition-colors">Add / Update Model</button>
                         </div>
                     </div>

                     <div className="flex justify-end gap-2 mt-4">
                         <button onClick={() => { setEditingProvider(null); setTempApiKey(''); }} className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                         <button onClick={saveProvider} className="px-4 py-1.5 bg-[#ff2935] hover:bg-rose-600 text-white text-xs font-bold rounded">Save Provider</button>
                     </div>
                 </div>
             ) : (
                 <div className="bg-white p-6 rounded-2xl border border-[#ffc93a]/30 space-y-4 shadow-sm">
                     <div className="space-y-2">
                         {formData.customProviders.length === 0 && <p className="text-xs text-slate-500 italic">No custom providers configured.</p>}
                         {formData.customProviders.map(p => (
                             <div key={p.id} className={`flex justify-between items-center bg-[#ffffbb]/20 p-3 rounded border ${formData.activeProviderId === p.id ? 'border-[#ff7e15] shadow-sm' : 'border-[#ffc93a]/20'}`}>
                                 <div>
                                     <div className="flex items-center gap-2">
                                         <div className="text-sm font-bold text-slate-700">{p.name}</div>
                                         {formData.activeProviderId === p.id && <span className="text-[9px] bg-[#ff7e15] text-white px-1.5 rounded font-bold uppercase">Active</span>}
                                     </div>
                                     <div className="text-[10px] text-slate-500">{p.baseUrl} • {p.models.length} Models</div>
                                 </div>
                                 <div className="flex gap-2">
                                     <button onClick={() => toggleActiveProvider(p.id)} className={`p-1.5 rounded text-[10px] font-bold uppercase transition-all ${formData.activeProviderId === p.id ? 'bg-[#ff7e15]/10 text-[#ff7e15]' : 'bg-slate-100 text-slate-400 hover:text-slate-600'}`}>
                                         {formData.activeProviderId === p.id ? 'Selected' : 'Set Active'}
                                     </button>
                                     <button onClick={() => handleEditProvider(p)} className="p-1.5 text-[#ff7e15] hover:bg-[#ffff7e]/50 rounded" title="Edit">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                     </button>
                                     <button onClick={() => deleteProvider(p.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded" title="Delete">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                     </button>
                                 </div>
                             </div>
                         ))}
                     </div>
                     <button onClick={() => handleEditProvider()} className="w-full py-2 border border-dashed border-[#ffc93a] text-slate-500 hover:text-[#ff7e15] hover:border-[#ff7e15] rounded text-xs uppercase tracking-wider transition-all">
                         + Add Custom Provider
                     </button>
                 </div>
             )}
        </section>

        {/* Automation */}
        <section>
          <h3 className="text-sm font-semibold text-[#ff7e15] mb-4 tracking-wide uppercase">
             {t('automation', 'settings')}
          </h3>
          <div className="bg-white p-6 rounded-2xl border border-[#ffc93a]/30 mb-4 space-y-4 shadow-sm">
              <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2">Compiler Directory</label>
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                        <input 
                            type="text" 
                            value={formData.compilerDir || ''} 
                            onChange={e => handleChange('compilerDir', e.target.value)}
                            placeholder="Paste full system path here..."
                            className="w-full bg-[#ffffbb]/20 border border-[#ffc93a]/50 rounded px-3 py-2 text-slate-700 text-sm font-mono focus:border-[#ff7e15] outline-none"
                        />
                    </div>
                    <label className="bg-[#ff7e15] hover:bg-[#ff2935] text-white p-2 rounded cursor-pointer border border-[#ffc93a]/30 flex items-center justify-center shrink-0 w-10 h-10 transition-colors" title="Select Folder (Browser limits path visibility)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                        <input 
                            type="file" 
                            // @ts-ignore
                            webkitdirectory="" directory=""
                            className="hidden" 
                            onChange={handleDirSelect}
                        />
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">
                      Due to browser security, 'Browse' may not return the full path. 
                      <strong> Copy and paste the address bar path</strong> from your file explorer for accuracy.
                  </p>
              </div>
              <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={formData.autoApprove || false} 
                    onChange={e => handleChange('autoApprove', e.target.checked)} 
                    className="accent-[#ff7e15]"
                  />
                  <span className="text-sm text-slate-700">{t('autoApprove', 'settings')}</span>
              </div>
               <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={formData.autoFix || false} 
                    onChange={e => handleChange('autoFix', e.target.checked)} 
                    className="accent-[#ff7e15]"
                  />
                  <span className="text-sm text-slate-700">{t('autoFix', 'settings')}</span>
              </div>
          </div>
        </section>

        {/* AI Config */}
        <section>
          <h3 className="text-sm font-semibold text-[#ff7e15] mb-4 tracking-wide uppercase">
            {t('aiConfig', 'settings')}
          </h3>
          <div className="bg-white p-6 rounded-2xl border border-[#ffc93a]/30 space-y-6 shadow-sm">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2">{t('thinkingBudget', 'settings')}</label>
                  <select 
                    value={formData.thinkingBudget || 'medium'} 
                    onChange={e => handleChange('thinkingBudget', e.target.value)}
                    className="w-full bg-[#ffffbb]/20 border border-[#ffc93a]/50 rounded px-3 py-2 text-slate-700 text-sm outline-none focus:border-[#ff7e15]"
                  >
                      <option value="low">Low (Fast)</option>
                      <option value="medium">Medium (Balanced)</option>
                      <option value="high">High (Deep)</option>
                  </select>
                  <p className="text-[10px] text-slate-600 mt-1">Balanced thinking for most conversations.</p>
               </div>
               <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2">{t('contextSize', 'settings')}</label>
                  <select 
                    value={formData.contextSize || 'default'} 
                    onChange={e => handleChange('contextSize', e.target.value)}
                    className="w-full bg-[#ffffbb]/20 border border-[#ffc93a]/50 rounded px-3 py-2 text-slate-700 text-sm outline-none focus:border-[#ff7e15]"
                  >
                      <option value="economy">Economy (2)</option>
                      <option value="default">Default (3)</option>
                      <option value="plus">Plus (5)</option>
                      <option value="high">High (10)</option>
                      <option value="max">Max (100)</option>
                  </select>
                  <p className="text-[10px] text-slate-600 mt-1">Number of past interactions to keep in context.</p>
               </div>
             </div>
          </div>
        </section>

        {/* Integration */}
        <section className="bg-white p-6 rounded-2xl border border-[#ffc93a]/30 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-600 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
            {t('github', 'settings')}
          </h3>
          
          {!formData.githubToken && !showAuthInput ? (
              <div className="text-center py-6">
                 <p className="text-slate-400 text-sm mb-4">Connect GitHub to import code contexts directly.</p>
                 <button 
                   onClick={handleGithubAuth}
                   className="bg-[#24292e] hover:bg-[#2f363d] text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 mx-auto"
                 >
                   {t('connect', 'settings')}
                 </button>
              </div>
          ) : (
            <div className="space-y-4 animate-in fade-in">
              {showAuthInput ? (
                <>
                   <div>
                    <div className="text-xs text-yellow-600 mb-2 bg-[#ffff7e]/50 p-2 rounded">
                        Note: We will verify your token before saving.
                    </div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">{t('token', 'settings')}</label>
                    <div className="flex gap-2">
                        <input 
                        type="password"
                        value={ghToken}
                        onChange={(e) => setGhToken(e.target.value)}
                        className="flex-1 bg-[#ffffbb]/20 border border-[#ffc93a]/50 rounded-lg px-3 py-2 text-slate-700 focus:border-[#ff7e15] outline-none text-sm font-mono"
                        placeholder="ghp_..."
                        />
                        <button 
                            onClick={saveGithubCreds} 
                            disabled={isVerifying}
                            className="bg-[#ff7e15] hover:bg-[#ff2935] disabled:opacity-50 text-white px-4 rounded text-xs font-bold transition-all"
                        >
                            {isVerifying ? 'Verifying...' : 'Verify & Save'}
                        </button>
                    </div>
                  </div>
                </>
              ) : (
                 <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-[#ffc93a]/20">
                    <div>
                       <div className="text-xs text-slate-500">{t('connected', 'settings')}</div>
                       <div className="text-[#ff7e15] font-mono font-bold">{formData.githubUsername}</div>
                    </div>
                    <button onClick={disconnectGithub} className="text-red-400 text-xs hover:text-red-500 font-bold">
                        {t('disconnect', 'settings')}
                    </button>
                 </div>
              )}
            </div>
          )}
        </section>

        {/* MCP Settings */}
        <section>
            <h3 className="text-sm font-semibold text-[#ff7e15] mb-4 tracking-wide uppercase">
                {t('mcp', 'settings')}
            </h3>
            <div className="bg-white p-6 rounded-2xl border border-[#ffc93a]/30 shadow-sm">
                <div className="mb-4 space-y-2">
                    {formData.mcpServers?.length === 0 && <p className="text-xs text-slate-500 italic">No servers configured yet.</p>}
                    {formData.mcpServers?.map(server => (
                        <div key={server.id} className={`flex justify-between items-center bg-[#ffffbb]/20 p-3 rounded border ${editingMcpId === server.id ? 'border-[#ff7e15]' : 'border-[#ffc93a]/20'}`}>
                            <div>
                                <div className="text-sm text-slate-700 font-medium">{server.name}</div>
                                <div className="text-xs text-slate-500 font-mono">{server.command} {server.args.join(' ')}</div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEditMcp(server)} title="Edit" className="text-[#ff7e15] p-2 hover:bg-[#ffff7e]/50 rounded transition-colors">
                                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                </button>
                                <button onClick={() => removeMcpServer(server.id)} title="Remove" className="text-red-400 p-2 hover:bg-red-50 rounded transition-colors">
                                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className={`border-t border-[#ffc93a]/20 pt-4 transition-all ${editingMcpId ? 'bg-[#ffff7e]/20 -mx-6 px-6 pb-6 mt-6 border-t-[#ffc93a]/50' : ''}`}>
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-xs text-slate-400">{editingMcpId ? 'Edit Server' : t('addServer', 'settings')}</h4>
                        {editingMcpId && <button onClick={cancelMcpEdit} className="text-xs text-slate-500 hover:text-slate-800">Cancel</button>}
                    </div>
                    <div className="space-y-2">
                        <input 
                            placeholder="Server Name (e.g. My MCP Server)" 
                            value={newMcpServer.name || ''}
                            onChange={e => setNewMcpServer(s => ({...s, name: e.target.value}))}
                            className="w-full bg-[#ffffbb]/20 border border-[#ffc93a]/50 rounded px-2 py-1.5 text-sm text-slate-700 focus:border-[#ff7e15] outline-none"
                        />
                        <div className="flex gap-2">
                            <select 
                                value={newMcpServer.type}
                                onChange={e => setNewMcpServer(s => ({...s, type: e.target.value as 'stdio'}))}
                                className="bg-[#ffffbb]/20 border border-[#ffc93a]/50 rounded px-2 text-sm text-slate-700 focus:border-[#ff7e15] outline-none"
                            >
                                <option value="stdio">stdio</option>
                                <option value="websocket">websocket</option>
                            </select>
                            <input 
                                placeholder="Command (e.g. node)" 
                                value={newMcpServer.command || ''}
                                onChange={e => setNewMcpServer(s => ({...s, command: e.target.value}))}
                                className="flex-1 bg-[#ffffbb]/20 border border-[#ffc93a]/50 rounded px-2 py-1.5 text-sm text-slate-700 font-mono focus:border-[#ff7e15] outline-none"
                            />
                        </div>
                        <input 
                             placeholder="Args (e.g. path/to/server.js --flag)" 
                             value={newMcpServer.args?.join(' ') || ''}
                             onChange={e => setNewMcpServer(s => ({...s, args: e.target.value.split(' ')}))}
                             className="w-full bg-[#ffffbb]/20 border border-[#ffc93a]/50 rounded px-2 py-1.5 text-sm text-slate-700 font-mono focus:border-[#ff7e15] outline-none"
                        />
                        <button 
                            onClick={addOrUpdateMcpServer} 
                            className={`mt-2 text-white px-4 py-2 rounded text-xs font-bold w-full transition-all ${editingMcpId ? 'bg-[#ff2935] hover:bg-rose-600' : 'bg-[#ff7e15] hover:bg-[#ff2935]'}`}
                        >
                            {editingMcpId ? 'Update Server' : 'Add Server'}
                        </button>
                    </div>
                </div>
            </div>
        </section>

        {/* Telemetry */}
        <section>
            <h3 className="text-sm font-semibold text-slate-500 mb-4 tracking-wide uppercase">
                {t('telemetry', 'settings')}
            </h3>
            <div className="bg-white p-6 rounded-2xl border border-[#ffc93a]/30 shadow-sm">
                <p className="text-xs text-slate-400 mb-2">{t('telemetryDesc', 'settings')}</p>
                <div className="bg-slate-50 p-2 rounded border border-slate-100 font-mono text-[10px] text-slate-500 select-all">
                    Telemetry ID: {formData.telemetryId}
                </div>
            </div>
        </section>

        {/* Danger Zone */}
        <section>
          <h3 className="text-sm font-semibold text-red-500 mb-4 tracking-wide uppercase">
              {t('dangerZone', 'settings')}
          </h3>
          <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex flex-col sm:flex-row items-center justify-between gap-4">
             <div>
                <h4 className="text-red-700 text-sm font-bold mb-1">{t('resetAll', 'settings')}</h4>
                <p className="text-xs text-red-500 max-w-sm">{t('resetDesc', 'settings')}</p>
             </div>
             <button 
                onClick={handleResetEverything}
                className="whitespace-nowrap px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-900/20"
              >
                {t('resetAll', 'settings')}
              </button>
          </div>
        </section>
      </div>
    </div>
  );
};