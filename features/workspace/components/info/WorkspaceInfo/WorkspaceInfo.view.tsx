
import React from 'react';
import { JournalEntry, AppSettings } from '../../../../types';
import { FunctionalFileExplorer } from '../FunctionalFileExplorer';
import { UniversalPropertyInspector } from '../UniversalPropertyInspector';
import { HistoryList } from '../HistoryList';
import { t } from '../../../../services/i18n';

interface Props {
  entry: JournalEntry;
  onUpdate: (e: JournalEntry) => void;
  settings: AppSettings;
  selectedElement: any | null;
  onPropertyChange: (changes: { textContent?: string; className?: string }) => void;
  tagInput: string;
  setTagInput: (v: string) => void;
  showSecrets: boolean;
  setShowSecrets: (v: boolean) => void;
  showHelp: boolean;
  setShowHelp: (v: boolean) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  handleRestoreSnapshot: (snap: any) => void;
}

export const WorkspaceInfoView: React.FC<Props> = ({
    entry, onUpdate, settings, selectedElement, onPropertyChange,
    tagInput, setTagInput, showSecrets, setShowSecrets, showHelp, setShowHelp, containerRef, handleRestoreSnapshot
}) => {
    return (
        <div ref={containerRef} className="w-full h-full bg-slate-50 overflow-y-auto p-4 sm:p-8 relative">
            {showHelp && (
                <div className="absolute top-24 right-8 w-64 bg-slate-800 text-white p-4 rounded-xl shadow-2xl z-10">
                    <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-slate-400 hover:text-white">&times;</button>
                    <h4 className="font-bold text-sm">{t('contextualHelpTitle', 'builder')}</h4>
                    <p className="text-xs text-slate-300">"{t('contextualHelpDesc', 'builder')}"</p>
                </div>
            )}
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <UniversalPropertyInspector selectedElement={selectedElement} onPropertyChange={onPropertyChange} settings={settings} />
                {!settings.developerMode && <FunctionalFileExplorer files={entry.files || []} />}
                <HistoryList history={entry.history || []} onRestore={handleRestoreSnapshot} />
                
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2 font-['Plus_Jakarta_Sans']">{t('projectConfig', 'workspace')}</h2>
                    <p className="text-slate-500 text-sm">{t('projectConfigDesc', 'workspace')}</p>
                </div>
                
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t('projectName', 'workspace')}</label>
                        <input className="shadcn-input font-bold text-lg" value={entry.project || ''} onChange={e => onUpdate({ ...entry, project: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t('originalPrompt', 'workspace')}</label>
                        <textarea className="shadcn-input h-24 resize-none" value={entry.prompt} readOnly />
                    </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 block">{t('stackAndTags', 'workspace')}</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {(entry.tags || []).map(tag => (
                            <span key={tag} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100 flex items-center gap-1">
                                {tag}
                                <button onClick={() => onUpdate({...entry, tags: (entry.tags || []).filter(t => t !== tag)})} className="hover:text-red-500 font-black ml-1">×</button>
                            </span>
                        ))}
                    </div>
                    <input 
                        className="shadcn-input text-sm" 
                        placeholder={t('addTagPlaceholder', 'workspace')} 
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => {
                            if(e.key === 'Enter' && tagInput.trim()) {
                                if(!(entry.tags || []).includes(tagInput.trim())) onUpdate({...entry, tags: [...(entry.tags || []), tagInput.trim()]});
                                setTagInput('');
                            }
                        }}
                    />
                </div>
                
                {entry.envVars && (
                   <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{t('envVarsTitle', 'workspace')}</label>
                            <button onClick={() => setShowSecrets(!showSecrets)} className="text-[10px] text-indigo-600 font-bold hover:underline uppercase">
                                {showSecrets ? t('hideSecrets', 'workspace') : t('showSecrets', 'workspace')}
                            </button>
                        </div>
                        <div className="space-y-3">
                            {Object.entries(entry.envVars).map(([key, val]) => (
                                <div key={key} className="flex flex-col gap-1">
                                    <span className="text-xs font-mono font-bold text-slate-600">{key}</span>
                                    <input 
                                      type={showSecrets ? 'text' : 'password'}
                                      className="shadcn-input font-mono text-xs bg-slate-50 border-slate-200 text-indigo-800" 
                                      value={val as string}
                                      onChange={(e) => {
                                          const newVars = { ...entry.envVars, [key]: e.target.value };
                                          onUpdate({ ...entry, envVars: newVars });
                                      }}
                                    />
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-4 italic">
                            {t('envVarsSecureNote', 'workspace')}
                        </p>
                   </div>
                )}
            </div>
        </div>
    );
};
