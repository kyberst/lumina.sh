
import React, { useState, useEffect } from 'react';
import { ChatMessage, JournalEntry, AppSettings } from '../../types';
import { chatWithDyad } from '../../services/geminiService';
import { dbFacade } from '../../services/dbFacade';
import { ChatList } from './components/ChatList';
import { getLanguage, t } from '../../services/i18n';

interface DyadChatProps { entries: JournalEntry[]; settings: AppSettings; }

export const DyadChat: React.FC<DyadChatProps> = ({ entries, settings }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { dbFacade.getChatHistory().then(setMessages); }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: input, timestamp: Date.now() };
    setMessages(p => [...p, userMsg]); setInput(''); setLoading(true); await dbFacade.saveChatMessage(userMsg);

    try {
        const txt = await chatWithDyad(messages, userMsg.text, entries, getLanguage());
        const modelMsg: ChatMessage = { id: crypto.randomUUID(), role: 'model', text: txt, timestamp: Date.now() };
        setMessages(p => [...p, modelMsg]); await dbFacade.saveChatMessage(modelMsg);
    } catch (e: any) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative">
      <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      <ChatList messages={messages} loading={loading} onRollback={() => {}} />
      <div className="p-4 bg-black/20 border-t border-white/10 flex items-center gap-3 backdrop-blur-sm">
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key==='Enter' && handleSend()} 
            className="flex-1 bg-slate-800 text-slate-200 placeholder:text-slate-500 rounded-full px-5 py-3 border border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" 
            placeholder={t('dyadPlaceholder', 'assistant')} 
            disabled={loading}
          />
          <button 
            onClick={handleSend} 
            disabled={loading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-full h-12 w-12 flex-shrink-0 flex items-center justify-center transition-colors shadow-lg"
            aria-label={t('send', 'common')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
      </div>
    </div>
  );
};
