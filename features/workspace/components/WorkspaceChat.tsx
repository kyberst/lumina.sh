import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage } from '../../../types';
import { MarkdownRenderer } from '../../../components/ui/MarkdownRenderer';
import { ChatMessageItem } from './ChatMessageItem';

interface WorkspaceChatProps {
  history: ChatMessage[];
  chatInput: string;
  setChatInput: (v: string) => void;
  isProcessing: boolean;
  thinkTime: number;
  fileStatuses: Record<string, 'pending' | 'success' | 'error'>;
  currentReasoning: string;
  currentText?: string;
  onSend: () => void;
  onStop: () => void;
  onRollback: (snap: any) => void;
  onEnvVarSave: (vals: Record<string, string>) => void;
  isListening: boolean;
  toggleListening: () => void;
  attachments: any[];
  setAttachments: React.Dispatch<React.SetStateAction<any[]>>;
  isCollapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export const WorkspaceChat: React.FC<WorkspaceChatProps> = (props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [showReasoning, setShowReasoning] = useState(true);

  // Auto-scroll
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [props.history, props.isProcessing, props.currentReasoning, props.currentText]);

  // Open reasoning if new data arrives
  useEffect(() => { if(props.isProcessing && props.currentReasoning) setShowReasoning(true); }, [props.isProcessing, props.currentReasoning]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          if (!props.isProcessing && props.chatInput.trim()) props.onSend();
      }
  };

  return (
    <>
    {/* Mobile Overlay */}
    <div className={`fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity duration-300 ${props.isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} onClick={() => props.setCollapsed(true)} />
    
    {/* Toggle Button Outside */}
    <button onClick={() => props.setCollapsed(false)} className={`fixed left-0 top-20 w-8 h-10 bg-indigo-600 rounded-r-lg flex items-center justify-center shadow-md text-white cursor-pointer md:hidden z-[60] transition-transform duration-300 ${props.isCollapsed ? 'translate-x-0' : '-translate-x-full'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
    </button>

    <div className={`fixed top-16 bottom-0 left-0 md:relative md:top-auto md:bottom-auto z-30 flex flex-col border-r bg-slate-50 transition-transform duration-300 shadow-xl md:shadow-none h-[calc(100vh-64px)] md:h-full w-[85vw] md:w-96 ${props.isCollapsed ? '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden' : 'translate-x-0'}`}>
        
        {/* Close Button Mobile */}
        <button onClick={() => props.setCollapsed(!props.isCollapsed)} className={`absolute -right-10 top-4 w-10 h-10 bg-white border-l-0 border rounded-r-lg flex items-center justify-center shadow-md text-slate-500 cursor-pointer md:hidden ${props.isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>X</button>

        {/* Desktop Toggle */}
        <button onClick={() => props.setCollapsed(!props.isCollapsed)} className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-white border border-slate-200 rounded-r-lg hidden md:flex items-center justify-center z-30 shadow-sm text-slate-400 hover:text-indigo-600 cursor-pointer hover:w-8 transition-all">{props.isCollapsed ? '>' : '<'}</button>

        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {props.history.map(msg => <ChatMessageItem key={msg.id} msg={msg} onRollback={props.onRollback} onEnvVarSave={props.onEnvVarSave} />)}
                
                {/* LIVE THINKING CARD */}
                {props.isProcessing && (
                    <div className="flex justify-start w-full">
                        <div className="bg-white border border-indigo-100 p-4 rounded-xl w-full shadow-lg shadow-indigo-500/5 animate-in slide-in-from-bottom-2">
                             <div className="flex items-center justify-between mb-3 pb-2 border-b border-indigo-50">
                                 <div className="flex items-center gap-2">
                                     <span className="animate-ping inline-flex h-3 w-3 rounded-full bg-indigo-400 opacity-75"></span>
                                     <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Building...</span>
                                 </div>
                                 <span className="text-[10px] font-mono text-slate-400">{props.thinkTime.toFixed(1)}s</span>
                             </div>
                             
                             {props.currentReasoning && (
                                 <div className="mb-3">
                                    <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setShowReasoning(!showReasoning)}>
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Live Reasoning</span>
                                        <span className={`text-[10px] transition-transform ${showReasoning ? 'rotate-180' : ''}`}>▼</span>
                                    </div>
                                    {showReasoning && (
                                        <div className="mt-2 text-xs text-slate-600 font-medium whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar bg-slate-50 p-2 rounded border border-slate-100">
                                            {props.currentReasoning}<span className="inline-block w-1.5 h-3 ml-1 bg-indigo-500 animate-pulse align-middle"></span>
                                        </div>
                                    )}
                                 </div>
                             )}
                             
                             {props.currentText && <div className="mb-3 prose prose-sm max-w-none text-slate-700 text-xs"><MarkdownRenderer content={props.currentText} /></div>}

                             <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                 {Object.entries(props.fileStatuses).map(([file, status]) => (
                                     <div key={file} className="flex items-center gap-2 text-xs bg-slate-50 p-1.5 rounded border border-slate-100">
                                         {status === 'pending' && <span className="animate-spin text-indigo-500 font-bold">⟳</span>}
                                         {status === 'success' && <span className="text-emerald-500 font-bold">✓</span>}
                                         {status === 'error' && <span className="text-red-500 font-bold">✗</span>}
                                         <span className={`font-mono truncate ${status==='success'?'text-slate-700 font-semibold':'text-slate-500'}`}>{file}</span>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-3 bg-white border-t space-y-2">
                <div className="flex gap-2 items-end">
                    <button onClick={() => fileInputRef.current?.click()} disabled={props.isProcessing} className="shadcn-btn shadcn-btn-outline w-10 px-0 h-[44px] shrink-0" title="Attach File"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg></button>
                    <input type="file" ref={fileInputRef} className="hidden" multiple />
                    
                    <button onClick={props.toggleListening} className={`shadcn-btn w-10 px-0 h-[44px] shrink-0 ${props.isListening ? 'bg-red-500 text-white animate-pulse' : 'shadcn-btn-outline'}`}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg></button>

                    <textarea ref={textAreaRef} value={props.chatInput} onChange={e => props.setChatInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={props.isProcessing ? "AI is working..." : "Type instructions... (Ctrl+Enter to send)"} disabled={props.isProcessing} className="shadcn-input flex-1 min-h-[44px] max-h-[150px] py-2.5 resize-none overflow-y-auto" rows={1} style={{ height: '44px' }} />
                    
                    {props.isProcessing ? (
                        <button onClick={props.onStop} className="shadcn-btn bg-red-500 text-white w-10 px-0 h-[44px] shrink-0">Stop</button>
                    ) : (
                        <button onClick={props.onSend} disabled={!props.chatInput.trim()} className="shadcn-btn shadcn-btn-primary w-10 px-0 h-[44px] shrink-0">Send</button>
                    )}
                </div>
            </div>
        </div>
    </div>
    </>
  );
};
