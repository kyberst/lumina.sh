import React, { useRef } from 'react';
import { t } from '../../../../services/i18n';

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
}

/**
 * Área de Input del Chat.
 * Maneja textarea auto-expandible, botón de adjuntar y grabación de voz.
 */
export const ChatInputArea: React.FC<Props> = ({ 
    chatInput, setChatInput, isProcessing, isListening, toggleListening, onSend, onStop, attachments, setAttachments, showSuggestions, suggestions = []
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            if (!isProcessing && chatInput.trim()) onSend();
        }
    };

    const handleAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            // Lógica simple para demo, idealmente usar FileReader
            const file = e.target.files[0];
            setAttachments([...attachments, { name: file.name, type: file.type, data: 'base64_placeholder' }]);
        }
    };

    const placeholderText = t('placeholderChat', 'builder');

    const shouldShowSuggestions = showSuggestions && !isProcessing && !chatInput && suggestions.length > 0;

    return (
        <div className="p-3 bg-white border-t space-y-2" data-tour="chat-input">
            {shouldShowSuggestions && (
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            onClick={() => setChatInput(suggestion)}
                            className="text-[11px] font-medium px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 rounded-full transition-all whitespace-nowrap shadow-sm animate-in fade-in slide-in-from-bottom-1"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}

            {attachments.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {attachments.map((att, i) => (
                        <span key={i} className="text-[10px] bg-slate-100 px-2 py-1 rounded border border-slate-200">{att.name}</span>
                    ))}
                </div>
            )}
            <div className="flex gap-2 items-end">
                <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="shadcn-btn shadcn-btn-outline w-10 px-0 h-[44px] shrink-0" title="Attach File">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleAttach} />
                
                <button onClick={toggleListening} className={`shadcn-btn w-10 px-0 h-[44px] shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'shadcn-btn-outline'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                </button>

                <textarea 
                    value={chatInput} 
                    onChange={e => setChatInput(e.target.value)} 
                    onKeyDown={handleKeyDown} 
                    placeholder={isProcessing ? "AI is working..." : placeholderText} 
                    disabled={isProcessing} 
                    className="shadcn-input flex-1 min-h-[44px] max-h-[150px] py-2.5 resize-none overflow-y-auto" 
                    rows={1} 
                    style={{ height: '44px' }} 
                />
                
                {isProcessing ? (
                    <button onClick={onStop} className="shadcn-btn bg-red-500 text-white w-10 px-0 h-[44px] shrink-0">Stop</button>
                ) : (
                    <button onClick={onSend} disabled={!chatInput.trim()} className="shadcn-btn w-10 px-0 h-[44px] shrink-0 shadcn-btn-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                )}
            </div>
        </div>
    );
};