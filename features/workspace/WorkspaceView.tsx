import React, { useState, useEffect, useRef, useMemo } from 'react';
import { JournalEntry, GeneratedFile, ChatMessage, AppModule, AppSettings, GitHubRepo, EnvVarRequest, CommandLog } from '../../types';
import { streamChatRefactor, analyzeSecurity, generateAppCode } from '../../services/geminiService';
import { sqliteService } from '../../services/sqliteService';
import { publishToGitHub, getUserRepos } from '../../services/githubService';
import { logger } from '../../services/logger';
import { CodeEditor } from '../../components/ui/CodeEditor';
import { t, getLanguage } from '../../services/i18n';
import { MarkdownRenderer } from '../../components/ui/MarkdownRenderer';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { toast } from '../../services/toastService';
import { EnvVarRequestMessage } from './components/EnvVarRequestMessage';

interface WorkspaceViewProps {
  entry: JournalEntry;
  onUpdate: (updatedEntry: JournalEntry) => void;
  onClose: () => void;
  settings: AppSettings;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';
type ActiveTool = 'env' | 'github' | 'security' | 'history' | null;

interface ConsoleError {
    id: string;
    message: string;
    timestamp: number;
}

const BuildLogRenderer: React.FC<{ content: string }> = ({ content }) => {
    const clean = content.replace(/```build-logs|```/g, '').trim();
    const lines = clean.split('\n').filter(l => l.trim().length > 0);
    return (
        <details className="w-full my-2 group">
             <summary className="list-none cursor-pointer select-none [&::-webkit-details-marker]:hidden">
                 <div className="bg-[#ffffbb]/80 rounded-xl border border-[#ffc93a] p-2.5 font-mono text-[10px] sm:text-xs flex items-center gap-3 hover:bg-[#ffff7e] transition-colors shadow-sm">
                     <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ffc93a] group-hover:bg-[#ff7e15]"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ffc93a] group-hover:bg-[#ff7e15]"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ffc93a] group-hover:bg-[#ff7e15]"></div>
                     </div>
                     <span className="text-[#d96200] uppercase tracking-widest font-bold">Builder Terminal</span>
                     <span className="text-[#ffc93a] group-open:rotate-180 transition-transform ml-auto">▼</span>
                 </div>
             </summary>
             <div className="bg-[#2a1b1b] text-[#fffdf0] border border-[#ffc93a]/30 rounded-xl mt-2 p-4 font-mono text-[10px] sm:text-xs overflow-x-auto shadow-lg animate-in slide-in-from-top-2 relative">
                <div className="absolute top-0 right-0 p-2 opacity-20 pointer-events-none text-[#ffc93a]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
                </div>
                {lines.map((line, i) => (
                    <div key={i} className="flex gap-3 mb-1.5 relative z-10">
                        <span className={line.includes('✔') ? 'text-[#ffc93a]' : line.includes('✖') ? 'text-[#ff2935]' : 'text-slate-500'}>
                            {line.includes('✔') || line.includes('✖') ? line[0] : '>'}
                        </span>
                        <span className={line.includes('✔') ? 'text-white font-bold' : 'text-[#fffdf0]/90'}>{line.replace(/^[✔✖>]\s*/, '')}</span>
                    </div>
                ))}
             </div>
        </details>
    );
};

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({ entry, onUpdate, onClose, settings }) => {
  const [rightTab, setRightTab] = useState<'preview' | 'code' | 'info' | 'console'>('preview');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [iframeKey, setIframeKey] = useState(0); 
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [editorContent, setEditorContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const [chatInput, setChatInput] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [thinkTime, setThinkTime] = useState(0); 
  const [chatAttachments, setChatAttachments] = useState<{ name: string; type: string; data: string }[]>([]);
  
  const [activeProvider, setActiveProvider] = useState<string>(settings.activeProviderId || 'gemini');
  const [activeModel, setActiveModel] = useState<string>(settings.activeModelId || 'gemini-2.5-flash');

  const [consoleErrors, setConsoleErrors] = useState<ConsoleError[]>([]);
  
  // Publish State
  const [publishTab, setPublishTab] = useState<'create' | 'existing'>('create');
  const [repoName, setRepoName] = useState(entry.project?.replace(/\s+/g, '-') || 'my-app');
  const [isPrivate, setIsPrivate] = useState(false);
  const [userRepos, setUserRepos] = useState<GitHubRepo[]>([]);
  
  // Security State
  const [securityAnalysis, setSecurityAnalysis] = useState('');
  const [isAnalyzingSec, setIsAnalyzingSec] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { isListening, toggleListening, transcript, resetTranscript } = useVoiceInput();

  // --- INITIALIZATION LOGIC ---
  useEffect(() => {
    if (transcript) {
      setChatInput(prev => prev + (prev ? ' ' : '') + transcript);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      setThinkTime(0);
      interval = setInterval(() => setThinkTime(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  useEffect(() => {
      const handleMessage = (e: MessageEvent) => {
          if (e.data && e.data.type === 'CONSOLE_ERROR') {
              const newError = { id: crypto.randomUUID(), message: e.data.message, timestamp: Date.now() };
              setConsoleErrors(prev => [...prev, newError]);
              if (rightTab !== 'console') toast.error("Runtime Error Detected");
              if (settings.autoFix && !isProcessing) {
                  toast.show("Auto-Fixing Error...", 'info');
                  handleAutoFix(newError.message);
              }
          }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
  }, [settings.autoFix, isProcessing, rightTab]);

  const handleAutoFix = (errorMsg: string) => {
      setChatInput(`Fix this runtime error: ${errorMsg}`);
      setTimeout(() => handleSendMessage(true), 500);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const msgs = await sqliteService.getRefactorHistory(entry.id);
        if (entry.pendingGeneration && !isProcessing && msgs.length === 0) {
            handleInitialGeneration();
        } else {
            setHistory(msgs);
            scrollToBottom();
        }
      } catch (e) {
        logger.error(AppModule.BUILDER, 'Failed to load history', e);
      }
    };
    loadData();
    if (!selectedFile && entry.files.length > 0) {
        const indexHtml = entry.files.find(f => f.name === 'index.html') || entry.files[0];
        setSelectedFile(indexHtml);
        setEditorContent(indexHtml.content);
    }
  }, [entry.id]);

  useEffect(() => {
      if (activeTool === 'github' && settings.githubToken) {
          getUserRepos(settings.githubToken).then(setUserRepos);
      }
  }, [activeTool, settings.githubToken]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 100);
  };

  // --- LIVE GENERATION (COLD START) ---
  const handleInitialGeneration = async () => {
      setIsProcessing(true);
      const startTime = Date.now();
      
      const userMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'user',
          text: entry.prompt,
          timestamp: Date.now()
      };
      setHistory([userMsg]);
      
      try {
          const provId = entry.envVars?._INIT_PROVIDER || 'gemini';
          const modelId = entry.envVars?._INIT_MODEL || 'flash';
          const complexity = parseInt(entry.envVars?._INIT_COMPLEXITY || '50');
          
          setActiveProvider(provId);
          setActiveModel(modelId);
          
          const selectedProv = settings.customProviders.find(p => p.id === provId);
          const modelPref = modelId === 'pro' ? 'pro' : 'flash';
          
          const result = await generateAppCode(
              entry.prompt, 
              complexity, 
              getLanguage(), 
              modelPref, 
              entry.files.length > 0 ? undefined : undefined, 
              { activeProvider: selectedProv, activeModelId: modelId, thinkingBudget: settings.thinkingBudget }
          );
          
          const cleanEnv = { ...entry.envVars };
          delete cleanEnv._INIT_PROVIDER;
          delete cleanEnv._INIT_MODEL;
          delete cleanEnv._INIT_COMPLEXITY;
          
          const updatedEntry = { 
              ...entry, 
              files: result.files, 
              description: result.description,
              tags: result.tags,
              sentimentScore: result.complexityScore,
              requiredEnvVars: result.requiredEnvVars, 
              pendingGeneration: false, 
              envVars: cleanEnv,
              timestamp: Date.now()
          };
          
          onUpdate(updatedEntry);
          if(result.files.length > 0) {
              setSelectedFile(result.files[0]);
              setEditorContent(result.files[0].content);
          }
          
          const duration = ((Date.now() - startTime) / 1000).toFixed(1);
          const fakeLogs = `\`\`\`build-logs\n✔ Initializing build pipeline...\n✔ Parsing prompt requirements...\n✔ Generating application scaffold...\n✔ Compiling ${result.files.length} files...\n✔ Build successful.\n\`\`\``;
          
          const sysMsg: ChatMessage = {
              id: crypto.randomUUID(),
              role: 'model',
              text: result.description,
              reasoning: fakeLogs + `\n\n___META_DURATION_${duration}___`,
              modifiedFiles: result.files.map(f => f.name),
              snapshot: result.files, 
              requiredEnvVars: result.requiredEnvVars,
              timestamp: Date.now()
          };
          
          setHistory(prev => [...prev, sysMsg]);
          await sqliteService.saveRefactorMessage(entry.id, userMsg);
          await sqliteService.saveRefactorMessage(entry.id, sysMsg);
          
      } catch (err: any) {
          toast.error("Generation Failed: " + err.message);
          setHistory(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: `Error: ${err.message}`, timestamp: Date.now() }]);
      } finally {
          setIsProcessing(false);
          setIframeKey(k => k+1);
      }
  };
  
  const stopGeneration = () => {
      if(abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
          setIsProcessing(false);
          toast.info("Generation Stopped");
      }
  };

  // --- STREAMING CHAT (REFACTOR) ---
  const handleSendMessage = async (isAutoFix: boolean = false, autoText?: string) => {
    const textToSend = autoText || (isAutoFix ? chatInput || "Fix the reported error" : chatInput);
    if ((!textToSend.trim() && chatAttachments.length === 0) || (isProcessing && !isAutoFix && !autoText)) return;

    let currentFiles = entry.files;
    if (hasChanges && selectedFile) {
        currentFiles = entry.files.map(f => f.name === selectedFile.name ? { ...f, content: editorContent } : f);
        setHasChanges(false); 
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: textToSend,
      timestamp: Date.now(),
      attachments: chatAttachments
    };

    setHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setChatAttachments([]);
    setIsProcessing(true);
    if (isAutoFix) setConsoleErrors([]);
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    await sqliteService.saveRefactorMessage(entry.id, userMsg);
    
    const streamMsgId = crypto.randomUUID();
    setHistory(prev => [...prev, { id: streamMsgId, role: 'model', text: '', isStreaming: true, timestamp: Date.now(), modifiedFiles: [], commands: [] }]);
    
    const startTime = Date.now();
    let accumulatedText = '';
    let accumulatedReasoning = '';
    let isParsingReasoning = false;
    let isParsingCommentary = false;
    let isParsingFile = false;
    let currentFileName = '';
    let currentFileContent = '';
    let modifiedFiles: string[] = [];
    let updatedFilesList = [...currentFiles];
    let detectedEnvVars: EnvVarRequest[] = [];
    let detectedCommands: CommandLog[] = [];

    try {
        const selectedProv = settings.customProviders.find(p => p.id === activeProvider);
        const stream = streamChatRefactor(
            currentFiles,
            userMsg.text,
            history,
            getLanguage(),
            userMsg.attachments,
            { activeProvider: selectedProv, activeModelId: activeModel, thinkingBudget: settings.thinkingBudget },
            abortController.signal
        );

        for await (const chunk of stream) {
            const fullChunk = chunk;
            
            if (fullChunk.includes('### REASONING')) {
                isParsingReasoning = true;
                isParsingCommentary = false;
                isParsingFile = false;
                const parts = fullChunk.split('### REASONING');
                if (parts[1]) accumulatedReasoning += parts[1];
            } else if (fullChunk.includes('### COMMENTARY')) {
                isParsingReasoning = false;
                isParsingCommentary = true;
                isParsingFile = false;
                const parts = fullChunk.split('### COMMENTARY');
                if (parts[1]) accumulatedText += parts[1];
            } else if (fullChunk.includes('### CMD:')) {
                const parts = fullChunk.split('### CMD:');
                const cmdStr = parts[1]?.split('\n')[0]?.trim();
                if (cmdStr) {
                    const newCmd: CommandLog = {
                        id: crypto.randomUUID(),
                        command: cmdStr,
                        status: settings.autoApprove ? 'executed' : 'pending'
                    };
                    detectedCommands.push(newCmd);
                    setHistory(prev => prev.map(m => m.id === streamMsgId ? { ...m, commands: detectedCommands } : m));
                }
            } else if (fullChunk.includes('### FILE:')) {
                const parts = fullChunk.split('### FILE:');
                isParsingReasoning = false;
                isParsingCommentary = false;
                isParsingFile = true;
                
                const rest = parts[1].trim();
                const lineEnd = rest.indexOf('\n');
                if (lineEnd > -1) {
                    currentFileName = rest.substring(0, lineEnd).trim();
                    currentFileContent = rest.substring(lineEnd + 1);
                    setHistory(prev => prev.map(m => m.id === streamMsgId ? { ...m, pendingFile: currentFileName } : m));
                }
            } else if (fullChunk.includes('### END_FILE')) {
                const parts = fullChunk.split('### END_FILE');
                currentFileContent += parts[0];
                isParsingFile = false;
                
                const newFile: GeneratedFile = { 
                    name: currentFileName, 
                    content: currentFileContent, 
                    language: currentFileName.endsWith('.html') ? 'html' : 'javascript'
                };
                updatedFilesList = updatedFilesList.filter(f => f.name !== currentFileName).concat(newFile);
                modifiedFiles = [...new Set([...modifiedFiles, currentFileName])];
                
                setHistory(prev => prev.map(m => m.id === streamMsgId ? { ...m, pendingFile: undefined, modifiedFiles } : m));
                
                currentFileName = '';
                currentFileContent = '';
            } else if (fullChunk.includes('### ENV_REQ:')) {
                const parts = fullChunk.split('### ENV_REQ:');
                try {
                    const jsonPart = parts[1].trim();
                    const req = JSON.parse(jsonPart);
                    detectedEnvVars.push(req);
                } catch(e) {}
            } else {
                if (isParsingReasoning) accumulatedReasoning += fullChunk;
                else if (isParsingCommentary) accumulatedText += fullChunk;
                else if (isParsingFile) currentFileContent += fullChunk;
                else accumulatedReasoning += fullChunk; 
            }
            
            setHistory(prev => prev.map(m => m.id === streamMsgId ? { 
                ...m, 
                text: accumulatedText,
                reasoning: accumulatedReasoning,
                requiredEnvVars: detectedEnvVars.length > 0 ? detectedEnvVars : undefined
            } : m));
            scrollToBottom();
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        const finalMsg: ChatMessage = {
            id: streamMsgId,
            role: 'model',
            text: accumulatedText || '...', 
            reasoning: accumulatedReasoning + `\n\n___META_DURATION_${duration}___`,
            modifiedFiles: modifiedFiles,
            snapshot: updatedFilesList, 
            timestamp: Date.now(),
            requiredEnvVars: detectedEnvVars.length > 0 ? detectedEnvVars : undefined,
            commands: detectedCommands,
            pendingFile: undefined 
        };
        
        setHistory(prev => prev.map(m => m.id === streamMsgId ? { ...finalMsg, isStreaming: false } : m));
        await sqliteService.saveRefactorMessage(entry.id, finalMsg);
        onUpdate({ ...entry, files: updatedFilesList });
        
        if (selectedFile) {
             const updated = updatedFilesList.find(f => f.name === selectedFile.name);
             if (updated) setEditorContent(updated.content);
        }
        
        setIframeKey(k => k + 1);
        toast.success("Update Complete");

    } catch (e: any) {
        if(e.message === "Aborted by user") {
            setHistory(prev => prev.map(m => m.id === streamMsgId ? { ...m, text: m.text + "\n[STOPPED]", isStreaming: false } : m));
        } else {
            toast.error("Stream Failed: " + e.message);
            setHistory(prev => prev.map(m => m.id === streamMsgId ? { ...m, text: m.text + `\n[ERROR: ${e.message}]`, isStreaming: false } : m));
        }
    } finally {
        setIsProcessing(false);
        abortControllerRef.current = null;
    }
  };

  const handleEnvVarUpdate = (key: string, value: string) => {
      const updatedVars = { ...(entry.envVars || {}), [key]: value };
      let files = [...entry.files];
      const envContent = Object.entries(updatedVars).map(([k,v]) => `${k}=${v}`).join('\n');
      const existingEnv = files.find(f => f.name === '.env');
      if (existingEnv) {
          files = files.map(f => f.name === '.env' ? { ...f, content: envContent } : f);
      } else {
          files.push({ name: '.env', content: envContent, language: 'json' }); 
      }
      onUpdate({ ...entry, envVars: updatedVars, files });
      if(selectedFile?.name === '.env') {
          setEditorContent(envContent);
      }
  };

  const handleSaveEnvVars = async (msgId: string, values: Record<string, string>) => {
      const updatedVars = { ...(entry.envVars || {}), ...values };
      const envContent = Object.entries(updatedVars).map(([k,v]) => `${k}=${v}`).join('\n');
      let updatedFiles = [...entry.files];
      const existingEnvIndex = updatedFiles.findIndex(f => f.name === '.env');
      const envFile: GeneratedFile = { name: '.env', content: envContent, language: 'json' };
      if (existingEnvIndex >= 0) {
          updatedFiles[existingEnvIndex] = envFile;
      } else {
          updatedFiles.push(envFile);
      }
      onUpdate({ ...entry, envVars: updatedVars, files: updatedFiles });
      if(selectedFile?.name === '.env') setEditorContent(envContent);
      setHistory(prev => prev.map(m => m.id === msgId ? { ...m, envVarsSaved: true } : m));
      toast.success("Variables Saved & .env generated");
      setIframeKey(k => k + 1); 
      handleSendMessage(false, `Environment variables configured.`);
  };

  const handleFileSelect = (file: GeneratedFile) => {
    if (hasChanges && !confirm("Discard unsaved changes?")) return;
    setSelectedFile(file);
    setEditorContent(file.content);
    setHasChanges(false);
  };
  
  const handleOpenFileFromChat = (fileName: string) => {
      const cleanName = fileName.replace(" (deleted)", "").trim();
      const file = entry.files.find(f => f.name === cleanName);
      if (file) {
          handleFileSelect(file);
          setRightTab('code');
      } else {
          toast.error(`File ${cleanName} not found`);
      }
  };

  const handleAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (evt) => {
              if (evt.target?.result) {
                  setChatAttachments(prev => [...prev, { name: file.name, type: file.type, data: evt.target!.result as string }]);
              }
          };
          reader.readAsDataURL(file);
      }
      if(attachmentInputRef.current) attachmentInputRef.current.value = '';
  };
  const removeAttachment = (index: number) => setChatAttachments(prev => prev.filter((_, i) => i !== index));

