
import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../../../types';
import { MarkdownRenderer } from '../../../components/ui/MarkdownRenderer';

interface ChatListProps { messages: ChatMessage[]; loading: boolean; onRollback: (id: string) => void; }

export const ChatList: React.FC<ChatListProps> = ({ messages, loading, onRollback }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if(ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 pt-12" ref={ref}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group relative`}>
            {msg.role === 'model' && (
                <button onClick={() => onRollback(msg.id)} className="absolute -left-8 top-2 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100">↺</button>
            )}
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-orange-500 text-white' : 'bg-white text-slate-700 border'}`}>
              <MarkdownRenderer content={msg.text} />
            </div>
          </div>
        ))}
        {loading && <div className="text-slate-400 text-sm animate-pulse px-4">AI is typing...</div>}
    </div>
  );
};
