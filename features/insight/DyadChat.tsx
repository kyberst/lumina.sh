import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, JournalEntry, AppModule, AppSettings, AIProvider } from '../../types';
import { chatWithDyad } from '../../services/geminiService';
import { t, getLanguage } from '../../services/i18n';
import { logger } from '../../services/logger';
import { MarkdownRenderer } from '../../components/ui/MarkdownRenderer';
import { sqliteService } from '../../services/sqliteService';
import { useVoiceInput } from '../../hooks/useVoiceInput';

interface DyadChatProps {
  entries: JournalEntry[];
  settings: AppSettings;
}

export const DyadChat: React.FC<DyadChatProps> = ({ entries, settings }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatAttachments, setChatAttachments] = useState<{ name: string; type: string; data: string }[]>([]);
  
  // LLM Selection State
  const [activeProvider, setActiveProvider] = useState<string>(settings.activeProviderId || 'gemini');
  const [activeModel, setActiveModel] = useState<string>(settings.activeModelId || 'gemini-2.5-flash');
  
  // Update local state if global settings change
  useEffect(() => {
    if (settings.activeProviderId) setActiveProvider(settings.activeProviderId);
    if (settings.activeModelId) setActiveModel(settings.activeModelId);
  }, [settings.activeProviderId, settings.activeModelId]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentRef = useRef<HTMLInputElement>(null);

  const { isListening, toggleListening, transcript, resetTranscript } = useVoiceInput();

  useEffect(() => {
    if (transcript) {
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        resetTranscript();
    }
  }, [transcript, resetTranscript]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await sqliteService.getChatHistory();
        setMessages(history);
      } catch (e) {
        logger.error(AppModule.INSIGHT, "Failed to load chat history", e);
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if ((!input.trim() && chatAttachments.length === 0) || loading) return;
    
    try {
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        text: input,
        timestamp: Date.now(),
        attachments: chatAttachments
      };
      
      setMessages(prev => [...prev, userMsg]);
      await sqliteService.saveChatMessage(userMsg); 
      
      setInput('');
      setChatAttachments([]);
      setLoading(true);

      // Determine selected provider object from props
      const selectedProv = settings.customProviders.find(p => p.id === activeProvider);

      const responseText = await chatWithDyad(
          messages, 
          userMsg.text, 
          entries, 
          getLanguage(), 
          userMsg.attachments,
          { activeProvider: selectedProv, activeModelId: activeModel }
      );

      const modelMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, modelMsg]);
      await sqliteService.saveChatMessage(modelMsg); 
      
    } catch (err: any) {
      logger.error(AppModule.INSIGHT, "Chat error", err);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: `Error connecting: ${err.message}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (evt) => {
              if (evt.target?.result) {
                  setChatAttachments(prev => [...prev, {
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
      setChatAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleRollback = async (messageId: string) => {
      const index = messages.findIndex(m => m.id === messageId);
      if (index === -1) return;

      if(confirm(t('confirm') + " Rollback to this point?")) {
          const newHistory = messages.slice(0, index + 1);
          setMessages(newHistory);
      }
  };

  const exportChat = async () => {
    const json = await sqliteService.exportChatData(undefined); 
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dyad_assistant_chat_${Date.now()}.json`;
    a.click();
  };

  const importChat = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
        try {
            const json = ev.target?.result as string;
            await sqliteService.importChatData(json, undefined);
            const history = await sqliteService.getChatHistory();
            setMessages(history);
        } catch(err) {
            alert("Failed to import chat");
        }
    };
    reader.readAsText(file);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col h-[75vh] bg-[#ffffbb]/30 rounded-2xl border border-[#ffc93a]/30 overflow-hidden animate-in fade-in duration-500 relative shadow-2xl">
      {/* Toolbar */}
      <div className="absolute top-2 right-4 flex gap-2 z-10 items-center bg-white/80 p-1 rounded-lg border border-[#ffc93a]/20 shadow-xl backdrop-blur">
        
        {/* Model Selector */}
        <select 
            value={activeProvider} 
            onChange={e => { setActiveProvider(e.target.value); setActiveModel(''); }}
            className="bg-transparent text-[10px] text-slate-500 border-none outline-none cursor-pointer hover:text-[#ff7e15] max-w-[100px] font-bold"
        >
            <option value="gemini">Google Gemini</option>
            {settings.customProviders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <span className="text-slate-300">/</span>
        <select 
            value={activeModel} 
            onChange={e => setActiveModel(e.target.value)}
            className="bg-transparent text-[10px] text-[#ff7e15] font-bold border-none outline-none cursor-pointer hover:text-[#ff2935] w-24 truncate"
        >
            {activeProvider === 'gemini' ? (
                <>
                    <option value="gemini-2.5-flash">Flash 2.5</option>
                    <option value="gemini-3-pro-preview">Pro 3 Preview</option>
                </>
            ) : (
                settings.customProviders.find(p => p.id === activeProvider)?.models.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                ))
            )}
        </select>

        <div className="w-px h-3 bg-[#ffc93a]/30 mx-1"></div>

        <button onClick={exportChat} className="text-[10px] text-slate-400 hover:text-[#ff7e15] px-2">
          {t('export')}
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="text-[10px] text-slate-400 hover:text-[#ff7e15] px-2">
          {t('import')}
        </button>
        <input type="file" ref={fileInputRef} className="hidden" onChange={importChat} accept=".json" />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 pt-12" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
            <div className="w-16 h-16 bg-[#ffff7e] rounded-full flex items-center justify-center mb-4 text-[#ff7e15]">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            </div>
            <p className="text-slate-500 text-sm max-w-xs">{t('noMessages', 'insight')}</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group relative`}>
            {msg.role === 'model' && (
                <button 
                  onClick={() => handleRollback(msg.id)} 
                  className="absolute -left-8 top-2 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Rollback conversation to here"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                </button>
            )}
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-gradient-to-br from-[#ff7e15] to-[#ffc93a] text-white rounded-br-none shadow-[#ff7e15]/20' 
                : 'bg-white text-slate-700 border border-[#ffc93a]/30 rounded-bl-none'
            }`}>
              <MarkdownRenderer content={msg.text} />
              {msg.attachments && msg.attachments.length > 0 && (
                   <div className="mt-2 flex gap-2 flex-wrap">
                       {msg.attachments.map((att, i) => (
                           <div key={i} className="text-[10px] bg-white/20 px-2 py-1 rounded border border-white/10 flex items-center gap-1 text-white/90">
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                <span className="truncate max-w-[100px]">{att.name}</span>
                           </div>
                       ))}
                   </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
           <div className="flex justify-start">
             <div className="bg-white/80 px-4 py-3 rounded-2xl rounded-bl-none flex gap-1.5 items-center border border-[#ffc93a]/20">
                <div className="w-2 h-2 bg-[#ff2935] rounded-full animate-bounce" style={{ animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-[#ff7e15] rounded-full animate-bounce" style={{ animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-[#ffc93a] rounded-full animate-bounce" style={{ animationDelay: '300ms'}}></div>
             </div>
           </div>
        )}
      </div>
      
      {/* Input Area */}
      <div className="p-4 bg-[#ffffbb]/30 border-t border-[#ffc93a]/20">
        
        {/* Attachment Previews */}
        {chatAttachments.length > 0 && (
            <div className="flex gap-2 mb-2 overflow-x-auto pb-2 custom-scrollbar">
                {chatAttachments.map((att, idx) => (
                    <div key={idx} className="bg-white text-[10px] px-3 py-1.5 rounded-full flex items-center gap-2 border border-[#ffc93a]/30 shrink-0 text-[#ff7e15] animate-in zoom-in-50 duration-200">
                        <span className="truncate max-w-[100px]">{att.name}</span>
                        <button onClick={() => removeAttachment(idx)} className="hover:text-[#ff2935] font-bold">&times;</button>
                    </div>
                ))}
            </div>
        )}

        <div className="flex gap-2 relative">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={t('chatPlaceholder', 'insight')}
            className="flex-1 bg-white border border-[#ffc93a]/30 rounded-full px-5 py-3 text-slate-700 focus:border-[#ff7e15] focus:ring-1 focus:ring-[#ffff7e] outline-none placeholder:text-slate-400 text-sm shadow-sm"
            disabled={loading}
          />
          
          {/* File Attachment Button */}
          <button 
                onClick={() => attachmentRef.current?.click()}
                disabled={loading}
                className="w-11 h-11 rounded-full flex items-center justify-center transition-all bg-white text-slate-400 hover:bg-[#ffff7e] hover:text-[#ff7e15] border border-[#ffc93a]/20"
                title="Attach File"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
          </button>
          <input type="file" ref={attachmentRef} className="hidden" onChange={handleAttachment} multiple />

          {/* Voice Button */}
          <button 
                onClick={toggleListening}
                disabled={loading}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border border-[#ffc93a]/20 ${isListening ? 'bg-[#ff2935] text-white animate-pulse' : 'bg-white text-slate-400 hover:bg-[#ffff7e] hover:text-[#ff7e15]'}`}
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
          </button>

          <button 
            onClick={handleSend}
            disabled={loading || (!input.trim() && chatAttachments.length === 0)}
            className="w-11 h-11 bg-[#ff7e15] hover:bg-[#ff2935] text-white rounded-full flex items-center justify-center transition-all disabled:opacity-50 shadow-lg shadow-[#ff7e15]/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
    </div>
  );
};