  const handleEditorChange = (value: string) => {
    setEditorContent(value);
    setHasChanges(true);
  };

  const saveFileChanges = () => {
    if (!selectedFile) return;
    const updatedFiles = entry.files.map(f => f.name === selectedFile.name ? { ...f, content: editorContent } : f);
    onUpdate({ ...entry, files: updatedFiles });
    setHasChanges(false);
    setIframeKey(k => k + 1);
    toast.success("File Saved");
  };
  
  const restoreSnapshot = (msg: ChatMessage) => {
      if (!msg.snapshot) {
          toast.info("No full snapshot available for this version.");
          return;
      }
      if (confirm(t('confirm') + ` Restore code from ${new Date(msg.timestamp).toLocaleTimeString()}?`)) {
          onUpdate({ ...entry, files: msg.snapshot });
          if(selectedFile) {
              const restoredFile = msg.snapshot.find(f => f.name === selectedFile.name);
              if(restoredFile) setEditorContent(restoredFile.content);
          } else if (msg.snapshot.length > 0) {
              setSelectedFile(msg.snapshot[0]);
              setEditorContent(msg.snapshot[0].content);
          }
          setIframeKey(k => k + 1);
          toast.success("Project Restored");
      }
  };

  const clearCache = () => {
      if(confirm("Clear local cache for this project?")) {
          localStorage.removeItem('editorContent'); 
          setHistory([]);
          toast.success("Cache Cleared");
      }
  };

