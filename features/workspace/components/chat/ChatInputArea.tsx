
import React, { useRef, useState, useEffect } from 'react';
import { t } from '../../../../services/i18n';

interface ModelOption {
    id: string;
    name: string;
}

interface Props {
    chatInput: string;
    setChatInput: (v: string) => void;
    isProcessing: boolean;
    isListening: boolean;
    toggleListening: () => void;
    onSend: () => void;
    onStop: () => void;
    attachments: any[];
    setAttachments: React.Dispatch<React.SetStateAction<any[]>>;
    showSuggestions?: boolean;
    suggestions: string[];
    selectedModel: string;
    onModelChange: (modelId: string) => void;
    availableModels: ModelOption[];
}

const PLACEHOLDERS = [
    "Ask Lumina to add a login page...",
    "Explain how the routing works...",
    "Change the color scheme to dark mode...",
    "Fix the bug in the header component...",
    "Deploy this application..."
];

export const ChatInputArea: React.FC<Props> = ({ 
    chatInput, setChatInput, isProcessing, isListening, toggleListening, onSend, onStop, 
    attachments, setAttachments, showSuggestions, suggestions = [],
    selectedModel, onModelChange, availableModels
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Dynamic Placeholder Logic
    const [placeholder, setPlaceholder] = useState('');
    const [phIndex, setPhIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (isProcessing) {
            setPlaceholder(t('chat.processing', 'builder'));
            return;
        }

        const currentText = PLACEHOLDERS[phIndex];
        const typingSpeed = isDeleting ? 30 : 60;
        const pauseTime = 3000;

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
    }, [charIndex, isDeleting, phIndex, isProcessing]);
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            if (!isProcessing && chatInput.trim()) onSend();
        }
    };

    const handleAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setAttachments([...attachments, { name: file.name, type: file.type, data: 'base64_placeholder' }]);
        }
    };

    const shouldShowSuggestions = showSuggestions && !isProcessing && !chatInput && suggestions.length > 0;

    return (
        <div className="p-4 bg-background/50 backdrop-blur-md border-t border-border/50 space-y-3 z-10" data-tour="chat-input">
            {shouldShowSuggestions && (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar px-1 snap-x">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            onClick={() => setChatInput(suggestion)}
                            className="text-[10px] font-bold px-4 py-2 bg-background hover:bg-primary/5 text-muted-foreground hover:text-primary border border-border hover:border-primary/30 rounded-full transition-all whitespace-nowrap shadow-sm hover:shadow-md animate-in fade-in slide-in-from-bottom-2 snap-start ring-1 ring-transparent hover:ring-primary/20"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}

            {attachments.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 px-1">
                    {attachments.map((att, i) => (
                        <div key={i} className="text-[10px] bg-card px-3 py-1.5 rounded-lg border border-border shadow-sm flex items-center gap-2 animate-in zoom-in-95">
                            <span className="font-mono text-xs">📎</span>
                            <span className="font-medium text-foreground max-w-[100px] truncate">{att.name}</span>
                            <button onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">&times;</button>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Animated Input Container (Styled like CreationForm) */}
            <div className="relative group rounded-2xl p-[1px] shadow-lg shadow-black/5">
                {/* Model Selector Pill - Absolute positioned at top right of input area */}
                <div className="absolute -top-3 right-4 z-20">
                    <div className="relative">
                        <select 
                            value={selectedModel} 
                            onChange={(e) => onModelChange(e.target.value)}
                            disabled={isProcessing}
                            className="appearance-none bg-background text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary border border-border hover:border-primary/30 rounded-full pl-3 pr-6 py-1 cursor-pointer transition-all shadow-sm outline-none focus:ring-1 focus:ring-primary/50"
                        >
                            {availableModels.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>

                {/* Animated Gradient Border Layer - Visible by Default */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/40 via-primary to-purple-500/40 animate-gradient rounded-2xl blur-[0.5px] opacity-70 group-focus-within:opacity-100 transition-opacity" />
                
                <div className="relative flex items-end gap-2 bg-card rounded-2xl p-2 z-10">
                    <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="p-2.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0" title={t('chat.attach', 'builder')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleAttach} />
                    
                    <button onClick={toggleListening} className={`p-2.5 rounded-xl shrink-0 transition-all ${isListening ? 'bg-destructive text-destructive-foreground animate-pulse shadow-md shadow-destructive/30' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                    </button>

                    <textarea 
                        value={chatInput} 
                        onChange={e => setChatInput(e.target.value)} 
                        onKeyDown={handleKeyDown} 
                        placeholder={placeholder + (isProcessing ? "" : "|")}
                        disabled={isProcessing} 
                        className="flex-1 min-h-[44px] max-h-[150px] py-3 px-2 bg-transparent border-none outline-none resize-none text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 custom-scrollbar font-medium" 
                        rows={1} 
                    />
                    
                    {isProcessing ? (
                        <button onClick={onStop} className="relative group/stop p-2.5 rounded-xl transition-all shadow-md shrink-0 overflow-hidden">
                            {/* Animated Border Background */}
                            <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-spin opacity-100" style={{animationDuration: '3s'}} />
                            {/* Inner Mask */}
                            <div className="absolute inset-[2px] bg-card rounded-[10px]" />
                            
                            {/* Icon */}
                            <div className="relative z-10 text-red-500 hover:text-red-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                            </div>
                        </button>
                    ) : (
                        <button 
                            onClick={onSend} 
                            disabled={!chatInput.trim()} 
                            className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-primary/20 shrink-0 group/send"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover/send:translate-x-0.5 group-hover/send:-translate-y-0.5 transition-transform"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
