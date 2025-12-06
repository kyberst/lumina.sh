import React, { useRef, useEffect, useState } from 'react';
import { t } from '../../../services/i18n';
import { useVoiceInput } from '../../../hooks/useVoiceInput';
import { AppSettings, AIProvider } from '../../../types';

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
  
  // LLM Selection
  selectedProvider: string;
  setSelectedProvider: (v: string) => void;
  selectedModel: string;
  setSelectedModel: (v: string) => void;
}

const COMMON_STACKS = [
    'React', 'Vue', 'Svelte', 'Angular', 
    'TypeScript', 'JavaScript', 'Python', 'Node.js', 
    'Tailwind', 'Bootstrap', 'Sass', 'HTML/CSS',
    'SQL', 'MongoDB', 'Firebase', 'Next.js'
];

const LANGUAGES_LIST = [
    'English', 'Spanish', 'French', 'German', 'Italian', 
    'Portuguese', 'Chinese', 'Japanese', 'Korean', 
    'Russian', 'Arabic', 'Hindi'
];

export const CreationForm: React.FC<CreationFormProps> = ({ 
    settings, content, setContent, project, setProject, complexity, setComplexity, stack, setStack, appLanguages, setAppLanguages,
    isProcessing, onSubmit, attachments, setAttachments,
    selectedProvider, setSelectedProvider, selectedModel, setSelectedModel
}) => {
  const attachmentRef = useRef<HTMLInputElement>(null);
  const { isListening, toggleListening, transcript, resetTranscript } = useVoiceInput();

  useEffect(() => {
    if (transcript) {
        setContent(content + (content ? ' ' : '') + transcript);
        resetTranscript();
    }
  }, [transcript, resetTranscript, content, setContent]);

  const handleAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (evt) => {
              if (evt.target?.result) {
                  setAttachments(prev => [...prev, {
                      name: file.name,
                      type: file.type,
                      data: evt.target!.result as string
                  }]);
              }
          };
          reader.readAsDataURL(file);
      }
      if(attachmentRef.current) attachmentRef.current.value = '';
  };
  
  const removeAttachment = (index: number) => {
      setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const toggleStackItem = (item: string) => {
      if (stack.includes(item)) {
          setStack(stack.filter(s => s !== item));
      } else {
          setStack([...stack, item]);
      }
  };

  const addLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const lang = e.target.value;
      if (lang && !appLanguages.includes(lang)) {
          setAppLanguages([...appLanguages, lang]);
      }
      e.target.value = ''; // Reset select
  };

  const removeLanguage = (lang: string) => {
      setAppLanguages(appLanguages.filter(l => l !== lang));
  };

  const activeModels = selectedProvider === 'gemini' 
    ? [{ id: 'flash', name: 'Gemini Flash (Fast)' }, { id: 'pro', name: 'Gemini Pro (Smart)' }]
    : settings.customProviders.find(p => p.id === selectedProvider)?.models || [];

  return (
    <>
         <div className="flex flex-col h-[14rem] relative mb-6 bg-white border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all overflow-hidden shadow-sm">
            {attachments.length > 0 && (
                <div className="flex gap-2 p-3 bg-slate-50 border-b border-slate-100 overflow-x-auto">
                    {attachments.map((att, idx) => (
                        <div key={idx} className="bg-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 border border-slate-200 shrink-0 text-slate-700 font-medium shadow-sm">
                            <span className="truncate max-w-[120px]">{att.name}</span>
                            <button onClick={() => removeAttachment(idx)} className="hover:text-red-500 text-lg leading-none">&times;</button>
                        </div>
                    ))}
                </div>
            )}
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('placeholder', 'journal')}
                className="flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 text-lg focus:outline-none resize-none font-medium leading-relaxed p-6"
                disabled={isProcessing}
            />
            {/* Character Count */}
            <div className="absolute bottom-4 right-6 text-xs text-slate-400 font-bold pointer-events-none bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                {content.length}/8000
            </div>
         </div>

         {/* Controls Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Stack & Complexity */}
            <div className="flex flex-col gap-4">
                <div className="bg-white text-slate-800 p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-[11px] text-slate-900 font-black uppercase tracking-widest mb-3 flex justify-between items-center">
                        <span>Target Stack</span>
                        <span className="text-indigo-600">{stack.length} selected</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {COMMON_STACKS.map(tech => (
                            <button
                                key={tech}
                                onClick={() => toggleStackItem(tech)}
                                className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold transition-all shadow-sm ${
                                    stack.includes(tech)
                                    ? 'border-indigo-600 bg-indigo-600 text-white'
                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                }`}
                            >
                                {tech}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-3 bg-white text-slate-800 p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between w-full text-[11px] text-slate-900 font-black uppercase tracking-wider items-center">
                        <span>Simple</span>
                        <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{t('mood', 'journal')}: {complexity}%</span>
                        <span>Complex</span>
                    </div>
                    <div className="relative pt-2">
                        <input
                            type="range" min="0" max="100" value={complexity}
                            onChange={(e) => setComplexity(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
                            disabled={isProcessing}
                        />
                    </div>
                </div>
            </div>
            
            {/* Right Column: Name & Model & Language */}
            <div className="flex flex-col gap-4">
                 <div>
                    <label className="block text-[11px] text-slate-900 font-black uppercase mb-1.5 ml-1">Project Category</label>
                    <input 
                        type="text" value={project} onChange={(e) => setProject(e.target.value)}
                        placeholder="e.g. Finance Dashboard"
                        className="shadcn-input h-11 text-sm font-semibold text-slate-900"
                        disabled={isProcessing}
                    />
                 </div>
                 
                 {/* App Language */}
                 <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                     <label className="block text-[11px] text-slate-900 font-black uppercase mb-2">App Content Language</label>
                     <div className="relative mb-2">
                         <select onChange={addLanguage} className="shadcn-input cursor-pointer font-medium text-slate-700">
                             <option value="">+ Add Language...</option>
                             {LANGUAGES_LIST.map(l => <option key={l} value={l} disabled={appLanguages.includes(l)}>{l}</option>)}
                         </select>
                     </div>
                     <div className="flex flex-wrap gap-2 min-h-[2rem]">
                         {appLanguages.map(lang => (
                             <div key={lang} className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                                 {lang}
                                 <button onClick={() => removeLanguage(lang)} className="hover:text-red-500 text-base leading-none ml-1">&times;</button>
                             </div>
                         ))}
                     </div>
                 </div>

                 {/* LLM Selector */}
                 <div className="flex gap-3">
                     <div className="relative flex-1">
                        <label className="block text-[11px] text-slate-900 font-black uppercase mb-1.5 ml-1">Provider</label>
                        <select 
                            value={selectedProvider} 
                            onChange={e => { setSelectedProvider(e.target.value); setSelectedModel(''); }}
                            className="shadcn-input font-medium text-slate-700"
                        >
                            <option value="gemini">Google Gemini</option>
                            {settings.customProviders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                     </div>
                     <div className="relative flex-1">
                        <label className="block text-[11px] text-slate-900 font-black uppercase mb-1.5 ml-1">Model</label>
                        <select 
                            value={selectedModel} 
                            onChange={e => setSelectedModel(e.target.value)}
                            className="shadcn-input font-medium text-slate-700"
                        >
                            {selectedProvider === 'gemini' && !selectedModel && <option value="flash">Flash (Default)</option>}
                            {activeModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                     </div>
                 </div>
            </div>
         </div>

         {/* Bottom Toolbar */}
         <div className="flex justify-between items-center mt-6">
            <div className="flex gap-2">
                <button 
                    onClick={() => attachmentRef.current?.click()}
                    className="shadcn-btn shadcn-btn-outline h-12 w-12 rounded-full p-0 bg-white"
                    title={t('attachments', 'journal')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                </button>
                <input type="file" ref={attachmentRef} style={{ display: 'none' }} multiple onChange={handleAttachment} />
                
                <button 
                    onClick={toggleListening}
                    className={`h-12 w-12 rounded-full flex items-center justify-center transition-all border shadow-sm ${
                        isListening 
                        ? 'bg-red-500 text-white animate-pulse border-red-600' 
                        : 'bg-white text-slate-500 hover:text-indigo-600 border-slate-200 hover:border-indigo-300'
                    }`}
                    title={isListening ? t('voiceStop', 'journal') : t('voiceStart', 'journal')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                </button>
            </div>

            <button 
                onClick={onSubmit}
                disabled={isProcessing || !content.trim()}
                className="shadcn-btn shadcn-btn-primary h-12 px-8 text-sm font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all rounded-full"
            >
                {isProcessing ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        Building...
                    </>
                ) : (
                    <>
                        {t('analyze', 'journal')}
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </>
                )}
            </button>
         </div>
    </>
  );
};