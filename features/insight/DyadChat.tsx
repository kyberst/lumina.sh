
import React, { useState, useEffect } from 'react';
import { ChatMessage, JournalEntry, AppSettings } from '../../types';
import { chatWithDyad } from '../../services/geminiService';
import { sqliteService } from '../../services/sqliteService';
import { ChatList } from './components/ChatList';
import { getLanguage } from '../../services/i18n';

interface DyadChatProps { entries: JournalEntry[]; settings: AppSettings; }

export const DyadChat: React.FC<DyadChatProps> = ({ entries, settings }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { sqliteService.getChatHistory().then(setMessages); }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: input, timestamp: Date.now() };
    setMessages(p => [...p, userMsg]); setInput(''); setLoading(true); await sqliteService.saveChatMessage(userMsg);

    try {
        const txt = await chatWithDyad(messages, userMsg.text, entries, getLanguage());
        const modelMsg: ChatMessage = { id: crypto.randomUUID(), role: 'model', text: txt, timestamp: Date.now() };
        setMessages(p => [...p, modelMsg]); await sqliteService.saveChatMessage(modelMsg);
    } catch (e: any) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-[75vh] bg-yellow-50/30 rounded-2xl border border-yellow-400/30 overflow-hidden shadow-2xl relative">
      <ChatList messages={messages} loading={loading} onRollback={() => {}} />
      <div className="p-4 bg-yellow-100/30 border-t border-yellow-400/20 flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && handleSend()} className="flex-1 rounded-full px-4 py-2 border border-yellow-400/30" placeholder="Ask Architect..." />
          <button onClick={handleSend} className="bg-orange-500 text-white rounded-full px-4 py-2">Send</button>
      </div>
    </div>
  );
};