  const handleRunSecurity = async () => {
      if (!settings.activeProviderId && !process.env.API_KEY) {
          toast.error("Configure AI Provider first");
          return;
      }
      setIsAnalyzingSec(true);
      try {
          const result = await analyzeSecurity(entry.files, "Analyze for XSS, Injection, and sensitive data exposure.");
          setSecurityAnalysis(result);
      } catch (e: any) {
          setSecurityAnalysis("Error: " + e.message);
      } finally {
          setIsAnalyzingSec(false);
      }
  };
  
  const handlePublish = async () => {
      if (!settings.githubToken) {
          toast.error("GitHub Token Missing");
          return;
      }
      setIsProcessing(true);
      try {
          const url = await publishToGitHub(entry, repoName, settings.githubToken, isPrivate, publishTab === 'create', 'main');
          toast.success("Published Successfully!");
          window.open(url, '_blank');
          setActiveTool(null);
      } catch (e: any) {
          toast.error(e.message);
      } finally {
          setIsProcessing(false);
      }
  };

  const handleApproveCommand = (msgId: string, cmdId: string) => {
      setHistory(prev => prev.map(m => {
          if (m.id !== msgId || !m.commands) return m;
          return { ...m, commands: m.commands.map(c => c.id === cmdId ? { ...c, status: 'executed' } : c) };
      }));
      toast.success("Command executed (Simulated)");
  };

