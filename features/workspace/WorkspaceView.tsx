import React, { useState, useEffect, useCallback, useRef } from 'react';
import { JournalEntry, ChatMessage, AppSettings, GeneratedFile } from '../../types';
import { analyzeSecurity } from '../../services/geminiService';
import { publishToGitHub } from '../../services/githubService';
import { dbFacade } from '../../services/dbFacade';
import { toast } from '../../services/toastService';
import { dialogService } from '../../services/dialogService';
import { MarkdownRenderer } from '../../components/ui/MarkdownRenderer';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useRefactorStream } from './hooks/useRefactorStream';
import { useOnboarding } from '../../hooks/useOnboarding';
import { OnboardingOverlay, Step } from '../../components/ui/OnboardingOverlay';

import { WorkspaceHeader } from './components/WorkspaceHeader';
import { WorkspaceChat } from './components/WorkspaceChat';
import { WorkspacePreview } from './components/WorkspacePreview';
import { WorkspaceCode } from './components/WorkspaceCode';
import { WorkspaceInfo } from './components/WorkspaceInfo';
import { WorkspaceHistory } from './components/WorkspaceHistory';
import { ElementEditorPanel } from './components/editor/ElementEditorPanel';

import { useWorkspaceLayout } from './hooks/useWorkspaceLayout';
import { usePreviewSystem } from './hooks/usePreviewSystem';
import { useEditorSystem } from './hooks/useEditorSystem';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface WorkspaceViewProps {
  entry: JournalEntry;
  onUpdate: (updatedEntry: JournalEntry) => Promise<void>;
  onClose: () => void;
  settings: AppSettings;
}

