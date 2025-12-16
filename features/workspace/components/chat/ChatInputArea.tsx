
import React, { useRef, useMemo, useState } from 'react';
import { t } from '../../../../services/i18n';
import { AppSettings, ChatMessage, GeneratedFile } from '../../../../types';
import { estimateTokens } from '../../../../services/ai/costEstimator';

interface Props {
    chatInput: string;
    setChatInput: (v: string) => void;
    isProcessing: boolean;
    isListening: boolean;
    toggleListening: () => void;
    onSend: (prompt?: string) => void;
    onStop: () => void;
    attachments: any[];
    setAttachments: React.Dispatch<React.SetStateAction<any[]>>;
    showSuggestions?: boolean;
    mode?: 'modify' | 'explain';
    onUndo: () => void;
    canUndo: boolean;
    settings: AppSettings;
    onSaveSettings: (s: AppSettings) => void;
    history: ChatMessage[];
    isOffline: boolean;
    currentFiles?: GeneratedFile[]; // Passed down to calculate total project context
}

/**
 * Área de Input del Chat.
 * Maneja textarea auto-expandible, botón de adjuntar y grabación de voz.
 */
export const ChatInputArea: React.FC<Props> = ({ 
    chatInput, setChatInput, isProcessing, isListening, toggleListening, onSend, onStop, attachments, setAttachments, showSuggestions, mode = 'modify', onUndo, canUndo, settings, onSaveSettings, history, isOffline, currentFiles = []
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [historyIndex, setHistoryIndex] = useState<number | null>(null);

    const userPrompts = useMemo(() => history.filter(m => m.role === 'user').map(m => m.text), [history]);

    // Context Usage Calculation (Approximate)
    const contextUsage = useMemo(() => {
        if (!settings.developerMode) return { used: 0, total: 0, percent: 0 };
        
        let totalChars = 0;
        currentFiles.forEach(f => totalChars += f.content.length);
        const usedTokens = estimateTokens(' ' .repeat(totalChars)); // Hack using estimateTokens logic
        
        // Define Limits based on settings
        let limit = 32000; // default
        if (settings.contextSize === 'economy') limit = 8000;
        if (settings.contextSize === 'plus') limit = 128000;
        if (settings.contextSize === 'high') limit = 500000;
        if (settings.contextSize === 'max') limit = 1000000; // Gemini 1M window

        const percent = Math.min(100, (usedTokens / limit) * 100);
        return { used: usedTokens, total: limit, percent };
    }, [currentFiles, settings.contextSize, settings.developerMode]);

    const suggestionItems = [
        { key: 'makeItGreen', action: () => onSend(t('suggestions.makeItGreen', 'assistant')) },
        { key: 'addEmailInput', action: () => onSend(t('suggestions.addEmailInput', 'assistant')) },
        ...(canUndo ? [{ key: 'undoLastChange', action: onUndo }] : [])
    ];
    
    const attentionOptions = [
      { value: 'economy', label: t('attentionFast', 'settings') },
      { value: 'default', label: t('attentionNormal', 'settings') },
      { value: 'max', label: t('attentionDeep', 'settings') }
    ];

    const handleSend = (prompt?: string) => {
        onSend(prompt);
        setHistoryIndex(null);
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            if (!isProcessing && !isOffline && chatInput.trim()) handleSend();
        }

        if (e.key === 'ArrowUp') {
            if (userPrompts.length === 0) return;
            // Only trigger if input is empty or we are already browsing
            if (chatInput === '' || historyIndex !== null) {
                e.preventDefault();
                const newIndex = historyIndex === null ? userPrompts.length - 1 : Math.max(0, historyIndex - 1);
                setHistoryIndex(newIndex);
                setChatInput(userPrompts[newIndex]);
            }
        }

        if (e.key === 'ArrowDown') {
            if (historyIndex !== null) {
                e.preventDefault();
                const newIndex = historyIndex + 1;
                if (newIndex >= userPrompts.length) {
                    setHistoryIndex(null);
                    setChatInput('');
                } else {
                    setHistoryIndex(newIndex);
                    setChatInput(userPrompts[newIndex]);
                }
            }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setChatInput(e.target.value);
        // Detach from history browsing on manual input
        setHistoryIndex(null);
    }

    const handleAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setAttachments([...attachments, { name: file.name, type: file.type, data: 'base64_placeholder' }]);
        }
    };

    let placeholderText = t('placeholderModify', 'builder');
    if (isOffline) {
        placeholderText = t('offlineTitle', 'workspace');
    } else if (history.some(m => m.isAwaitingInput)) {
        placeholderText = t('inputNeeded', 'workspace');
    } else if (mode === 'explain') {
        placeholderText = t('placeholderExplain', 'builder');
    } else if (settings.developerMode) {
        placeholderText = t('placeholderRefactor', 'builder');
    }

    return (
        <div className="p-3 bg-white border-t space-y-2 relative" data-tour="chat-input">
            
            {/* Total Context Bar (Programmer Mode) */}
            {settings.developerMode && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100">
                    <div 
                        className={`h-full transition-all duration-500 ${contextUsage.percent > 90 ? 'bg-red-500' : contextUsage.percent > 70 ? 'bg-amber-500' : 'bg-indigo-500'}`} 
                        style={{ width: `${contextUsage.percent}%` }}
                    />
                    {/* Tooltip showing precise numbers */}
                    <div className="absolute top-0 right-0 transform -translate-y-full bg-slate-800 text-white text-[9px] px-2 py-0.5 rounded-tl-md font-mono opacity-0 hover:opacity-100 transition-opacity pointer-events-auto cursor-help" title={t('contextUsageTooltip', 'workspace').replace('{used}', (Math.round(contextUsage.used/1000)).toString()).replace('{total}', (Math.round(contextUsage.total/1000)).toString())}>
                        {t('contextUsageTooltip', 'workspace').replace('{used}', (Math.round(contextUsage.used/1000)).toString()).replace('{total}', (Math.round(contextUsage.total/1000)).toString())}
                    </div>
                </div>
            )}

            {showSuggestions && !isProcessing && !chatInput && !isOffline && mode === 'modify' && !settings.developerMode && (
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
                    {suggestionItems.map(({ key, action }) => (
                        <button
                            key={key}
                            onClick={() => key === 'undoLastChange' ? action() : handleSend(t(`suggestions.${key}`, 'assistant'))}
                            className="text-[11px] font-medium px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 rounded-full transition-all whitespace-nowrap shadow-sm animate-in fade-in slide-in-from-bottom-1"
                        >
                            {t(`suggestions.${key}`, 'assistant')}
                        </button>
                    ))}
                </div>
            )}
            
            {settings.developerMode && mode === 'modify' && (
                <div className="flex items-center gap-3 px-1 pb-2 border-b border-slate-100 mb-2 mt-2">
                    <label className="text-[10px] font-bold uppercase text-slate-500 whitespace-nowrap">{t('contextSize', 'settings')}:</label>
                    <select 
                        value={settings.contextSize} 
                        onChange={e => onSaveSettings({...settings, contextSize: e.target.value as any})}
                        className="shadcn-input h-7 text-xs rounded-md p-1 w-full bg-slate-50"
                        disabled={isProcessing || isOffline}
                    >
                        {attentionOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
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
                <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing || isOffline} className="shadcn-btn shadcn-btn-outline w-10 px-0 h-[44px] shrink-0" title={t('attachFile', 'workspace')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleAttach} />
                
                <button onClick={toggleListening} disabled={isProcessing || isOffline} className={`shadcn-btn w-10 px-0 h-[44px] shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'shadcn-btn-outline'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path></svg>
                </button>

                <textarea 
                    value={chatInput} 
                    onChange={handleInputChange} 
                    onKeyDown={handleKeyDown} 
                    placeholder={isProcessing ? t('aiWorking', 'assistant') : placeholderText} 
                    disabled={isProcessing || isOffline || history.some(m => m.isAwaitingInput)} 
                    className="shadcn-input flex-1 min-h-[44px] max-h-[150px] py-2.5 resize-none overflow-y-auto" 
                    rows={1} 
                    style={{ height: '44px' }} 
                />
                
                {isProcessing ? (
                    <button onClick={onStop} className="shadcn-btn bg-red-500 text-white w-10 px-0 h-[44px] shrink-0">{t('voiceStop', 'builder')}</button>
                ) : (
                    <button onClick={() => handleSend()} disabled={!chatInput.trim() || isOffline || history.some(m => m.isAwaitingInput)} className={`shadcn-btn w-10 px-0 h-[44px] shrink-0 ${mode === 'explain' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'shadcn-btn-primary'}`}>
                        {mode === 'explain' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        ) : t('send', 'common')}
                    </button>
                )}
            </div>
        </div>
    );
};