  const previewSrc = useMemo(() => {
    const indexHtml = entry.files.find(f => f.name === 'index.html');
    if (!indexHtml) return '';
    let content = indexHtml.content;
    const envScript = `<script>window.process = { env: ${JSON.stringify(entry.envVars || {})} };</script>`;
    const consoleScript = `<script>(function(){var oldError=console.error;console.error=function(){var args=Array.prototype.slice.call(arguments);window.parent.postMessage({type:'CONSOLE_ERROR',message:args.join(' ')},'*');oldError.apply(console,arguments);};window.onerror=function(msg,url,line){window.parent.postMessage({type:'CONSOLE_ERROR',message:msg+' (Line '+line+')'},'*');return false;};})();</script>`;
    content = content.replace('<head>', `<head>${envScript}${consoleScript}`);
    entry.files.filter(f => f.name.endsWith('.css')).forEach(css => { content = content.replace(new RegExp(`<link[^>]+href=["']${css.name}["'][^>]*>`, 'g'), `<style>${css.content}</style>`); });
    entry.files.filter(f => f.name.endsWith('.js')).forEach(js => { content = content.replace(new RegExp(`<script[^>]+src=["']${js.name}["'][^>]*>.*?</script>`, 'gs'), `<script>${js.content}</script>`); });
    return content;
  }, [entry.files, entry.envVars, iframeKey]);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col font-sans animate-in fade-in duration-300">
      
