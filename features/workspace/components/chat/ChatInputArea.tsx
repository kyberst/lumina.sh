
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
    mode?: 'modify' | 'explain';
}

/**
 * Área de Input del Chat.
 * Maneja textarea auto-expandible, botón de adjuntar y grabación de voz.
 */
export const ChatInputArea: React.FC<Props> = ({ 
    chatInput, setChatInput, isProcessing, isListening, toggleListening, onSend, onStop, attachments, setAttachments, showSuggestions, mode = 'modify'
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const suggestions = ['makeGreen', 'addInput', 'saveBtn', 'fixLayout', 'darkMode'];

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

    const placeholderText = mode === 'explain' 
        ? t('placeholderExplain', 'builder') 
        : t('placeholderModify', 'builder');

    return (
        <div className="p-3 bg-white border-t space-y-2" data-tour="chat-input">
            {showSuggestions && !isProcessing && !chatInput && mode === 'modify' && (
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
                    {suggestions.map(key => (
                        <button
                            key={key}
                            onClick={() => setChatInput(t(`suggestions.${key}`, 'assistant'))}
                            className="text-[11px] font-medium px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 rounded-full transition-all whitespace-nowrap shadow-sm animate-in fade-in slide-in-from-bottom-1"
                        >
                            {t(`suggestions.${key}`, 'assistant')}
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
                    <button onClick={onSend} disabled={!chatInput.trim()} className={`shadcn-btn w-10 px-0 h-[44px] shrink-0 ${mode === 'explain' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'shadcn-btn-primary'}`}>
                        {mode === 'explain' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        ) : 'Send'}
                    </button>
                )}
            </div>
        </div>
    );
};
