import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage } from '../../../types';
import { MarkdownRenderer } from '../../../components/ui/MarkdownRenderer';
import { EnvVarRequestMessage } from './EnvVarRequestMessage';

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

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [props.history, props.isProcessing, props.currentReasoning, props.currentText]);

  // Auto-resize textarea
  useEffect(() => {
    if (textAreaRef.current) {
        textAreaRef.current.style.height = 'auto';
        textAreaRef.current.style.height = Math.min(textAreaRef.current.scrollHeight, 120) + 'px';
    }
  }, [props.chatInput]);

  // Open reasoning by default when new reasoning arrives
  useEffect(() => {
      if(props.isProcessing && props.currentReasoning) setShowReasoning(true);
  }, [props.isProcessing, props.currentReasoning]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Allow Enter to make new lines (default behavior).
      // Send only on Ctrl+Enter or Cmd+Enter
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          if (!props.isProcessing && props.chatInput.trim()) props.onSend();
      }
  };

  return (
    <>
    {/* Mobile Overlay Backdrop */}
    <div 
        className={`fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity duration-300 ${props.isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        onClick={() => props.setCollapsed(true)}
    />
    
    {/* Mobile Toggle Button (Open - Fixed to screen edge when collapsed) - MOVED OUTSIDE SIDEBAR DIV */}
    <button 
        onClick={() => props.setCollapsed(false)} 
        className={`fixed left-0 top-20 w-8 h-10 bg-indigo-600 rounded-r-lg flex items-center justify-center shadow-md text-white cursor-pointer md:hidden z-[60] transition-transform duration-300 ${props.isCollapsed ? 'translate-x-0' : '-translate-x-full'}`}
    >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
    </button>

    <div 
        className={`
            fixed top-16 bottom-0 left-0 md:relative md:top-auto md:bottom-auto z-30 flex flex-col border-r bg-slate-50 transition-transform duration-300 shadow-xl md:shadow-none h-[calc(100vh-64px)] md:h-full w-[85vw] md:w-96
            ${props.isCollapsed ? '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden' : 'translate-x-0'}
        `}
    >
        {/* Mobile Toggle Button (Close) */}
        <button 
            onClick={() => props.setCollapsed(!props.isCollapsed)} 
            className={`absolute -right-10 top-4 w-10 h-10 bg-white border border-l-0 border-slate-200 rounded-r-lg flex items-center justify-center shadow-md text-slate-500 hover:text-indigo-600 cursor-pointer md:hidden transition-opacity ${props.isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        {/* Desktop Toggle Button */}
        <button 
            onClick={() => props.setCollapsed(!props.isCollapsed)} 
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-white border border-slate-200 rounded-r-lg hidden md:flex items-center justify-center z-30 shadow-sm text-slate-400 hover:text-indigo-600 cursor-pointer hover:w-8 transition-all"
        >
            {props.isCollapsed ? '>' : '<'}
        </button>

        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {props.history.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group flex-col`}>
                        <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                            <div className={`max-w-[95%] p-3 rounded-xl text-xs sm:text-sm shadow-sm relative ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-700 w-full'}`}>
                                {msg.role === 'model' && msg.snapshot && (
                                    <button onClick={() => props.onRollback(msg.snapshot)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-indigo-600" title="Restore version">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                                    </button>
                                )}
                                
                                {/* Reasoning Display (Collapsible) */}
                                {msg.reasoning && msg.role === 'model' && (
                                    <div className="mb-3 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                                        <div 
                                            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50/50 cursor-pointer flex justify-between items-center hover:bg-indigo-50"
                                            onClick={(e) => {
                                                const content = e.currentTarget.nextElementSibling;
                                                if(content) content.classList.toggle('hidden');
                                            }}
                                        >
                                            <span>AI Reasoning</span>
                                            <span className="text-indigo-400 text-[9px]">▼</span>
                                        </div>
                                        <div className="hidden p-3 border-t border-slate-100 text-[11px] text-slate-600 font-medium whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar">
                                            {msg.reasoning}
                                        </div>
                                    </div>
                                )}

                                {/* Token Usage Stats */}
                                {msg.usage && (
                                    <div className={`absolute -bottom-5 ${msg.role==='user'?'right-0':'left-0'} text-[9px] text-slate-400 font-mono flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity`}>
                                        <span>In: {msg.usage.inputTokens}</span>
                                        <span>Out: {msg.usage.outputTokens}</span>
                                    </div>
                                )}

                                {msg.text && <div className="prose prose-sm max-w-none text-slate-700"><MarkdownRenderer content={msg.text} /></div>}
                                
                                {/* Modified Files Summary */}
                                {msg.modifiedFiles && msg.modifiedFiles.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                                        <div className="text-[10px] font-bold uppercase text-slate-400 mb-2">Affected Files</div>
                                        {msg.modifiedFiles.map(f => (
                                             <div key={f} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                                 <span className="text-emerald-500 font-bold">✓</span>
                                                 <span className="font-mono truncate">{f}</span>
                                             </div>
                                        ))}
                                    </div>
                                )}

                                {msg.requiredEnvVars && <EnvVarRequestMessage requests={msg.requiredEnvVars} saved={msg.envVarsSaved || false} onSave={props.onEnvVarSave} />}
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* LIVE THINKING CARD */}
                {props.isProcessing && (
                    <div className="flex justify-start w-full">
                        <div className="bg-white border border-indigo-100 p-4 rounded-xl w-full shadow-lg shadow-indigo-500/5 animate-in slide-in-from-bottom-2">
                             <div className="flex items-center justify-between mb-3 pb-2 border-b border-indigo-50">
                                 <div className="flex items-center gap-2">
                                     <div className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                                     </div>
                                     <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Building...</span>
                                 </div>
                                 <span className="text-[10px] font-mono text-slate-400">{props.thinkTime.toFixed(1)}s</span>
                             </div>
                             
                             {/* Live Streaming Reasoning */}
                             {props.currentReasoning && (
                                 <div className="mb-3">
                                    <div 
                                        className="flex items-center gap-2 cursor-pointer select-none"
                                        onClick={() => setShowReasoning(!showReasoning)}
                                    >
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Live Reasoning</span>
                                        <span className={`text-[10px] transition-transform ${showReasoning ? 'rotate-180' : ''}`}>▼</span>
                                    </div>
                                    {showReasoning && (
                                        <div className="mt-2 text-xs text-slate-600 font-medium whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar bg-slate-50 p-2 rounded border border-slate-100">
                                            {props.currentReasoning}
                                            <span className="inline-block w-1.5 h-3 ml-1 bg-indigo-500 animate-pulse align-middle"></span>
                                        </div>
                                    )}
                                 </div>
                             )}
                             
                             {/* Live Streaming Text Summary */}
                             {props.currentText && (
                                 <div className="mb-3 prose prose-sm max-w-none text-slate-700 text-xs">
                                     <MarkdownRenderer content={props.currentText} />
                                 </div>
                             )}

                             {/* File Status List */}
                             <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                 <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">File Operations</div>
                                 {Object.keys(props.fileStatuses).length === 0 && <div className="text-xs text-slate-400 italic">Waiting for file generation...</div>}
                                 {Object.entries(props.fileStatuses).map(([file, status]) => (
                                     <div key={file} className="flex items-center gap-2 text-xs bg-slate-50 p-1.5 rounded border border-slate-100">
                                         {status === 'pending' && <span className="animate-spin text-indigo-500 font-bold">⟳</span>}
                                         {status === 'success' && <span className="text-emerald-500 font-bold">✓</span>}
                                         {status === 'error' && <span className="text-red-500 font-bold">✗</span>}
                                         <span className={`font-mono truncate ${status === 'pending' ? 'text-slate-500 italic' : status === 'success' ? 'text-slate-700 font-semibold' : 'text-red-600'}`}>{file}</span>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    </div>
                )}
            </div>

            {/* INPUT AREA */}
            <div className="p-3 bg-white border-t space-y-2">
                <div className="flex gap-2 items-end">
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={props.isProcessing} 
                        className="shadcn-btn shadcn-btn-outline w-10 px-0 h-[44px] shrink-0"
                        title="Attach File"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {}} multiple />
                    
                    <button 
                        onClick={props.toggleListening}
                        className={`shadcn-btn w-10 px-0 h-[44px] shrink-0 transition-colors ${props.isListening ? 'bg-red-500 text-white animate-pulse border-red-600 hover:bg-red-600' : 'shadcn-btn-outline'}`}
                        title="Voice Input"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                    </button>

                    <textarea
                        ref={textAreaRef}
                        value={props.chatInput}
                        onChange={e => props.setChatInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={props.isProcessing ? "AI is working..." : "Type instructions... (Ctrl+Enter to send)"}
                        disabled={props.isProcessing}
                        className="shadcn-input flex-1 min-h-[44px] max-h-[150px] py-2.5 resize-none overflow-y-auto"
                        rows={1}
                        style={{ height: '44px' }}
                    />
                    
                    {props.isProcessing ? (
                        <button onClick={props.onStop} className="shadcn-btn bg-red-500 hover:bg-red-600 text-white w-10 px-0 h-[44px] shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12"></rect></svg></button>
                    ) : (
                        <button onClick={props.onSend} disabled={!props.chatInput.trim()} className="shadcn-btn shadcn-btn-primary w-10 px-0 h-[44px] shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></button>
                    )}
                </div>
            </div>
        </div>
    </div>
    </>
  );
};