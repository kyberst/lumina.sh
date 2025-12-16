
import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../../../types';
import { MarkdownRenderer } from '../../../components/ui/MarkdownRenderer';
import { t } from '../../../services/i18n';

interface ChatListProps { messages: ChatMessage[]; loading: boolean; onRollback: (id: string) => void; }

export const ChatList: React.FC<ChatListProps> = ({ messages, loading, onRollback }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if(ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6" ref={ref}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group relative`}>
            {msg.role === 'model' && (
                <button onClick={() => onRollback(msg.id)} className="absolute -left-8 top-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-colors" title={t('restore', 'assistant')}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                </button>
            )}
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-md ${msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-slate-700/50 text-slate-200 border border-slate-600/50 backdrop-blur-sm'}`}>
              <MarkdownRenderer content={msg.text} />
            </div>
          </div>
        ))}
        {loading && <div className="text-slate-500 text-sm animate-pulse px-4">{t('typing', 'assistant')}</div>}
    </div>
  );
};
