
import React, { useState } from 'react';
import { AIProvider, AppSettings } from '../../../types';
import { toast } from '../../../services/toastService';

interface Props { settings: AppSettings; onChange: (k: keyof AppSettings, v: any) => void; }

export const AIProviderSettings: React.FC<Props> = ({ settings, onChange }) => {
    const [editing, setEditing] = useState<Partial<AIProvider> | null>(null);

    const save = () => {
        if (!editing?.name || !editing?.baseUrl) return toast.error("Required fields missing");
        const list = [...settings.customProviders];
        const idx = list.findIndex(p => p.id === editing.id);
        if (idx >= 0) list[idx] = editing as AIProvider;
        else list.push(editing as AIProvider);
        onChange('customProviders', list);
        setEditing(null);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium">AI Providers</h3>
            {editing ? (
                <div className="p-4 border rounded space-y-2">
                    <input className="shadcn-input" placeholder="Name" value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} />
                    <input className="shadcn-input" placeholder="Base URL" value={editing.baseUrl} onChange={e => setEditing({...editing, baseUrl: e.target.value})} />
                    <button onClick={save} className="shadcn-btn shadcn-btn-primary">Save</button>
                    <button onClick={() => setEditing(null)} className="shadcn-btn">Cancel</button>
                </div>
            ) : (
                <div className="space-y-2">
                    {settings.customProviders.map(p => (
                        <div key={p.id} className="flex justify-between p-2 border rounded">
                            <span>{p.name}</span>
                            <button onClick={() => setEditing(p)}>Edit</button>
                        </div>
                    ))}
                    <button onClick={() => setEditing({ id: crypto.randomUUID(), name: '', baseUrl: '', models: [] })} className="shadcn-btn">Add Provider</button>
                </div>
            )}
        </div>
    );
};