      {/* Header */}
      <header className="h-16 border-b border-[#ffc93a]/30 bg-[#ffffbb]/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 shadow-sm z-30">
         <div className="flex items-center gap-4">
             <button onClick={onClose} className="text-slate-500 hover:text-[#ff7e15] flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-[#ffff7e]/50 transition-all text-sm font-bold group">
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
               Back
             </button>
             <div className="h-6 w-px bg-[#ffc93a]/50"></div>
             <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">{entry.project || 'Untitled'}</h1>
         </div>
         <div className="flex items-center gap-4">
             <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-[#ffc93a]/30 shadow-sm">
                <button onClick={() => setActiveTool(activeTool === 'env' ? null : 'env')} title={t('envVars', 'journal')} className={`p-2.5 rounded-xl transition-all ${activeTool === 'env' ? 'bg-[#ff7e15]/10 text-[#ff7e15]' : 'text-slate-400 hover:text-[#ff7e15] hover:bg-[#ffff7e]/50'}`}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>
                <button onClick={() => setActiveTool(activeTool === 'github' ? null : 'github')} title={t('publish', 'builder')} className={`p-2.5 rounded-xl transition-all ${activeTool === 'github' ? 'bg-[#ff7e15]/10 text-[#ff7e15]' : 'text-slate-400 hover:text-[#ff7e15] hover:bg-[#ffff7e]/50'}`}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg></button>
                <button onClick={() => setActiveTool(activeTool === 'history' ? null : 'history')} title={t('history', 'builder')} className={`p-2.5 rounded-xl transition-all ${activeTool === 'history' ? 'bg-[#ff7e15]/10 text-[#ff7e15]' : 'text-slate-400 hover:text-[#ff7e15] hover:bg-[#ffff7e]/50'}`}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></button>
                <button onClick={() => setActiveTool(activeTool === 'security' ? null : 'security')} title={t('security', 'builder')} className={`p-2.5 rounded-xl transition-all ${activeTool === 'security' ? 'bg-[#ff7e15]/10 text-[#ff7e15]' : 'text-slate-400 hover:text-[#ff7e15] hover:bg-[#ffff7e]/50'}`}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></button>
             </div>
             <div className="flex bg-[#ffffbb] p-1 rounded-2xl border border-[#ffc93a]/30">
                 <button onClick={() => setRightTab('preview')} className={`p-2.5 rounded-xl transition-all ${rightTab === 'preview' ? 'bg-white text-[#ff7e15] shadow-md' : 'text-slate-500 hover:text-slate-700'}`}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>
                 <button onClick={() => setRightTab('code')} className={`p-2.5 rounded-xl transition-all ${rightTab === 'code' ? 'bg-white text-[#ff7e15] shadow-md' : 'text-slate-500 hover:text-slate-700'}`}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg></button>
                 <button onClick={() => setRightTab('console')} className={`p-2.5 rounded-xl transition-all ${rightTab === 'console' ? 'bg-white text-[#ff7e15] shadow-md' : 'text-slate-500 hover:text-slate-700'} ${consoleErrors.length > 0 ? 'text-[#ff2935] animate-pulse' : ''}`}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg></button>
             </div>
         </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Builder Chat (Light Theme) */}
        <div className={`transition-all duration-300 ease-in-out border-r border-[#ffc93a]/30 flex flex-col z-10 shadow-2xl shadow-[#ffc93a]/20 relative bg-white ${isSidebarCollapsed ? 'w-16' : 'w-full md:w-[420px] lg:w-[480px]'}`}>
            {/* Header */}
            <div className={`p-4 border-b border-[#ffff7e] bg-white shrink-0 z-10 flex ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} items-center`}>
                {!isSidebarCollapsed && (
                    <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#ff7e15] animate-pulse"></div>
                            <span className="text-xs text-slate-500 font-extrabold tracking-widest uppercase">{t('builderTerminal', 'insight')}</span>
                        </div>
                        <div className="flex gap-2 items-center">
                                <select value={activeProvider} onChange={e => { setActiveProvider(e.target.value); setActiveModel(''); }} className="bg-[#ffffbb]/30 text-[10px] font-bold text-slate-600 border border-[#ffc93a]/50 rounded-lg px-2 py-1 outline-none cursor-pointer hover:border-[#ff7e15] transition-colors">
                                    <option value="gemini">Gemini</option>
                                    {settings.customProviders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <select value={activeModel} onChange={e => setActiveModel(e.target.value)} className="bg-[#ff7e15]/10 text-[10px] text-[#ff7e15] font-extrabold border border-[#ffc93a]/50 rounded-lg px-2 py-1 outline-none max-w-[80px] truncate cursor-pointer hover:bg-[#ffff7e]/50">
                                    {activeProvider === 'gemini' ? (<><option value="gemini-2.5-flash">Flash</option><option value="gemini-3-pro-preview">Pro</option></>) : (settings.customProviders.find(p => p.id === activeProvider)?.models.map(m => <option key={m.id} value={m.id}>{m.name}</option>))}
                                </select>
                        </div>
                    </div>
                )}
                <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="text-slate-300 hover:text-[#ff7e15] ml-2 transition-colors p-1" title={isSidebarCollapsed ? "Expand" : "Collapse"}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isSidebarCollapsed ? "rotate-180" : ""}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                </button>
            </div>

