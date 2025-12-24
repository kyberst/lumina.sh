
import React, { useState } from 'react';
import { MCPServer, AppSettings } from '../../../types';
import { toast } from '../../../services/toastService';
import { testMCPServer } from '../../../services/mcpService';
import { t } from '../../../services/i18n';

interface Props { settings: AppSettings; onChange: (k: keyof AppSettings, v: any) => void; }

export const MCPSettings: React.FC<Props> = ({ settings, onChange }) => {
    const [editing, setEditing] = useState<Partial<MCPServer> | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [testingId, setTestingId] = useState<string | null>(null);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        
        if (!editing?.name?.trim()) newErrors.name = "Name is required";
        
        if (!editing?.command?.trim()) {
            newErrors.command = "Command or URL is required";
        } else if (editing.type === 'websocket' && !/^wss?:\/\//.test(editing.command)) {
            newErrors.command = "Must start with ws:// or wss://";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const save = () => {
        if (!validate()) return;
        
        const list = [...(settings.mcpServers || [])];
        const idx = list.findIndex(s => s.id === editing!.id);
        
        const serverToSave = { 
            id: editing!.id || crypto.randomUUID(),
            name: editing!.name,
            type: editing!.type,
            command: editing!.command,
            args: editing!.args || [] 
        } as MCPServer;

        if (idx >= 0) list[idx] = serverToSave;
        else list.push(serverToSave);
        
        onChange('mcpServers', list);
        setEditing(null);
        setErrors({});
    };

    const remove = (id: string) => {
        const list = (settings.mcpServers || []).filter(s => s.id !== id);
        onChange('mcpServers', list);
    };

    const handleTest = async (server: MCPServer) => {
        setTestingId(server.id);
        const tid = toast.loading(`Testing ${server.name}...`);
        try {
            await testMCPServer(server);
            toast.success("Connection Successful!");
        } catch (e: any) {
            if (e.code === 'MCP_STDIO_WARN') {
                toast.info(e.message);
            } else {
                toast.error(`Connection Failed: ${e.message}`);
            }
        } finally {
            toast.dismiss(tid);
            setTestingId(null);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
                <span className="text-orange-600">🔌</span> {t('mcpConfig.title', 'settings')}
            </h3>
            
            {editing ? (
                <div className="p-4 border rounded-xl bg-slate-50 space-y-3 animate-in fade-in">
                    <div className="space-y-2">
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500">{t('mcpConfig.serverName', 'settings')}</label>
                            <input 
                                className={`shadcn-input ${errors.name ? 'border-red-500 focus:ring-red-200' : ''}`}
                                placeholder="e.g. Filesystem" 
                                value={editing.name || ''} 
                                onChange={e => setEditing({...editing, name: e.target.value})} 
                            />
                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                             <div className="col-span-1">
                                <label className="text-xs font-bold uppercase text-slate-500">{t('mcpConfig.type', 'settings')}</label>
                                <select className="shadcn-input" value={editing.type} onChange={e => setEditing({...editing, type: e.target.value as any})}>
                                    <option value="stdio">STDIO</option>
                                    <option value="websocket">WebSocket</option>
                                </select>
                             </div>
                             <div className="col-span-2">
                                <label className="text-xs font-bold uppercase text-slate-500">{t('mcpConfig.command', 'settings')}</label>
                                <input 
                                    className={`shadcn-input ${errors.command ? 'border-red-500 focus:ring-red-200' : ''}`}
                                    placeholder={editing.type === 'stdio' ? "npx" : "ws://localhost:8080"} 
                                    value={editing.command || ''} 
                                    onChange={e => setEditing({...editing, command: e.target.value})} 
                                />
                                {errors.command && <p className="text-xs text-red-500 mt-1">{errors.command}</p>}
                             </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500">{t('mcpConfig.args', 'settings')}</label>
                            <input className="shadcn-input" placeholder="-y @modelcontextprotocol/server-filesystem" value={editing.args?.join(' ') || ''} onChange={e => setEditing({...editing, args: e.target.value.split(' ')})} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => { setEditing(null); setErrors({}); }} className="shadcn-btn shadcn-btn-ghost">{t('form.cancel', 'settings')}</button>
                        <button onClick={save} className="shadcn-btn shadcn-btn-primary">{t('form.save', 'settings')}</button>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    {(settings.mcpServers || []).length === 0 && <div className="text-sm text-slate-400 italic text-center py-4">{t('mcpConfig.noServers', 'settings')}</div>}
                    
                    {(settings.mcpServers || []).map(s => (
                        <div key={s.id} className="flex justify-between items-center p-3 border rounded-lg bg-white shadow-sm hover:border-orange-200 transition-colors">
                            <div className="flex flex-col min-w-0 mr-4">
                                <span className="font-bold text-sm text-slate-700 flex items-center gap-2">
                                    {s.name} <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 rounded uppercase">{s.type}</span>
                                </span>
                                <span className="text-xs text-slate-400 font-mono truncate">{s.command} {s.args.join(' ')}</span>
                            </div>
                            <div className="flex gap-1 shrink-0">
                                <button 
                                    onClick={() => handleTest(s)} 
                                    disabled={testingId === s.id}
                                    className={`p-2 rounded transition-colors ${testingId === s.id ? 'bg-orange-100 text-orange-600 animate-pulse' : 'hover:bg-orange-50 text-slate-400 hover:text-orange-600'}`}
                                    title="Test Connection"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                                </button>
                                <button onClick={() => setEditing(s)} className="p-2 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600" title="Edit">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                </button>
                                <button onClick={() => remove(s.id)} className="p-2 hover:bg-red-50 rounded text-slate-500 hover:text-red-600" title="Delete">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                    <button onClick={() => { setEditing({ id: crypto.randomUUID(), name: '', type: 'stdio', command: '', args: [] }); setErrors({}); }} className="shadcn-btn w-full border-dashed border-2">
                        + {t('mcpConfig.addServer', 'settings')}
                    </button>
                </div>
            )}
        </div>
    );
};
