
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { JournalEntry, GeneratedFile, ChatMessage, AppSettings } from '../../types';
import { analyzeSecurity } from '../../services/geminiService';
import { publishToGitHub } from '../../services/githubService';
import { sqliteService } from '../../services/sqliteService';
import { toast } from '../../services/toastService';
import { dialogService } from '../../services/dialogService';
import { MarkdownRenderer } from '../../components/ui/MarkdownRenderer';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { generateIframeHtml } from './utils/iframeBuilder';
import { useRefactorStream } from './hooks/useRefactorStream';
import { CodeEditorApi } from '../../components/ui/CodeEditor';

import { WorkspaceHeader } from './components/WorkspaceHeader';
import { WorkspaceChat } from './components/WorkspaceChat';
import { WorkspacePreview } from './components/WorkspacePreview';
import { WorkspaceCode } from './components/WorkspaceCode';
import { WorkspaceInfo } from './components/WorkspaceInfo';

interface WorkspaceViewProps {
  entry: JournalEntry;
  onUpdate: (updatedEntry: JournalEntry) => void;
  onClose: () => void;
  settings: AppSettings;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({ entry, onUpdate, onClose, settings }) => {
  // --- UI State ---
  const [rightTab, setRightTab] = useState<'preview' | 'code' | 'info'>('preview');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [iframeKey, setIframeKey] = useState(0); 
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  
  // --- Editor API Ref for Context Injection ---
  const editorApiRef = useRef<CodeEditorApi | null>(null);

  // --- Console & Debug State ---
  const [showConsole, setShowConsole] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<any[]>([]);
  const [errorCount, setErrorCount] = useState(0);
  const sourceMapRef = useRef<Record<string, { start: number, end: number, file: string }>>({});

  // --- Chat & History ---
  const [chatInput, setChatInput] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [chatAttachments, setChatAttachments] = useState<any[]>([]);
  const [totalUsage, setTotalUsage] = useState({ input: 0, output: 0 });
  const [scrollToLine, setScrollToLine] = useState<number | null>(null);
  const [thinkTime, setThinkTime] = useState(0);

  // --- Wrapper for onUpdate to handle Locking ---
  const handleUpdate = async (updatedEntry: JournalEntry) => {
      try {
          // This call might throw if the project is locked by an async task (like a Rollback)
          await onUpdate(updatedEntry);
          return true; // Success
      } catch (e: any) {
          if (e.code === 'PROJECT_LOCKED') {
              toast.info(e.message);
          } else {
              toast.error("Failed to save: " + e.message);
          }
          return false; // Failed
      }
  };

  // --- Logic Hooks ---
  const { isListening, toggleListening, transcript, resetTranscript } = useVoiceInput();
  const { isProcessing, streamState, handleStreamingBuild, cancelStream } = useRefactorStream({
      entry, settings, history, setHistory, onUpdate: handleUpdate, setTotalUsage, setIframeKey
  });

  // --- Helper to get Editor Context ---
  const getEditorContext = () => {
    if (!selectedFile || !editorApiRef.current) return undefined;
    try {
        const selection = editorApiRef.current.getSelection();
        const pos = editorApiRef.current.getPosition();
        return {
            activeFile: selectedFile.name,
            cursorLine: pos.lineNumber,
            selectedCode: selection || undefined
        };
    } catch(e) { return undefined; }
  };

  // --- Side Effects ---
  useEffect(() => { if(transcript) { setChatInput(p => p + (p ? ' ' : '') + transcript); resetTranscript(); } }, [transcript]);
  useEffect(() => { let i: any; if(isProcessing) { setThinkTime(0); i = setInterval(() => setThinkTime(t => t+0.1), 100); } return () => clearInterval(i); }, [isProcessing]);

  // Initial Load
  useEffect(() => {
    sqliteService.getRefactorHistory(entry.id).then(msgs => {
        setHistory(msgs);
        if(entry.pendingGeneration && msgs.length === 0) handleStreamingBuild(); // Auto-start
    });
    if(!selectedFile && entry.files.length > 0) {
        const f = entry.files.find(x => x.name === 'index.html') || entry.files[0];
        setSelectedFile(f); setEditorContent(f.content);
    }
  }, [entry.id]);

  // Handle PostMessage (Console Logs)
  useEffect(() => {
    const h = (e: MessageEvent) => {
        if(e.data?.type === 'CONSOLE_LOG') {
            const rawLine = e.data.line || 0;
            let mappedSource: any = undefined;
            
            // Map the line number from the iframe (rawLine) to the source file using sourceMap
            if (rawLine > 0) {
                 for (const [key, range] of Object.entries(sourceMapRef.current)) {
                     if (rawLine >= range.start && rawLine <= range.end) {
                         mappedSource = { file: range.file, line: rawLine - range.start + 1 };
                         break;
                     }
                 }
            }
            
            setConsoleLogs(p => [...p, { 
                type: e.data.level, 
                msg: e.data.message, 
                time: new Date().toLocaleTimeString(), 
                source: mappedSource 
            }]);
            
            if(e.data.level === 'error') setErrorCount(c => c+1);
        }
    };
    window.addEventListener('message', h);
    return () => window.removeEventListener('message', h);
  }, []);

  // Compute Preview HTML
  const iframeSrc = useMemo(() => {
      const { html, sourceMap } = generateIframeHtml(entry.files, entry.dependencies);
      sourceMapRef.current = sourceMap;
      return html;
  }, [entry.files, entry.dependencies, iframeKey]);

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in fade-in duration-300">
      <WorkspaceHeader 
        entry={entry} rightTab={rightTab} setRightTab={setRightTab} onClose={onClose} 
        onSecurityScan={async () => { 
             // Exclusive Task: Locks the project during scan
             try {
                const r = await sqliteService.runExclusiveProjectTask(entry.id, "Security Scan", async () => {
                     return await analyzeSecurity(entry.files, "Check");
                });
                dialogService.alert("Report", <MarkdownRenderer content={r}/>); 
             } catch(e: any) {
                toast.error(e.message);
             }
        }}
        onPublish={() => publishToGitHub(entry, 'app', settings.githubToken!, false).then(u => window.open(u))}
        onDownload={() => { toast.success("Downloading...") }} 
        onRefresh={() => { setIframeKey(k => k+1); setConsoleLogs([]); setErrorCount(0); }}
        totalUsage={totalUsage}
      />
      <div className="flex-1 flex overflow-hidden relative">
          <WorkspaceChat 
            history={history} chatInput={chatInput} setChatInput={setChatInput} 
            isProcessing={isProcessing} thinkTime={thinkTime} 
            fileStatuses={streamState.fileStatuses} 
            currentReasoning={streamState.reasoningBuffer + (streamState.mode === 'REASONING' ? streamState.buffer : '')}
            currentText={streamState.textBuffer + (streamState.mode === 'SUMMARY' ? streamState.buffer : '')}
            onSend={() => { 
                handleStreamingBuild(chatInput, chatAttachments, getEditorContext()); 
                setChatInput(''); 
                setChatAttachments([]); 
            }} 
            onStop={cancelStream} 
            onRollback={async (filesSnapshot) => { 
                // Exclusive Task: Rollback involves writing to DB
                try {
                    await sqliteService.runExclusiveProjectTask(entry.id, "Restoring Snapshot...", async () => {
                        await handleUpdate({...entry, files: filesSnapshot});
                    });
                    setIframeKey(k => k+1);
                } catch(e: any) {
                    toast.error(e.message);
                }
            }} 
            onEnvVarSave={(v) => handleUpdate({...entry, envVars: {...entry.envVars, ...v}})}
            isListening={isListening} toggleListening={toggleListening} 
            attachments={chatAttachments} setAttachments={setChatAttachments} 
            isCollapsed={isSidebarCollapsed} setCollapsed={setIsSidebarCollapsed}
          />
          <div className={`flex-1 flex flex-col bg-slate-100 overflow-hidden relative ${isSidebarCollapsed ? 'w-full' : 'hidden md:flex'}`}>
              {rightTab === 'info' && <WorkspaceInfo entry={entry} onUpdate={handleUpdate} />}
              {rightTab === 'preview' && (
                  <WorkspacePreview 
                      iframeSrc={iframeSrc} iframeKey={iframeKey} 
                      deviceMode={deviceMode} setDeviceMode={setDeviceMode} 
                      showConsole={showConsole} setShowConsole={setShowConsole} 
                      consoleLogs={consoleLogs} errorCount={errorCount} 
                      onClearLogs={() => setConsoleLogs([])} 
                      onNavigateError={(f, l) => { setRightTab('code'); setSelectedFile(entry.files.find(x => x.name === f) || null); setScrollToLine(l); }}
                  />
              )}
              {rightTab === 'code' && (
                  <WorkspaceCode 
                      files={entry.files} selectedFile={selectedFile} 
                      editorContent={editorContent} hasChanges={hasChanges} 
                      onFileSelect={(f) => { setSelectedFile(f); setEditorContent(f.content); setScrollToLine(null); }} 
                      onCodeChange={(v) => { setEditorContent(v); setHasChanges(true); }} 
                      onSave={async () => { 
                          if(selectedFile) { 
                              const success = await handleUpdate({...entry, files: entry.files.map(x => x.name === selectedFile.name ? {...x, content: editorContent} : x)}); 
                              if (success) {
                                  setHasChanges(false); 
                                  setIframeKey(k=>k+1); 
                              }
                          } 
                      }}
                      scrollToLine={scrollToLine}
                      onEditorMount={(api) => editorApiRef.current = api}
                      annotations={streamState.annotations}
                  />
              )}
          </div>
      </div>
    </div>
  );
};
