
import React, { useState } from 'react';
import { JournalEntry } from '../../../types';

interface WorkspaceInfoProps {
  entry: JournalEntry;
  onUpdate: (e: JournalEntry) => void;
}

export const WorkspaceInfo: React.FC<WorkspaceInfoProps> = ({ entry, onUpdate }) => {
  const [tagInput, setTagInput] = useState('');

  return (
    <div className="w-full h-full bg-slate-50 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2 font-['Plus_Jakarta_Sans']">Project Configuration</h2>
                <p className="text-slate-500 text-sm">Manage metadata and environment variables for this app.</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Project Name</label>
                    <input className="shadcn-input font-bold text-lg" value={entry.project || ''} onChange={e => onUpdate({ ...entry, project: e.target.value })} />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Original Prompt</label>
                    <textarea className="shadcn-input h-24 resize-none" value={entry.prompt} readOnly />
                </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 block">Tech Stack & Tags</label>
                <div className="flex flex-wrap gap-2 mb-3">
                    {entry.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100 flex items-center gap-1">
                            {tag}
                            <button onClick={() => onUpdate({...entry, tags: entry.tags.filter(t => t !== tag)})} className="hover:text-red-500 font-black ml-1">×</button>
                        </span>
                    ))}
                </div>
                <input 
                    className="shadcn-input text-sm" 
                    placeholder="Type tag and press Enter to add..." 
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => {
                        if(e.key === 'Enter' && tagInput.trim()) {
                            if(!entry.tags.includes(tagInput.trim())) onUpdate({...entry, tags: [...entry.tags, tagInput.trim()]});
                            setTagInput('');
                        }
                    }}
                />
            </div>
            
            {entry.envVars && (
               <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 block">Environment Variables</label>
                    <div className="space-y-3">
                        {Object.entries(entry.envVars).map(([key, val]) => (
                            <div key={key} className="flex flex-col gap-1">
                                <span className="text-xs font-mono font-bold text-slate-600">{key}</span>
                                <input 
                                  className="shadcn-input font-mono text-xs bg-slate-50" 
                                  value={val as string}
                                  onChange={(e) => {
                                      const newVars = { ...entry.envVars, [key]: e.target.value };
                                      onUpdate({ ...entry, envVars: newVars });
                                  }}
                                />
                            </div>
                        ))}
                    </div>
               </div>
            )}
        </div>
    </div>
  );
};
