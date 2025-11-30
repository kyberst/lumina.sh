
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
         <div className="flex flex-col h-[14rem] relative mb-6 bg-[#ffffbb]/20 border-2 border-[#ffff7e] rounded-3xl focus-within:border-[#ffc93a] focus-within:ring-4 focus-within:ring-[#ffff7e] transition-all overflow-hidden shadow-inner">
            {attachments.length > 0 && (
                <div className="flex gap-2 p-3 bg-white border-b border-[#ffff7e] overflow-x-auto">
                    {attachments.map((att, idx) => (
                        <div key={idx} className="bg-[#ffff7e]/50 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 border border-[#ffc93a] shrink-0 text-[#ff7e15] font-bold">
                            <span className="truncate max-w-[120px]">{att.name}</span>
                            <button onClick={() => removeAttachment(idx)} className="hover:text-[#ff2935] hover:bg-[#ff2935]/10 rounded-full w-5 h-5 flex items-center justify-center transition-colors text-lg leading-none">&times;</button>
                        </div>
                    ))}
                </div>
            )}
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('placeholder', 'journal')}
                className="flex-1 bg-transparent text-slate-700 placeholder:text-slate-400 text-lg focus:outline-none resize-none font-medium leading-relaxed p-6"
                disabled={isProcessing}
            />
            {/* Character Count */}
            <div className="absolute bottom-4 right-6 text-xs text-slate-400 font-bold pointer-events-none bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg border border-[#ffc93a]/30">
                {content.length}/8000
            </div>
         </div>

         {/* Controls Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Stack & Complexity */}
            <div className="flex flex-col gap-4">
                <div className="bg-white p-5 rounded-3xl border border-[#ffff7e] shadow-sm">
                    <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-3 flex justify-between items-center">
                        <span>Target Stack</span>
                        <span className="text-[#ff7e15]">{stack.length} selected</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {COMMON_STACKS.map(tech => (
                            <button
                                key={tech}
                                onClick={() => toggleStackItem(tech)}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                                    stack.includes(tech)
                                    ? 'bg-[#ff7e15] text-white border-[#ff7e15] shadow-md shadow-[#ff7e15]/20'
                                    : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-[#ffc93a] hover:text-[#ff7e15]'
                                }`}
                            >
                                {tech}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-3 bg-white p-5 rounded-3xl border border-[#ffff7e] shadow-sm">
                    <div className="flex justify-between w-full text-xs text-slate-500 font-extrabold uppercase tracking-wider items-center">
                        <span>Simple</span>
                        <span className="text-[#ff7e15] bg-[#ffff7e]/30 px-2 py-1 rounded-md">{t('mood', 'journal')}: {complexity}%</span>
                        <span>Complex</span>
                    </div>
                    <div className="relative pt-2">
                        <input
                            type="range" min="0" max="100" value={complexity}
                            onChange={(e) => setComplexity(Number(e.target.value))}
                            className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-[#ff7e15] hover:accent-[#ff2935] transition-all"
                            disabled={isProcessing}
                        />
                    </div>
                </div>
            </div>
            
            {/* Right Column: Name & Model & Language */}
            <div className="flex flex-col gap-4">
                 <input 
                    type="text" value={project} onChange={(e) => setProject(e.target.value)}
                    placeholder={t('project', 'journal') + " (e.g. ChatApp)"}
                    className="w-full bg-white border-2 border-[#ffff7e] rounded-2xl px-5 py-4 text-sm text-slate-800 focus:border-[#ffc93a] focus:ring-4 focus:ring-[#ffff7e]/50 outline-none font-bold placeholder:font-normal transition-all shadow-sm"
                    disabled={isProcessing}
                />
                 
                 {/* App Language */}
                 <div className="bg-white p-4 rounded-2xl border border-[#ffff7e] shadow-sm">
                     <label className="block text-[10px] text-slate-400 font-bold uppercase mb-2">App Content Language (Multi-Select)</label>
                     <div className="relative mb-2">
                         <select onChange={addLanguage} className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#ffc93a] cursor-pointer">
                             <option value="">+ Add Language...</option>
                             {LANGUAGES_LIST.map(l => <option key={l} value={l} disabled={appLanguages.includes(l)}>{l}</option>)}
                         </select>
                         <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                         </div>
                     </div>
                     <div className="flex flex-wrap gap-2">
                         {appLanguages.map(lang => (
                             <div key={lang} className="bg-[#ffffbb] border border-[#ffc93a] text-[#ff7e15] text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                                 {lang}
                                 <button onClick={() => removeLanguage(lang)} className="hover:text-[#ff2935]">&times;</button>
                             </div>
                         ))}
                         {appLanguages.length === 0 && <span className="text-[10px] text-slate-400 italic">No language selected (English default)</span>}
                     </div>
                 </div>

                 {/* LLM Selector */}
                 <div className="flex gap-3">
                     <div className="relative flex-1">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1 ml-1">Provider</label>
                        <select 
                            value={selectedProvider} 
                            onChange={e => { setSelectedProvider(e.target.value); setSelectedModel(''); }}
                            className="w-full appearance-none bg-[#ffffbb]/30 border border-[#ffc93a] hover:border-[#ff7e15] rounded-2xl px-4 py-3 text-xs font-bold text-[#ff7e15] outline-none flex-1 focus:ring-2 focus:ring-[#ffff7e] cursor-pointer transition-colors"
                        >
                            <option value="gemini">Google Gemini</option>
                            {settings.customProviders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <div className="absolute right-3 top-8 pointer-events-none text-[#ffc93a]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                     </div>
                     <div className="relative flex-1">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1 ml-1">Model</label>
                        <select 
                            value={selectedModel} 
                            onChange={e => setSelectedModel(e.target.value)}
                            className="w-full appearance-none bg-[#ffffbb]/30 border border-[#ffc93a] hover:border-[#ff7e15] rounded-2xl px-4 py-3 text-xs font-bold text-[#ff7e15] outline-none flex-1 focus:ring-2 focus:ring-[#ffff7e] cursor-pointer transition-colors"
                        >
                            {selectedProvider === 'gemini' && !selectedModel && <option value="flash">Flash (Default)</option>}
                            {activeModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                        <div className="absolute right-3 top-8 pointer-events-none text-[#ffc93a]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                     </div>
                 </div>
            </div>
         </div>

         {/* Bottom Toolbar */}
         <div className="flex justify-between items-center mt-6">
            <div className="flex gap-2">
                <button 
                    onClick={() => attachmentRef.current?.click()}
                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-[#ff7e15] hover:bg-[#ffff7e] transition-all border border-slate-100 hover:border-[#ffc93a]"
                    title={t('attachments', 'journal')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                </button>
                <input type="file" ref={attachmentRef} style={{ display: 'none' }} multiple onChange={handleAttachment} />
                
                <button 
                    onClick={toggleListening}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border ${
                        isListening 
                        ? 'bg-[#ff2935] text-white animate-pulse border-[#ff2935]' 
                        : 'bg-white text-slate-400 hover:text-[#ff7e15] hover:bg-[#ffff7e] border-slate-100 hover:border-[#ffc93a]'
                    }`}
                    title={isListening ? t('voiceStop', 'journal') : t('voiceStart', 'journal')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                </button>
            </div>

            <button 
                onClick={onSubmit}
                disabled={isProcessing || !content.trim()}
                className="bg-gradient-to-r from-[#ff7e15] to-[#ff2935] hover:from-[#ff2935] hover:to-[#ff7e15] text-white rounded-2xl px-10 py-4 font-extrabold text-sm uppercase tracking-widest shadow-xl shadow-[#ff7e15]/30 hover:-translate-y-1 hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
            >
                {isProcessing ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Building...
                    </>
                ) : (
                    <>
                        {t('analyze', 'journal')}
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </>
                )}
            </button>
         </div>
    </>
  );
};
