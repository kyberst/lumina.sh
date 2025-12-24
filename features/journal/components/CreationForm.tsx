import React, { useEffect, useRef, useState } from 'react';
import { t } from '../../../services/i18n';
import { AppSettings } from '../../../types';
import { useVoiceInput } from '../../../hooks/useVoiceInput';
import { TechStackSelector } from './creation/TechStackSelector';
import { ComplexityControl } from './creation/ComplexityControl';
import { UnifiedModelSelector } from './creation/UnifiedModelSelector';

interface CreationFormProps {
  settings: AppSettings;
  content: string;
  setContent: (v: string) => void;
  project: string;
  setProject: (v: string) => void;
  complexity: number;
  setComplexity: (v: number) => void;
  stack: string[];
  setStack: (v: React.SetStateAction<string[]>) => void;
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

const PLACEHOLDERS = [
    "Describe a Node.js web app (e.g., \"A realtime chat with dark mode\")...",
    "Create a dashboard for crypto prices using React and Tailwind...",
    "Build a personal portfolio with a 3D hero section...",
    "Generate a CRM for a coffee shop with inventory management...",
    "Make a landing page for a new AI startup..."
];

export const CreationForm: React.FC<CreationFormProps> = (props) => {
  const { isListening, toggleListening, transcript, resetTranscript } = useVoiceInput();
  const attachmentRef = useRef<HTMLInputElement>(null);
  
  const [placeholder, setPlaceholder] = useState('');
  const [phIndex, setPhIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = PLACEHOLDERS[phIndex];
    const typingSpeed = isDeleting ? 30 : 50;
    const pauseTime = 2000;

    const timer = setTimeout(() => {
        if (!isDeleting && charIndex < currentText.length) {
            setPlaceholder(currentText.substring(0, charIndex + 1));
            setCharIndex(charIndex + 1);
        } else if (!isDeleting && charIndex === currentText.length) {
            setTimeout(() => setIsDeleting(true), pauseTime);
        } else if (isDeleting && charIndex > 0) {
            setPlaceholder(currentText.substring(0, charIndex - 1));
            setCharIndex(charIndex - 1);
        } else {
            setIsDeleting(false);
            setPhIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, phIndex]);


  useEffect(() => {
    if (transcript) {
        const newContent = props.content + (props.content ? ' ' : '') + transcript;
        props.setContent(newContent);
        resetTranscript();
    }
  }, [transcript, resetTranscript, props.content, props.setContent]);

  const handleAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (evt) => {
              if (evt.target?.result) {
                  props.setAttachments(prev => [...prev, {
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
      props.setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const toggleStackItem = (item: string) => {
      props.setStack(prev => prev.includes(item) ? prev.filter(s => s !== item) : [...prev, item]);
  };

  return (
    <>
         <div className="group relative rounded-2xl p-[1px] h-[16rem] mb-8 transition-all duration-500 shadow-[0_0_20px_-5px_rgba(var(--primary),0.1)] hover:shadow-[0_0_40px_-10px_rgba(var(--primary),0.3)] focus-within:shadow-[0_0_60px_-10px_rgba(var(--primary),0.5)] focus-within:scale-[1.005]">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/40 via-primary to-purple-500/40 animate-gradient rounded-2xl blur-[0.5px] opacity-100" />
            <div className="relative flex flex-col h-full bg-card/90 backdrop-blur-xl rounded-2xl overflow-hidden ring-1 ring-white/10 dark:ring-white/5 transition-colors group-focus-within:bg-card/95">
                {props.attachments.length > 0 && (
                    <div className="flex gap-2 p-3 bg-muted/30 border-b border-border/50 overflow-x-auto">
                        {props.attachments.map((att, idx) => (
                            <div key={idx} className="bg-background/80 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 border border-border shrink-0 shadow-sm animate-in zoom-in">
                                <span className="truncate max-w-[120px]">{att.name}</span>
                                <button onClick={() => removeAttachment(idx)} className="hover:text-destructive text-lg leading-none transition-colors">&times;</button>
                            </div>
                        ))}
                    </div>
                )}
                
                <textarea
                    value={props.content}
                    onChange={(e) => props.setContent(e.target.value)}
                    placeholder={placeholder + "|"}
                    className="flex-1 bg-transparent text-slate-900 dark:text-slate-50 placeholder:text-muted-foreground/70 text-lg focus:outline-none resize-none p-6 font-medium leading-relaxed font-sans custom-scrollbar"
                    disabled={props.isProcessing}
                />
                
                <div className="absolute bottom-4 right-6 text-[10px] font-bold pointer-events-none bg-background/50 px-3 py-1.5 rounded-full border border-border/50 backdrop-blur-sm text-muted-foreground transition-all group-focus-within:border-primary/30 group-focus-within:text-primary">
                    {props.content.length}/8000
                </div>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <div className="flex flex-col gap-4">
                <TechStackSelector selected={props.stack} onToggle={toggleStackItem} />
                <ComplexityControl value={props.complexity} onChange={props.setComplexity} disabled={props.isProcessing} />
            </div>
            
            <div className="flex flex-col gap-4">
                 <div>
                    <label className="block text-[11px] text-muted-foreground font-black uppercase mb-1.5 ml-1 tracking-wider">{t('creation.category', 'builder')}</label>
                    <input type="text" value={props.project} onChange={(e) => props.setProject(e.target.value)} placeholder="e.g. Finance Dashboard" className="shadcn-input h-11 text-sm font-semibold" disabled={props.isProcessing} />
                 </div>
                 
                 <div className="bg-card/50 backdrop-blur-sm p-4 rounded-xl border border-border/50 shadow-sm">
                     <label className="block text-[11px] text-muted-foreground font-black uppercase mb-2 tracking-wider">{t('creation.contentLang', 'builder')}</label>
                     <div className="relative mb-2">
                         <select onChange={(e) => { if(e.target.value && !props.appLanguages.includes(e.target.value)) props.setAppLanguages([...props.appLanguages, e.target.value]); e.target.value=''; }} className="shadcn-input cursor-pointer font-medium bg-transparent">
                             <option value="">{t('creation.addLang', 'builder')}</option>
                             {LANGUAGES_LIST.map(l => <option key={l} value={l} disabled={props.appLanguages.includes(l)}>{l}</option>)}
                         </select>
                     </div>
                     <div className="flex flex-wrap gap-2 min-h-[2rem]">
                         {props.appLanguages.map(lang => (
                             <div key={lang} className="bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 animate-in zoom-in">
                                 {lang} <button onClick={() => props.setAppLanguages(props.appLanguages.filter(l => l !== lang))} className="hover:text-destructive ml-1 transition-colors">&times;</button>
                             </div>
                         ))}
                     </div>
                 </div>

                 <UnifiedModelSelector 
                    settings={props.settings}
                    selectedProvider={props.selectedProvider}
                    selectedModel={props.selectedModel}
                    onChange={(p, m) => { props.setSelectedProvider(p); props.setSelectedModel(m); }}
                    isProcessing={props.isProcessing}
                 />
            </div>
         </div>

         <div className="flex justify-between items-center mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <div className="flex gap-3">
                <button onClick={() => attachmentRef.current?.click()} className="h-12 w-12 rounded-xl flex items-center justify-center border border-border bg-card hover:bg-muted hover:border-primary/50 hover:text-primary transition-all shadow-sm group">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:scale-110 transition-transform"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                </button>
                <input type="file" ref={attachmentRef} style={{ display: 'none' }} multiple onChange={handleAttachment} />
                <button onClick={toggleListening} className={`h-12 w-12 rounded-xl flex items-center justify-center border transition-all shadow-sm ${isListening ? 'bg-destructive text-destructive-foreground border-destructive animate-pulse' : 'bg-card border-border text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-muted'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path></svg>
                </button>
            </div>
            
            <button 
                onClick={props.onSubmit} 
                disabled={props.isProcessing || !props.content.trim()} 
                className="relative group overflow-hidden rounded-full h-12 px-8 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
            >
                <div className="absolute inset-0 bg-primary group-hover:bg-primary/90 transition-colors"></div>
                <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700"></div>
                
                <span className="relative flex items-center gap-2 text-primary-foreground font-bold text-sm uppercase tracking-widest">
                    {props.isProcessing ? (
                        <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            {t('creation.building', 'builder')}
                        </>
                    ) : (
                        <>
                            {t('analyze', 'builder')}
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </>
                    )}
                </span>
            </button>
         </div>
    </>
  );
};