const ONBOARDING_STEPS: Step[] = [
    { target: '[data-tour="chat-input"]', titleKey: 'chatTitle', descKey: 'chatDesc', position: 'top' },
    { target: '[data-tour="workspace-panel"]', titleKey: 'panelTitle', descKey: 'panelDesc', position: 'left' }
];

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({ entry, onUpdate, onClose, settings }) => {
  const layout = useWorkspaceLayout();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [chatInput, setChatInput] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [chatAttachments, setChatAttachments] = useState<any[]>([]);
  const [totalUsage, setTotalUsage] = useState({ input: 0, output: 0 });
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const isResizing = useRef(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [editorPanel, setEditorPanel] = useState({ isOpen: false, selector: null as string | null });
  const [chatContextSelectors, setChatContextSelectors] = useState<string[]>([]);

  const { isActive, currentStep, next, finish, skip } = useOnboarding();

  const handleTurnComplete = async (data: { updatedEntry: JournalEntry; userMessage: ChatMessage; modelMessage: ChatMessage; oldFiles: GeneratedFile[]; newFiles: GeneratedFile[]; }) => {
      setSaveStatus('saving');
      try {
          await dbFacade.atomicUpdateProjectWithHistory(data.updatedEntry, data.modelMessage, data.oldFiles, data.newFiles, data.userMessage);
          await onUpdate(data.updatedEntry);
          setTimeout(() => setSaveStatus('saved'), 800);
      } catch (e: any) { setSaveStatus('error'); toast.error(e.message); }
  };

  const preview = usePreviewSystem(entry.files ?? [], entry.dependencies, layout.iframeKey, entry.envVars, entry.requiredEnvVars);
  const editor = useEditorSystem(entry, (e) => onUpdate(e).then(() => true), layout.refreshPreview);
  const voice = useVoiceInput();
  const { isProcessing, streamState, handleStreamingBuild, cancelStream } = useRefactorStream({ entry, settings, history, setHistory, onTurnComplete: handleTurnComplete, setTotalUsage, setIframeKey: layout.setIframeKey });

  const toggleSelectionMode = useCallback((forceState?: boolean) => {
    const newMode = forceState ?? !isSelectionModeActive;
    setIsSelectionModeActive(newMode);
    iframeRef.current?.contentWindow?.postMessage({ type: 'TOGGLE_SELECTION_MODE', active: newMode }, '*');
    if (!newMode) {
        if (editorPanel.isOpen) setEditorPanel({ isOpen: false, selector: null });
        setChatContextSelectors([]);
    }
  }, [isSelectionModeActive, editorPanel.isOpen]);

  useEffect(() => { if (voice.transcript) { setChatInput(p => p + ' ' + voice.transcript); voice.resetTranscript(); } }, [voice.transcript]);
  
  // Effect 1: Fetch history on mount/entry change
  useEffect(() => {
    let isMounted = true;
    dbFacade.getRefactorHistory(entry.id).then(msgs => {
      if (isMounted) setHistory(msgs);
    });
    return () => { isMounted = false; };
  }, [entry.id]);

  // Effect 2: Trigger initial build when history is loaded for a pending project
  useEffect(() => {
    if (entry.pendingGeneration && history.length > 0 && history.length <= 1 && !isProcessing) {
      handleStreamingBuild();
    }
  }, [entry.pendingGeneration, history, handleStreamingBuild, isProcessing]);
  
  // Effect 3: Handle iframe messages
  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
        if (event.data.type === 'ELEMENT_SELECTED_FOR_CHAT') {
            setChatContextSelectors(prev => [...new Set([...prev, event.data.selector])]);
            if (isMobile) {
                layout.setMobileView('chat');
            }
        }
        if (event.data.type === 'ELEMENT_SELECTED_FOR_EDIT') {
            setEditorPanel({ isOpen: true, selector: event.data.selector });
            toggleSelectionMode(false);
            if (isMobile) {
                layout.setMobileView('chat');
            }
        }
    };
    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
  }, [isMobile, layout.setMobileView, toggleSelectionMode]);

  const handleApplyDirectStyle = async (selector: string, styles: Record<string, string>) => {
    const indexFile = entry.files.find(f => f.name === 'index.html');
    if (!indexFile) {
        toast.error("Could not find index.html to apply styles.");
        return;
    }

    const styleProperties = Object.entries(styles)
        .map(([key, value]) => `  ${key}: ${value};`)
        .join('\n');

    const newRule = `\n${selector} {\n${styleProperties}\n}\n`;

    let newContent = '';
    const styleTagRegex = /<style id="lumina-direct-styles">([\s\S]*?)<\/style>/;
    const match = indexFile.content.match(styleTagRegex);

    if (match) {
        const existingRules = match[1];
        newContent = indexFile.content.replace(styleTagRegex, `<style id="lumina-direct-styles">${existingRules}${newRule}</style>`);
    } else {
        const newStyleTag = `\n<style id="lumina-direct-styles">${newRule}</style>\n</head>`;
        newContent = indexFile.content.replace('</head>', newStyleTag);
    }
    
    const updatedFiles = entry.files.map(f => f.name === 'index.html' ? { ...f, content: newContent } : f);
    const updatedEntry = { ...entry, files: updatedFiles };
    await onUpdate(updatedEntry);

    setEditorPanel({ isOpen: false, selector: null });
    toast.success("Direct style applied!");
    layout.refreshPreview();
  };

  const handleMouseDown = (e: React.MouseEvent) => { e.preventDefault(); isResizing.current = true; };
  const handleMouseUp = useCallback(() => { isResizing.current = false; }, []);
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing.current) {
        const newWidth = Math.max(320, Math.min(e.clientX, window.innerWidth - 320));
        layout.setChatPanelWidth(newWidth);
    }
  }, [layout.setChatPanelWidth]);

  const handleRevert = async (messageId: string) => {
    const confirmed = await dialogService.confirm("Revert This Change?", "This will restore the project to the state *before* this change and delete all subsequent history. Are you sure?", { destructive: true, confirmText: "Revert" });
    if (!confirmed) return;

    const targetIndex = history.findIndex(m => m.id === messageId);
    if (targetIndex < 1) { toast.error("Cannot revert the initial prompt."); return; }

    const prevState = history[targetIndex - 1];
    if (!prevState || !prevState.snapshot) { toast.error("Could not find the previous state to revert to."); return; }
    
    try {
        await dbFacade.revertToSnapshot(entry.id, prevState.snapshot, prevState.timestamp);
        const [updatedProject, updatedHistory] = await Promise.all([dbFacade.getProjectById(entry.id), dbFacade.getRefactorHistory(entry.id)]);
        if (updatedProject) {
            await onUpdate(updatedProject);
            setHistory(updatedHistory);
            layout.refreshPreview();
            toast.success("Project reverted!");
        }
    } catch (e: any) { toast.error("Failed to revert: " + e.message); }
  };
  
  const handleUseSelectorsInChat = () => {
    if (chatContextSelectors.length === 0) return;
    const selectorsText = chatContextSelectors.map(s => `"${s}"`).join(', ');
    const prefix = chatContextSelectors.length > 1 ? 'For the elements ' : 'For the element ';
    setChatInput(prev => `${prev}${prefix}${selectorsText}, `);
    toggleSelectionMode(false);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const ChatContent = (
    <div className="relative h-full w-full">
        {editorPanel.isOpen && editorPanel.selector && (
            <ElementEditorPanel 
                selector={editorPanel.selector}
                onClose={() => setEditorPanel({ isOpen: false, selector: null })}
                onApplyAI={(prompt) => {
                    setChatInput(prompt);
                    handleStreamingBuild(prompt, [], editor.getContext());
                    setEditorPanel({ isOpen: false, selector: null });
                }}
                onApplyDirectly={handleApplyDirectStyle}
            />
        )}
        <WorkspaceChat history={history} chatInput={chatInput} setChatInput={setChatInput} isProcessing={isProcessing} thinkTime={0} fileStatuses={streamState.fileStatuses} currentReasoning={streamState.reasoningBuffer} currentText={streamState.textBuffer} onSend={() => { handleStreamingBuild(chatInput, chatAttachments, editor.getContext()); setChatInput(''); setChatAttachments([]); }} onStop={cancelStream} onEnvVarSave={(v) => onUpdate({ ...entry, envVars: { ...entry.envVars, ...v } })} isListening={voice.isListening} toggleListening={voice.toggleListening} attachments={chatAttachments} setAttachments={setChatAttachments} aiPlan={streamState.aiPlan} suggestions={streamState.suggestions} onRevert={handleRevert} 
          chatContextSelectors={chatContextSelectors}
          onUseSelectorsInChat={handleUseSelectorsInChat}
          onRemoveSelector={(s) => setChatContextSelectors(p => p.filter(x => x !== s))}
          onClearSelectors={() => setChatContextSelectors([])}
        />
    </div>
  );
  
  const RightPanelContent = (
    <div className="flex-1 overflow-hidden relative h-full">
        {layout.rightTab === 'info' && <WorkspaceInfo entry={entry} onUpdate={onUpdate} />}
        {layout.rightTab === 'preview' && <WorkspacePreview iframeSrc={preview.iframeSrc} iframeKey={layout.iframeKey} deviceMode={layout.deviceMode} setDeviceMode={layout.setDeviceMode} showConsole={preview.showConsole} setShowConsole={preview.setShowConsole} consoleLogs={preview.consoleLogs} errorCount={preview.errorCount} onClearLogs={preview.clearLogs} onNavigateError={(f, l) => { layout.setRightTab('code'); editor.selectFile(entry.files.find(x => x.name === f) || entry.files[0]); editor.setScrollToLine(l); }} iframeRef={iframeRef} isSelectionModeActive={isSelectionModeActive} onToggleSelectionMode={toggleSelectionMode} />}
        {layout.rightTab === 'code' && <WorkspaceCode files={entry.files} selectedFile={editor.selectedFile} editorContent={editor.editorContent} hasChanges={editor.hasChanges} onFileSelect={editor.selectFile} onCodeChange={editor.handleContentChange} onSave={editor.saveChanges} scrollToLine={editor.scrollToLine} onEditorMount={(api) => editor.editorApiRef.current = api} annotations={streamState.annotations} readOnly={isProcessing} />}
        {layout.rightTab === 'history' && <WorkspaceHistory history={history} onRevert={(id) => handleRevert(id)} />}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in fade-in duration-300">
      {isActive && <OnboardingOverlay steps={ONBOARDING_STEPS} currentStep={currentStep} onNext={next} onFinish={finish} onSkip={skip} />}
      <WorkspaceHeader entry={entry} rightTab={layout.rightTab} setRightTab={layout.setRightTab} onClose={onClose} onSecurityScan={async () => dialogService.alert("Report", <MarkdownRenderer content={await analyzeSecurity(entry.files, "Check")} />)} onPublish={() => publishToGitHub(entry, 'app', settings.githubToken!, false).then(u => window.open(u))} onDownload={() => toast.success("Downloading...")} onRefresh={layout.refreshPreview} totalUsage={totalUsage} saveStatus={saveStatus} isMobile={isMobile} mobileView={layout.mobileView} setMobileView={layout.setMobileView} />
      
      <div className="flex-1 flex overflow-hidden">
        {isMobile ? (
          <div className="w-full h-full">
            {layout.mobileView === 'chat' && <div className="h-full">{ChatContent}</div>}
            {layout.mobileView === 'panel' && (layout.rightTab ? <div className="h-full flex flex-col bg-slate-100">{RightPanelContent}</div> : <div className="p-8 text-center text-slate-400">Select a panel to view.</div>)}
          </div>
        ) : (
          <>
            <div style={{ width: layout.isChatCollapsed ? '48px' : (layout.rightTab ? layout.chatPanelWidth : '100%'), flexShrink: 0 }} className="h-full relative transition-all duration-300 ease-in-out">
                {layout.isChatCollapsed ? (
                    <div className="h-full flex items-center justify-center bg-slate-50 border-r border-slate-200">
                         <button onClick={layout.toggleChatCollapse} className="p-2 rounded-full hover:bg-slate-200 text-slate-500" title="Expand Chat">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                         </button>
                    </div>
                ) : (
                    ChatContent
                )}
            </div>
            
            {layout.rightTab && !layout.isChatCollapsed && (
                <div onMouseDown={handleMouseDown} className={`w-1.5 cursor-col-resize bg-slate-200 transition-colors group relative ${isResizing.current ? 'bg-indigo-400' : 'hover:bg-indigo-300'}`}>
                   <button onClick={layout.toggleChatCollapse} className="absolute top-1/2 -translate-y-1/2 -left-2.5 z-10 w-5 h-8 bg-white border border-slate-300 rounded-sm shadow-md flex items-center justify-center text-slate-500 hover:bg-indigo-50 hover:border-indigo-200 opacity-0 group-hover:opacity-100 transition-opacity" title="Collapse Chat">
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                   </button>
                </div>
            )}

            {layout.rightTab && (
              <div className="flex-1 flex flex-col bg-slate-100 min-w-0" data-tour="workspace-panel">
                  {RightPanelContent}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};