          {!isSidebarCollapsed && (
          <>
          <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar bg-[#ffffbb]/10" ref={chatScrollRef}>
             {history.map((msg, index) => {
               const durationMatch = msg.reasoning?.match(/___META_DURATION_([\d.]+)___/);
               const duration = durationMatch ? durationMatch[1] : null;
               const cleanReasoning = msg.reasoning?.replace(/___META_DURATION_[\d.]+___/, '').trim();
               const isFirst = index === 0;

               return (
               <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group relative`} title={new Date(msg.timestamp).toLocaleString()}>
                 {/* Timestamp */}
                 <div className={`text-[10px] text-slate-300 mb-1.5 font-bold uppercase tracking-wider px-1 ${isFirst ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                 </div>

                 {/* Reasoning/Log Block */}
                 {cleanReasoning && (
                    <>
                        {cleanReasoning.includes('```build-logs') ? (
                            <BuildLogRenderer content={cleanReasoning} />
                        ) : (
                            <details className="w-full mb-3 group/details" open={msg.isStreaming}>
                                <summary className="list-none cursor-pointer">
                                    <div className="bg-white border border-[#ffc93a]/30 p-2.5 rounded-xl text-[10px] font-bold text-[#ff7e15] uppercase flex justify-between items-center hover:bg-[#ffff7e]/20 transition-colors shadow-sm">
                                        <div className="flex gap-2 items-center">
                                            <span className="flex items-center gap-1.5"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>{t('archPlan', 'insight')}</span>
                                            {msg.isStreaming && <span className="text-[#ff2935] animate-pulse font-mono">({thinkTime}s)</span>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {duration && <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-mono">({duration}s)</span>}
                                            <span className="text-[#ff7e15] group-open/details:rotate-180 transition-transform">▼</span>
                                        </div>
                                    </div>
                                </summary>
                                <div className="bg-white border-x border-b border-[#ffc93a]/30 -mt-1 p-4 rounded-b-xl text-xs text-slate-600 whitespace-pre-wrap animate-in fade-in slide-in-from-top-1 shadow-sm leading-relaxed">{cleanReasoning}</div>
                            </details>
                        )}
                    </>
                 )}
                 
                 {/* Message Bubble */}
                 <div className={`max-w-[90%] p-5 rounded-[1.25rem] text-sm leading-relaxed shadow-sm relative overflow-hidden ${msg.role === 'user' ? 'bg-gradient-to-br from-[#ff2935] to-[#ff7e15] text-white rounded-br-sm shadow-[#ff7e15]/30' : 'bg-white text-slate-700 border border-[#ffc93a]/30 rounded-bl-sm shadow-slate-100'}`}>
                   {msg.role === 'model' && <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#ff7e15] to-[#ffc93a]"></div>}
                   <MarkdownRenderer content={msg.text} />
                   {msg.isStreaming && <span className="inline-block w-1.5 h-3 bg-[#ff7e15] ml-1 animate-pulse"></span>}
                   
                   {/* COMMAND LOGS */}
                   {msg.commands && msg.commands.length > 0 && (
                       <div className="mt-4 bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2">
                           {msg.commands.map(cmd => (
                               <div key={cmd.id} className="flex items-center gap-3 text-xs font-mono text-slate-600">
                                   <span className="text-[#ff7e15] font-bold">$</span>
                                   <span className="flex-1">{cmd.command}</span>
                                   {cmd.status === 'executed' && <span className="text-emerald-500 text-[10px] font-extrabold uppercase bg-emerald-50 px-2 py-0.5 rounded">Done</span>}
                                   {cmd.status === 'pending' && (
                                       <button onClick={() => handleApproveCommand(msg.id, cmd.id)} className="text-[10px] bg-[#ff7e15]/10 text-[#ff7e15] px-3 py-1 rounded-full font-bold hover:bg-[#ff7e15]/20 transition-colors">Run</button>
                                   )}
                               </div>
                           ))}
                       </div>
                   )}

                   {msg.requiredEnvVars && msg.requiredEnvVars.length > 0 && (
                        <EnvVarRequestMessage requests={msg.requiredEnvVars} saved={msg.envVarsSaved || false} onSave={(values) => handleSaveEnvVars(msg.id, values)} />
                   )}
                 </div>

                 {/* Modified Files List */}
                 {(msg.modifiedFiles && msg.modifiedFiles.length > 0) || msg.pendingFile ? (
                   <div className="mt-2 w-full bg-white rounded-2xl border border-[#ffc93a]/30 p-3 text-[11px] sm:text-xs animate-in zoom-in-95 duration-300 shadow-sm">
                     <div className="text-slate-300 mb-2 border-b border-[#ffff7e] pb-1 uppercase tracking-wider font-extrabold text-[9px] flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        {cleanReasoning && cleanReasoning.includes('build-logs') ? 'Generated Files:' : 'Modifications:'}
                     </div>
                     <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                        {msg.modifiedFiles?.map(fileName => (
                        <div key={fileName} onClick={() => handleOpenFileFromChat(fileName)} className="flex gap-2 items-center text-slate-600 hover:bg-[#ffff7e]/30 p-2 rounded-lg cursor-pointer transition-colors group/file">
                            <span className="text-white bg-[#ffc93a] rounded-full w-4 h-4 flex items-center justify-center text-[8px]">✔</span>
                            <span className="group-hover/file:text-[#ff7e15] font-bold">{fileName.replace(" (deleted)", "")}</span>
                            <span className="ml-auto opacity-0 group-hover/file:opacity-100 text-[#ff7e15] bg-[#ffff7e]/50 px-2 rounded-full text-[10px] font-bold">Open</span>
                        </div>
                        ))}
                        {msg.pendingFile && (
                            <div className="flex gap-2 items-center text-slate-400 p-2 animate-pulse bg-slate-50 rounded-lg">
                                <span className="w-4 h-4 border-2 border-[#ffff7e] border-t-[#ff7e15] rounded-full animate-spin"></span>
                                <span className="font-mono italic">{msg.pendingFile}...</span>
                            </div>
                        )}
                     </div>
                   </div>
                 ) : null}
               </div>
               );
             })}

             {isProcessing && !history[history.length-1]?.isStreaming && (
                <div className="flex justify-start">
                   <div className="bg-white px-5 py-3 rounded-[1.5rem] rounded-bl-sm flex items-center gap-2 border border-slate-100 shadow-sm">
                      <div className="w-2 h-2 bg-[#ff2935] rounded-full animate-bounce" style={{animationDelay:'0ms'}}></div>
                      <div className="w-2 h-2 bg-[#ff7e15] rounded-full animate-bounce" style={{animationDelay:'150ms'}}></div>
                      <div className="w-2 h-2 bg-[#ffc93a] rounded-full animate-bounce" style={{animationDelay:'300ms'}}></div>
                   </div>
                </div>
             )}
          </div>
          {/* Input Area */}
          <div className="p-5 bg-white border-t border-[#ffff7e] shadow-[0_-10px_40px_rgba(255,201,58,0.05)] z-20">
            <div className="relative flex flex-col gap-3">
              <textarea 
                value={chatInput} 
                onChange={e => setChatInput(e.target.value)} 
                onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} 
                placeholder="Type your instructions..." 
                disabled={isProcessing} 
                rows={3} 
                className="w-full bg-[#ffffbb]/20 hover:bg-[#ffffbb]/40 focus:bg-white border-2 border-transparent focus:border-[#ffc93a] rounded-2xl px-5 py-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 font-medium resize-none shadow-inner"
              />
              <div className="flex justify-between items-center">
                 <button onClick={toggleListening} disabled={isProcessing} className={`text-xs font-bold flex items-center gap-2 px-4 py-2 rounded-full transition-all ${isListening ? 'bg-[#ff2935] text-white animate-pulse' : 'text-slate-400 hover:bg-[#ffff7e] hover:text-[#ff7e15]'}`}>
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                     {isListening ? 'Listening...' : 'Voice'}
                 </button>
                 {isProcessing ? (
                     <button onClick={stopGeneration} className="px-6 py-2.5 bg-rose-50 hover:bg-rose-100 text-[#ff2935] rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all border border-rose-100">Stop</button>
                 ) : (
                     <button onClick={() => handleSendMessage()} disabled={!chatInput.trim() && chatAttachments.length === 0} className="px-8 py-2.5 bg-[#ff7e15] hover:bg-[#ff2935] text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#ff7e15]/30 hover:-translate-y-0.5">Send</button>
                 )}
              </div>
            </div>
          </div>
          </>
          )}
        </div>
        
        {/* CENTER: Work Area (Preview/Code) */}
        <div className="flex-1 bg-[#ffffbb]/10 relative flex flex-col min-w-0 z-0">
             {rightTab === 'preview' && (
                <>
                {/* PREVIEW TOOLBAR */}
                <div className="h-14 border-b border-[#ffc93a]/30 bg-white/60 backdrop-blur flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-3 bg-white rounded-2xl px-2 pl-4 py-1.5 border border-[#ffc93a]/30 flex-1 max-w-lg mx-auto shadow-sm">
                        <span className="text-[#ff7e15]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        </span>
                        <input readOnly value="http://localhost:3000/" className="bg-transparent border-none outline-none text-xs text-slate-400 font-mono flex-1 text-center" />
                        <button onClick={() => setIframeKey(k => k+1)} className="text-slate-400 hover:text-[#ff7e15] hover:bg-[#ffff7e]/50 p-1.5 rounded-lg transition-colors" title="Restart App">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                        </button>
                    </div>
                    <div className="flex gap-1 bg-white p-1 rounded-2xl border border-[#ffc93a]/30 shadow-sm">
                        <button onClick={() => setDeviceMode('mobile')} className={`p-2 rounded-xl transition-all ${deviceMode === 'mobile' ? 'bg-[#ff7e15]/10 text-[#ff7e15]' : 'text-slate-400 hover:text-slate-600'}`} title="Mobile"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12" y2="18"></line></svg></button>
                        <button onClick={() => setDeviceMode('tablet')} className={`p-2 rounded-xl transition-all ${deviceMode === 'tablet' ? 'bg-[#ff7e15]/10 text-[#ff7e15]' : 'text-slate-400 hover:text-slate-600'}`} title="Tablet"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12" y2="18"></line></svg></button>
                        <button onClick={() => setDeviceMode('desktop')} className={`p-2 rounded-xl transition-all ${deviceMode === 'desktop' ? 'bg-[#ff7e15]/10 text-[#ff7e15]' : 'text-slate-400 hover:text-slate-600'}`} title="Desktop"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg></button>
                        <div className="w-px h-6 bg-[#ffff7e] mx-1"></div>
                        <button onClick={() => window.open('about:blank')} className="p-2 rounded-xl text-slate-400 hover:text-[#ff7e15] hover:bg-[#ffff7e]/50" title="Open New Tab"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></button>
                    </div>
                </div>
                
                <div className="flex-1 w-full bg-[#fcfcfc] flex items-center justify-center p-8 overflow-auto min-h-0 bg-[radial-gradient(#ffc93a_1px,transparent_1px)] [background-size:16px_16px]">
                  <div className={`transition-all duration-500 bg-white shadow-2xl overflow-hidden shrink-0 my-auto ${deviceMode === 'mobile' ? 'w-[375px] h-[667px] rounded-[3rem] border-[8px] border-slate-900 ring-4 ring-[#ffc93a]' : deviceMode === 'tablet' ? 'w-[768px] h-[1024px] rounded-[2rem] border-[8px] border-slate-900 ring-4 ring-[#ffc93a]' : 'w-full h-full rounded-2xl border border-slate-200 shadow-xl'}`}>
                    {previewSrc ? (
                      <iframe key={iframeKey} srcDoc={previewSrc} className="w-full h-full border-none bg-white" title="Live Preview" sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 font-medium">
                          <div className="w-16 h-16 bg-[#ffffbb] rounded-full flex items-center justify-center mb-4">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
                          </div>
                          No preview available yet.
                      </div>
                    )}
                  </div>
                </div>
                </>
             )}
             
             {/* Code View - Keeping dark for better code readability */}
             {rightTab === 'code' && (
                <div className="w-full h-full flex flex-col md:flex-row bg-[#1e1e1e]">
                    <div className="w-64 bg-[#181818] border-r border-[#333] overflow-y-auto">
                        <div className="p-5 text-[10px] uppercase text-[#666] font-extrabold tracking-widest bg-[#181818]">File Explorer</div>
                        {entry.files.map(f => (
                            <button key={f.name} onClick={() => handleFileSelect(f)} className={`w-full text-left px-5 py-2.5 text-xs font-mono truncate border-l-[3px] hover:bg-[#252525] transition-colors ${selectedFile?.name === f.name ? 'border-[#ff7e15] bg-[#252525] text-white' : 'border-transparent text-gray-500'}`}>
                                {f.name}
                            </button>
                        ))}
                        {hasChanges && <button onClick={saveFileChanges} className="mx-4 mt-4 w-[calc(100%-2rem)] bg-[#ff7e15] text-white text-xs py-2 rounded hover:bg-[#ff2935] transition-colors uppercase font-bold tracking-wider">Save Changes</button>}
                    </div>
                    <div className="flex-1 flex flex-col min-w-0">
                        {selectedFile ? (
                            <CodeEditor key={selectedFile.name} value={editorContent} language={selectedFile.name.endsWith('html') ? 'html' : 'javascript'} onChange={handleEditorChange} />
                        ) : <div className="flex items-center justify-center h-full text-gray-600 font-mono text-sm">Select a file from the explorer.</div>}
                    </div>
                </div>
             )}
             
             {rightTab === 'console' && (
                <div className="w-full h-full bg-[#1e1e1e] p-6 font-mono text-sm overflow-auto">
                    {consoleErrors.length === 0 ? <div className="text-gray-600 italic text-center mt-20">No runtime errors detected. Nice code!</div> : (
                        <div className="space-y-3 max-w-3xl mx-auto">
                            {consoleErrors.map(err => (
                                <div key={err.id} className="bg-rose-900/10 border border-rose-500/30 p-4 rounded-xl text-rose-200 flex justify-between items-center shadow-lg">
                                    <span className="flex items-center gap-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                        {err.message}
                                    </span>
                                    <button onClick={() => handleAutoFix(err.message)} className="bg-rose-500 hover:bg-rose-400 px-4 py-1.5 rounded-lg text-xs uppercase font-bold text-white transition-colors shadow-md">Fix</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
             )}
        </div>
        
        {/* RIGHT SIDE PANEL (Active Tool) */}
        {activeTool && (
        <div className="w-[340px] bg-white border-l border-[#ffc93a]/30 flex flex-col z-20 animate-in slide-in-from-right-10 duration-300 shadow-2xl shadow-[#ffc93a]/20">
            <div className="flex justify-between items-center p-5 border-b border-[#ffff7e] bg-white sticky top-0 z-10">
                <h3 className="text-[#ff7e15] text-xs font-extrabold uppercase tracking-widest flex items-center gap-2">
                    {activeTool === 'env' && <><span className="text-xl">⚙️</span> Environment Variables</>}
                    {activeTool === 'github' && <><span className="text-xl">🐙</span> GitHub Publishing</>}
                    {activeTool === 'history' && <><span className="text-xl">⏪</span> Version History</>}
                    {activeTool === 'security' && <><span className="text-xl">🛡️</span> Security Scan</>}
                </h3>
                <button onClick={() => setActiveTool(null)} className="text-slate-300 hover:text-slate-800 text-2xl leading-none transition-colors">&times;</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-[#ffffbb]/20">
                {/* ENV VARS PANEL */}
                {activeTool === 'env' && (
                    <div className="space-y-5">
                        <div className="text-xs text-[#ff7e15] bg-[#ffffbb] p-3 rounded-xl border border-[#ffc93a] leading-relaxed">
                            These variables are securely injected into your app process at runtime.
                        </div>
                        {Object.entries(entry.envVars || {}).map(([key, val]) => (
                            <div key={key} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="text-[10px] text-[#ff7e15] font-bold font-mono mb-2 uppercase tracking-wider">{key}</div>
                                <input 
                                    className="w-full bg-slate-50 border-2 border-transparent hover:border-[#ffc93a] focus:bg-white focus:border-[#ff7e15] rounded-xl px-3 py-2 text-xs text-slate-700 outline-none transition-all font-mono"
                                    value={val}
                                    onChange={(e) => handleEnvVarUpdate(key, e.target.value)}
                                />
                            </div>
                        ))}
                         <div className="pt-6 border-t border-slate-200/50">
                            <h4 className="text-[10px] text-slate-400 uppercase mb-3 font-bold tracking-wider">Add New Variable</h4>
                            <input id="newEnvKey" placeholder="KEY_NAME" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 mb-3 outline-none focus:border-[#ffc93a] focus:ring-2 focus:ring-[#ffff7e]" />
                            <input id="newEnvVal" placeholder="Value" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 mb-3 outline-none focus:border-[#ffc93a] focus:ring-2 focus:ring-[#ffff7e]" />
                            <button onClick={() => {
                                const k = (document.getElementById('newEnvKey') as HTMLInputElement).value;
                                const v = (document.getElementById('newEnvVal') as HTMLInputElement).value;
                                if(k) { handleEnvVarUpdate(k, v); (document.getElementById('newEnvKey') as HTMLInputElement).value = ''; }
                            }} className="w-full bg-[#ffff7e] text-[#ff7e15] text-xs py-3 rounded-xl hover:bg-[#ffc93a] hover:text-white uppercase font-extrabold transition-colors">Add Variable</button>
                        </div>
                    </div>
                )}

                {/* GITHUB PANEL */}
                {activeTool === 'github' && (
                    <div className="space-y-5">
                        {!settings.githubToken ? (
                            <div className="text-center text-xs text-slate-500 bg-slate-100 p-6 rounded-2xl border-dashed border-2 border-slate-200">
                                <p className="mb-2">GitHub not connected.</p>
                                <button className="text-[#ff7e15] font-bold hover:underline">Go to Settings</button>
                            </div>
                        ) : (
                            <>
                                <div className="flex gap-2 mb-2 bg-slate-100 p-1.5 rounded-xl">
                                    <button onClick={() => setPublishTab('create')} className={`flex-1 py-2 text-[10px] uppercase font-bold rounded-lg transition-all ${publishTab === 'create' ? 'bg-white shadow-sm text-[#ff7e15]' : 'text-slate-400 hover:text-slate-600'}`}>New Repo</button>
                                    <button onClick={() => setPublishTab('existing')} className={`flex-1 py-2 text-[10px] uppercase font-bold rounded-lg transition-all ${publishTab === 'existing' ? 'bg-white shadow-sm text-[#ff7e15]' : 'text-slate-400 hover:text-slate-600'}`}>Existing</button>
                                </div>
                                {publishTab === 'create' ? (
                                    <>
                                        <input value={repoName} onChange={e => setRepoName(e.target.value)} placeholder="Repository Name" className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-xs text-slate-800 outline-none focus:border-[#ffc93a] transition-colors" />
                                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100">
                                            <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} className="accent-[#ff7e15] w-4 h-4" />
                                            <label className="text-xs text-slate-600 font-medium">Private Repository</label>
                                        </div>
                                    </>
                                ) : (
                                    <select onChange={e => setRepoName(e.target.value)} className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-xs text-slate-800 outline-none focus:border-[#ffc93a]">
                                        <option value="">Select Repository...</option>
                                        {userRepos.map(r => <option key={r.id} value={r.full_name}>{r.full_name}</option>)}
                                    </select>
                                )}
                                <button onClick={handlePublish} disabled={isProcessing} className="w-full bg-[#24292e] hover:bg-[#2f363d] text-white py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                                    Publish to GitHub
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* HISTORY PANEL */}
                {activeTool === 'history' && (
                    <div className="space-y-4">
                        <div className="flex justify-end mb-2">
                             <button onClick={clearCache} className="text-[10px] text-rose-500 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-full flex items-center gap-1 font-bold transition-colors">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                 Clear Cache
                             </button>
                        </div>
                        {history.filter(m => m.role === 'model' && m.snapshot).slice().reverse().map((msg, i) => (
                            <div key={msg.id} className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-[#ffc93a] transition-all shadow-sm group hover:shadow-md cursor-default">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="text-[10px] bg-[#ffffbb] text-[#ff7e15] px-2 py-0.5 rounded font-bold uppercase tracking-wider">v{history.filter(m=>m.role==='model' && m.snapshot).length - i}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">{msg.text}</p>
                                <button onClick={() => restoreSnapshot(msg)} className="text-[10px] bg-slate-50 text-slate-500 hover:bg-[#ff7e15] hover:text-white px-3 py-2 rounded-lg transition-all uppercase font-extrabold flex items-center gap-2 w-full justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
                                    Restore Version
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* SECURITY PANEL */}
                {activeTool === 'security' && (
                    <div className="space-y-4">
                        <div className="text-xs text-[#ff7e15] bg-[#ffffbb] p-4 rounded-2xl leading-relaxed">
                            Run an AI security audit on your generated code to detect vulnerabilities.
                        </div>
                        <button onClick={handleRunSecurity} disabled={isAnalyzingSec} className="w-full bg-white hover:bg-rose-50 text-rose-500 border-2 border-rose-100 hover:border-rose-200 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md">
                             {isAnalyzingSec ? 'Scanning...' : 'Run Security Scan'}
                        </button>
                        {securityAnalysis && (
                            <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 whitespace-pre-wrap font-mono max-h-80 overflow-y-auto">
                                {securityAnalysis}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
        )}
      </div>
    </div>
  );
};