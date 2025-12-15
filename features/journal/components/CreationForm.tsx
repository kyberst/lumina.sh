
import React, { useEffect } from 'react';
import { t } from '../../../services/i18n';
import { AppSettings } from '../../../types';
import { useCreationForm } from '../hooks/useCreationForm';
import { TechStackSelector } from './creation/TechStackSelector';
import { ComplexityControl } from './creation/ComplexityControl';

interface CreationFormProps {
  settings: AppSettings;
  content: string;
  setContent: (v: string) => void;
  project: string;
  setProject: (v: string) => void;
  complexity: number;
  setComplexity: (v: number) => void;
  stack: string[];
  setStack: (v: string[]) => void;
  appLanguages: string[];
  setAppLanguages: (v: string[]) => void;
  isProcessing: boolean;
  onSubmit: () => void;
  attachments: { name: string; type: string; data: string }[];
  setAttachments: React.Dispatch<React.SetStateAction<{ name: string; type: string; data: string }[]>>;
  selectedProvider: string;
  setSelectedProvider: (v: string) => void;
  selectedModel: string;
  setSelectedModel: (v: string) => void;
}

const LANGUAGES_LIST = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Chinese', 'Japanese', 'Korean', 'Russian', 'Arabic', 'Hindi'];

export const CreationForm: React.FC<CreationFormProps> = (props) => {
  const { isListening, toggleListening, attachmentRef, handleAttachment, removeAttachment, toggleStackItem } = useCreationForm(props.settings, props.setContent);

  const activeModels = props.selectedProvider === 'gemini' 
    ? [{ id: 'flash', name: t('geminiFlash', 'creation') }, { id: 'pro', name: t('geminiPro', 'creation') }]
    : props.settings.customProviders.find(p => p.id === props.selectedProvider)?.models || [];

  return (
    <>
         <div data-tour="main-prompt" className="flex flex-col h-[14rem] relative mb-6 bg-white border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all overflow-hidden shadow-sm">
            {props.attachments.length > 0 && (
                <div className="flex gap-2 p-3 bg-slate-50 border-b border-slate-100 overflow-x-auto">
                    {props.attachments.map((att, idx) => (
                        <div key={idx} className="bg-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 border border-slate-200 shrink-0 shadow-sm">
                            <span className="truncate max-w-[120px]">{att.name}</span>
                            <button onClick={() => removeAttachment(idx)} className="hover:text-red-500 text-lg leading-none">&times;</button>
                        </div>
                    ))}
                </div>
            )}
            <textarea
                value={props.content}
                onChange={(e) => props.setContent(e.target.value)}
                placeholder={t('placeholder', 'builder')}
                className="flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 text-lg focus:outline-none resize-none p-6"
                disabled={props.isProcessing}
            />
            <div className="absolute bottom-4 right-6 text-xs text-slate-400 font-bold pointer-events-none bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                {props.content.length}/8000
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
                <TechStackSelector selected={props.stack} onToggle={toggleStackItem} />
                <ComplexityControl value={props.complexity} onChange={props.setComplexity} disabled={props.isProcessing} />
            </div>
            
            <div className="flex flex-col gap-4">
                 <div>
                    <label className="block text-[11px] text-slate-900 font-black uppercase mb-1.5 ml-1">{t('projectCategory', 'creation')}</label>
                    <input type="text" value={props.project} onChange={(e) => props.setProject(e.target.value)} placeholder={t('projectCategoryPlaceholder', 'creation')} className="shadcn-input h-11 text-sm font-semibold" disabled={props.isProcessing} />
                 </div>
                 
                 <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                     <label className="block text-[11px] text-slate-900 font-black uppercase mb-2">{t('appContentLanguage', 'creation')}</label>
                     <div className="relative mb-2">
                         <select onChange={(e) => { if(e.target.value && !props.appLanguages.includes(e.target.value)) props.setAppLanguages([...props.appLanguages, e.target.value]); e.target.value=''; }} className="shadcn-input cursor-pointer font-medium">
                             <option value="">{t('addLanguage', 'creation')}</option>
                             {LANGUAGES_LIST.map(l => <option key={l} value={l} disabled={props.appLanguages.includes(l)}>{l}</option>)}
                         </select>
                     </div>
                     <div className="flex flex-wrap gap-2 min-h-[2rem]">
                         {props.appLanguages.map(lang => (
                             <div key={lang} className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                                 {lang} <button onClick={() => props.setAppLanguages(props.appLanguages.filter(l => l !== lang))} className="hover:text-red-500 ml-1">&times;</button>
                             </div>
                         ))}
                     </div>
                 </div>

                 <div className="flex gap-3">
                     <div className="relative flex-1">
                        <label className="block text-[11px] text-slate-900 font-black uppercase mb-1.5 ml-1">{t('provider', 'creation')}</label>
                        <select value={props.selectedProvider} onChange={e => { props.setSelectedProvider(e.target.value); props.setSelectedModel(''); }} className="shadcn-input font-medium text-slate-700">
                            <option value="gemini">{t('googleGemini', 'creation')}</option>
                            {props.settings.customProviders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                     </div>
                     <div className="relative flex-1">
                        <label className="block text-[11px] text-slate-900 font-black uppercase mb-1.5 ml-1">{t('model', 'creation')}</label>
                        <select value={props.selectedModel} onChange={e => props.setSelectedModel(e.target.value)} className="shadcn-input font-medium text-slate-700">
                            {props.selectedProvider === 'gemini' && !props.selectedModel && <option value="flash">{t('flashDefault', 'creation')}</option>}
                            {activeModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                     </div>
                 </div>
            </div>
         </div>

         <div className="flex justify-between items-center mt-6">
            <div className="flex gap-2">
                <button onClick={() => attachmentRef.current?.click()} className="shadcn-btn shadcn-btn-outline h-12 w-12 rounded-full p-0 bg-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                </button>
                <input type="file" ref={attachmentRef} style={{ display: 'none' }} multiple onChange={handleAttachment} />
                <button onClick={toggleListening} className={`h-12 w-12 rounded-full flex items-center justify-center transition-all border shadow-sm ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-slate-500 hover:text-indigo-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path></svg>
                </button>
            </div>
            <button onClick={props.onSubmit} disabled={props.isProcessing || !props.content.trim()} className="shadcn-btn shadcn-btn-primary h-12 px-8 text-sm font-bold uppercase tracking-widest shadow-lg rounded-full">
                {props.isProcessing ? t('building', 'creation') : t('analyze', 'builder')}
            </button>
         </div>
    </>
  );
};
