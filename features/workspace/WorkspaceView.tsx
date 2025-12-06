import React, { useState, useEffect, useRef, useMemo } from 'react';
import { JournalEntry, GeneratedFile, ChatMessage, AppModule, AppSettings } from '../../types';
import { streamChatRefactor, analyzeSecurity } from '../../services/geminiService';
import { publishToGitHub } from '../../services/githubService';
import { sqliteService } from '../../services/sqliteService';
import { logger } from '../../services/logger';
import { t, getLanguage } from '../../services/i18n';
import { MarkdownRenderer } from '../../components/ui/MarkdownRenderer';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { toast } from '../../services/toastService';
import { dialogService } from '../../services/dialogService';
import { WorkspaceHeader } from './components/WorkspaceHeader';
import { WorkspaceChat } from './components/WorkspaceChat';
import { WorkspacePreview } from './components/WorkspacePreview';
import { WorkspaceCode } from './components/WorkspaceCode';
import { WorkspaceInfo } from './components/WorkspaceInfo';
import JSZip from 'jszip';
import { createInitialStreamState, parseStreamChunk, finalizeStream, StreamState } from '../../services/ai/streamParser';

interface WorkspaceViewProps {
  entry: JournalEntry;
  onUpdate: (updatedEntry: JournalEntry) => void;
  onClose: () => void;
  settings: AppSettings;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({ entry, onUpdate, onClose, settings }) => {
  const [rightTab, setRightTab] = useState<'preview' | 'code' | 'info'>('preview');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [iframeKey, setIframeKey] = useState(0); 
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<{type: string, msg: string, time: string}[]>([]);
  const [errorCount, setErrorCount] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [thinkTime, setThinkTime] = useState(0); 
  const [chatAttachments, setChatAttachments] = useState<any[]>([]);
  const [totalUsage, setTotalUsage] = useState({ input: 0, output: 0 });
  
  // Streaming State
  const [streamState, setStreamState] = useState<StreamState>(createInitialStreamState(entry.files));

  const abortControllerRef = useRef<AbortController | null>(null);
  const { isListening, toggleListening, transcript, resetTranscript } = useVoiceInput();

  useEffect(() => {
    if(transcript) { setChatInput(p => p + (p ? ' ' : '') + transcript); resetTranscript(); }
  }, [transcript]);

  // Timer Logic
  useEffect(() => {
    let i: any;
    if(isProcessing) { 
        setThinkTime(0); 
        i = setInterval(() => setThinkTime(t => t+0.1), 100); 
    }
    return () => clearInterval(i);
  }, [isProcessing]);

  // Initial Load / Bootstrap
  useEffect(() => {
    sqliteService.getRefactorHistory(entry.id).then(msgs => {
        setHistory(msgs);
        
        // Calculate historical usage
        let totalIn = 0;
        let totalOut = 0;
        msgs.forEach(m => {
            if (m.usage) {
                totalIn += m.usage.inputTokens;
                totalOut += m.usage.outputTokens;
            }
        });
        setTotalUsage({ input: totalIn, output: totalOut });

        // If this is a new "pending" project (skeleton), trigger the build STREAM
        if(entry.pendingGeneration && !isProcessing && msgs.length === 0) {
            handleStreamingBuild();
        }
    });

    if(!selectedFile && entry.files.length > 0) {
        const f = entry.files.find(x => x.name === 'index.html') || entry.files[0];
        setSelectedFile(f); setEditorContent(f.content);
    }
    
    const h = (e: MessageEvent) => {
        if(e.data?.type === 'CONSOLE_LOG') {
            setConsoleLogs(p => [...p, {type: e.data.level, msg: e.data.message, time: new Date().toLocaleTimeString()}]);
            if(e.data.level === 'error') { setErrorCount(c => c+1); toast.error(`Error: ${e.data.message}`); }
        }
    };
    window.addEventListener('message', h);
    return () => window.removeEventListener('message', h);
  }, [entry.id]);

  const handleDownload = async () => {
    try {
        const zip = new JSZip();
        entry.files.forEach(f => zip.file(f.name, f.content));
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${entry.project || 'project'}.zip`;
        a.click();
        URL.revokeObjectURL(url);
    } catch(e) {
        toast.error("Download failed");
    }
  };

  // Triggered for both Initial Build and Refactors
  const handleStreamingBuild = async (userMessage?: string) => {
      const isInitial = !userMessage && entry.pendingGeneration;
      const promptText = userMessage || entry.prompt; // Use prompt for initial build
      
      const msg: ChatMessage = { 
          id: crypto.randomUUID(), 
          role: 'user', 
          text: promptText, 
          timestamp: Date.now(), 
          attachments: chatAttachments 
      };

      if (!isInitial) {
          setHistory(p => [...p, msg]);
          setChatInput('');
          setChatAttachments([]);
      }
      
      setIsProcessing(true);
      setStreamState(createInitialStreamState(entry.files)); // Reset Stream State
      
      abortControllerRef.current = new AbortController();
      let currentState = createInitialStreamState(entry.files); // Local ref for loop
      let finalUsage = { inputTokens: 0, outputTokens: 0 };

      try {
          const stream = streamChatRefactor(
              entry.files, 
              promptText, 
              isInitial ? [] : history, // No history for initial build to avoid confusion
              getLanguage(), 
              msg.attachments, 
              { thinkingBudget: settings.thinkingBudget }, 
              abortControllerRef.current.signal
          );

          for await (const chunk of stream) {
              // chunk is now { text: string, usage?: ... }
              if (chunk.usage) {
                  finalUsage = chunk.usage;
              }
              if (chunk.text) {
                currentState = parseStreamChunk(chunk.text, currentState);
                setStreamState({...currentState}); // Update UI
              }
          }
          
          // IMPORTANT: Flush any remaining buffer (files or text)
          currentState = finalizeStream(currentState);
          setStreamState({...currentState});

          // Done
          const finalFiles = currentState.workingFiles;
          const finalEntry = { 
              ...entry, 
              files: finalFiles, 
              pendingGeneration: false,
              tags: isInitial ? [...entry.tags, "Generated"] : entry.tags 
          };
          
          onUpdate(finalEntry);
          
          // Update Total Usage
          setTotalUsage(prev => ({
              input: prev.input + finalUsage.inputTokens,
              output: prev.output + finalUsage.outputTokens
          }));
          
          // Determine what to show as the final message text
          // If we have a summary in textBuffer, use it. Otherwise generic message.
          const finalMessageText = currentState.textBuffer.trim() || (isInitial ? "App generated successfully." : "Updates applied successfully.");
          
          const modelMsg: ChatMessage = { 
              id: crypto.randomUUID(), 
              role: 'model', 
              text: finalMessageText, 
              reasoning: currentState.reasoningBuffer,
              timestamp: Date.now(),
              modifiedFiles: Object.keys(currentState.fileStatuses),
              usage: finalUsage
          };

          await sqliteService.saveRefactorMessage(entry.id, modelMsg);
          if (!isInitial) {
              await sqliteService.saveRefactorMessage(entry.id, msg);
              setHistory(p => [...p, modelMsg]);
          } else {
               setHistory([modelMsg]);
          }

          setIframeKey(k => k+1);
          // Auto-select index.html if created
          if (isInitial) {
              const idx = finalFiles.find(f => f.name === 'index.html');
              if(idx) { setSelectedFile(idx); setEditorContent(idx.content); }
          }

      } catch (e: any) {
          toast.error(e.message);
      } finally {
          setIsProcessing(false);
      }
  };

  const iframeSrc = useMemo(() => {
     const f = entry.files.find(x => x.name === 'index.html'); if(!f) return '';
     let h = f.content;
     
     // Inject Import Map for React support in Browser
     const importMap = `
<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@18.2.0",
    "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
    "lucide-react": "https://esm.sh/lucide-react@0.263.1"
  }
}
</script>
<script src="https://cdn.tailwindcss.com"></script>
`;
     if (h.includes('<head>')) {
         h = h.replace('<head>', '<head>' + importMap);
     } else {
         h = importMap + h;
     }

     // Inject CSS/JS
     entry.files.filter(x => x.name.endsWith('.css')).forEach(c => h = h.replace('</head>', `<style>${c.content}</style></head>`));
     
     // Handle JS modules (ESM)
     entry.files.filter(x => x.name.endsWith('.js') || x.name.endsWith('.jsx')).forEach(j => {
         // If file is explicitly imported by another, don't auto-inject as script tag to avoid double execution
         // But for simple apps, usually we inject index.js
         if (j.name === 'index.js' || j.name === 'script.js' || j.name === 'main.js') {
            h = h.replace('</body>', `<script type="module">${j.content}</script></body>`);
         }
     });

     return h.replace('<head>', '<head><script>(function(){window.onerror=function(m){window.parent.postMessage({type:"CONSOLE_LOG",level:"error",message:m},"*")}})()</script>');
  }, [entry.files, iframeKey]);

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in fade-in duration-300">
      <WorkspaceHeader 
        entry={entry} rightTab={rightTab} setRightTab={setRightTab} onClose={onClose} 
        onSecurityScan={async () => { toast.info("Scanning..."); const r = await analyzeSecurity(entry.files, "Check security"); dialogService.alert("Report", <MarkdownRenderer content={r}/>); }}
        onPublish={() => publishToGitHub(entry, 'app', settings.githubToken!, false).then(u => window.open(u))}
        onDownload={handleDownload} 
        onRefresh={() => { setIframeKey(k => k+1); setConsoleLogs([]); setErrorCount(0); }}
        totalUsage={totalUsage}
      />
      <div className="flex-1 flex overflow-hidden relative">
          <WorkspaceChat 
            history={history} chatInput={chatInput} setChatInput={setChatInput} isProcessing={isProcessing} thinkTime={thinkTime} 
            fileStatuses={streamState.fileStatuses} 
            // Calculate current reasoning by combining completed buffer with active buffer if in REASONING mode
            currentReasoning={streamState.reasoningBuffer + (streamState.mode === 'REASONING' ? streamState.buffer : '')}
            // Pass the current summary/text buffer similarly
            currentText={streamState.textBuffer + (streamState.mode === 'SUMMARY' ? streamState.buffer : '')}
            onSend={() => handleStreamingBuild(chatInput)} onStop={() => abortControllerRef.current?.abort()} 
            onRollback={(s) => onUpdate({...entry, files: s})} onEnvVarSave={(v) => onUpdate({...entry, envVars: {...entry.envVars, ...v}})}
            isListening={isListening} toggleListening={toggleListening} attachments={chatAttachments} setAttachments={setChatAttachments} isCollapsed={isSidebarCollapsed} setCollapsed={setIsSidebarCollapsed}
          />
          <div className={`flex-1 flex flex-col bg-slate-100 overflow-hidden relative ${isSidebarCollapsed ? 'w-full' : 'hidden md:flex'}`}>
              {rightTab === 'info' && <WorkspaceInfo entry={entry} onUpdate={onUpdate} />}
              {rightTab === 'preview' && <WorkspacePreview iframeSrc={iframeSrc} iframeKey={iframeKey} deviceMode={deviceMode} setDeviceMode={setDeviceMode} showConsole={showConsole} setShowConsole={setShowConsole} consoleLogs={consoleLogs} errorCount={errorCount} onClearLogs={() => setConsoleLogs([])} />}
              {rightTab === 'code' && <WorkspaceCode files={entry.files} selectedFile={selectedFile} editorContent={editorContent} hasChanges={hasChanges} onFileSelect={(f) => { setSelectedFile(f); setEditorContent(f.content); }} onCodeChange={(v) => { setEditorContent(v); setHasChanges(true); }} onSave={() => { if(selectedFile) { onUpdate({...entry, files: entry.files.map(x => x.name === selectedFile.name ? {...x, content: editorContent} : x)}); setHasChanges(false); setIframeKey(k=>k+1); } }} />}
          </div>
      </div>
    </div>
  );
};