import { useState, useEffect, useCallback, useRef } from 'react';
import { JournalEntry, ChatMessage, AppSettings, GeneratedFile } from '../../../types';
import { analyzeSecurity } from '../../../services/geminiService';
import { publishToGitHub } from '../../../services/githubService';
import { dbFacade } from '../../../services/dbFacade';
import { toast } from '../../../services/toastService';
import { dialogService } from '../../../services/dialogService';
import { useVoiceInput } from '../../../hooks/useVoiceInput';
import { useRefactorStream } from './useRefactorStream';
import { useOnboarding } from '../../../hooks/useOnboarding';
import { useWorkspaceLayout } from './useWorkspaceLayout';
import { usePreviewSystem } from './usePreviewSystem';
import { useEditorSystem } from './useEditorSystem';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { t } from '../../../services/i18n';

export type WorkspaceHookReturn = ReturnType<typeof useWorkspaceLogic>;

export const useWorkspaceLogic = (props: { entry: JournalEntry; onUpdate: (e: JournalEntry) => Promise<void>; onClose: () => void; settings: AppSettings; }) => {
  const { entry, onUpdate, settings } = props;
  const layout = useWorkspaceLayout();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [chatInput, setChatInput] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [chatAttachments, setChatAttachments] = useState<any[]>([]);
  const [totalUsage, setTotalUsage] = useState({ input: 0, output: 0 });
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [isResizing, setIsResizing] = useState(false);
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [editorPanel, setEditorPanel] = useState({ isOpen: false, selector: null as string | null });
  const [chatContextSelectors, setChatContextSelectors] = useState<string[]>([]);
  const [activeModel, setActiveModel] = useState<string>(entry.envVars?._INIT_MODEL || settings.aiModel || 'flash');
  const [thinkTime, setThinkTime] = useState(0);
  const timerRef = useRef<any>(null);
  const onboarding = useOnboarding();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleTurnComplete = async (data: any) => {
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
  const stream = useRefactorStream({ entry, settings: { ...settings, aiModel: activeModel as any }, history, setHistory, onTurnComplete: handleTurnComplete, setTotalUsage, setIframeKey: layout.setIframeKey });

  useEffect(() => {
    if (stream.isProcessing) {
      setThinkTime(0);
      timerRef.current = setInterval(() => setThinkTime(t => t + 0.1), 100);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [stream.isProcessing]);

  useEffect(() => { if (voice.transcript) { setChatInput(p => p + ' ' + voice.transcript); voice.resetTranscript(); } }, [voice.transcript]);
  
  useEffect(() => {
    let isMounted = true;
    if (entry.projects_id) {
        dbFacade.getRefactorHistory(entry.projects_id).then(msgs => { if (isMounted) setHistory(msgs); });
    }
    return () => { isMounted = false; };
  }, [entry.projects_id]);

  useEffect(() => { if (entry.pendingGeneration && history.length > 0 && history.length <= 1 && !stream.isProcessing) stream.handleStreamingBuild(); }, [entry.pendingGeneration, history, stream.isProcessing]);
  
  const toggleSelectionMode = useCallback((force?: boolean) => {
    const newMode = force ?? !isSelectionModeActive;
    setIsSelectionModeActive(newMode);
    iframeRef.current?.contentWindow?.postMessage({ type: 'TOGGLE_SELECTION_MODE', active: newMode }, '*');
  }, [isSelectionModeActive]);

  const handleSend = () => {
      const msg: ChatMessage = { refactor_history_id: crypto.randomUUID(), role: 'user', text: chatInput, timestamp: Date.now(), attachments: chatAttachments, pending: true };
      setHistory(prev => [...prev, msg]);
      const inp = chatInput; const atts = chatAttachments;
      setChatInput(''); setChatAttachments([]);
      stream.handleStreamingBuild(inp, atts, editor.getContext(), msg);
  };

  const handleRevert = async (refactor_history_id: string) => {
    const ok = await dialogService.confirm(t('dialog.revertTitle', 'builder'), t('dialog.revertDesc', 'builder'), { destructive: true });
    if (!ok) return;
    const idx = history.findIndex(m => m.refactor_history_id === refactor_history_id);
    if (idx < 1) return;
    await dbFacade.revertToSnapshot(entry.projects_id, history[idx-1].snapshot!, history[idx-1].timestamp);
    const updated = await dbFacade.getProjectById(entry.projects_id);
    if (updated) { await onUpdate(updated); setHistory(await dbFacade.getRefactorHistory(entry.projects_id)); layout.refreshPreview(); }
  };

  const onboardingProps = {
    isActive: onboarding.isActive, currentStep: onboarding.currentStep, onNext: onboarding.next, onFinish: onboarding.finish, onSkip: onboarding.skip,
    steps: [
        { target: '[data-tour="chat-input"]', titleKey: 'chatTitle', descKey: 'chatDesc', position: 'top' as const },
        { target: '[data-tour="workspace-panel"]', titleKey: 'panelTitle', descKey: 'panelDesc', position: 'left' as const }
    ]
  };

  const chatProps = {
    history, chatInput, setChatInput, isProcessing: stream.isProcessing, thinkTime, fileStatuses: stream.streamState.fileStatuses,
    currentReasoning: stream.streamState.reasoningBuffer, currentText: stream.streamState.textBuffer, onSend: handleSend,
    onStop: stream.cancelStream, onEnvVarSave: (v: any) => onUpdate({ ...entry, envVars: { ...entry.envVars, ...v } }),
    isListening: voice.isListening, toggleListening: voice.toggleListening, attachments: chatAttachments, setAttachments: setChatAttachments,
    aiPlan: stream.streamState.aiPlan, suggestions: stream.streamState.suggestions, onRevert: handleRevert, chatContextSelectors,
    onUseSelectorsInChat: () => { setChatInput(prev => prev + " " + chatContextSelectors.join(", ")); toggleSelectionMode(false); },
    onRemoveSelector: (s: string) => setChatContextSelectors(p => p.filter(x => x !== s)), onClearSelectors: () => setChatContextSelectors([]),
    selectedModel: activeModel, onModelChange: setActiveModel, availableModels: [{ id: 'flash', name: 'Gemini Flash (Fast)' }, { id: 'pro', name: 'Gemini Pro (Smart)' }]
  };

  const previewProps = {
    iframeSrc: preview.iframeSrc, iframeKey: layout.iframeKey, deviceMode: layout.deviceMode, setDeviceMode: layout.setDeviceMode,
    showConsole: preview.showConsole, setShowConsole: preview.setShowConsole, consoleLogs: preview.consoleLogs, errorCount: preview.errorCount,
    onClearLogs: preview.clearLogs, iframeRef: preview.iframeRef, isSelectionModeActive, onToggleSelectionMode: toggleSelectionMode
  };

  const codeProps = {
    files: entry.files || [], selectedFile: editor.selectedFile, editorContent: editor.editorContent, hasChanges: editor.hasChanges,
    onFileSelect: editor.selectFile, onCodeChange: editor.handleContentChange, onSave: editor.saveChanges, scrollToLine: editor.scrollToLine,
    onEditorMount: (api: any) => { editor.editorApiRef.current = api; }, annotations: stream.streamState.annotations
  };

  const headerProps = {
    entry, rightTab: layout.rightTab, setRightTab: layout.setRightTab, totalUsage, saveStatus, isMobile, mobileView: layout.mobileView
  };

  return {
    entry, onUpdate, onClose: props.onClose, layout, 
    editor: { ...editor, codeProps }, 
    preview: { ...preview, previewProps }, 
    voice, stream,
    state: { history, chatInput, chatAttachments, totalUsage, saveStatus, isResizing, isSelectionModeActive, editorPanel, chatContextSelectors, activeModel, isMobile, onboarding: onboardingProps, chatProps, headerProps },
    handlers: {
        setChatInput, setChatAttachments, handleSend, setActiveModel, setEditorPanel,
        handleSendFromPanel: (p: string) => { setChatInput(p); setTimeout(handleSend, 0); setEditorPanel({ isOpen: false, selector: null }); },
        handleApplyDirectStyle: async (sel: string, sty: any) => {}, handleRevert, handleSecurityScan: async () => {}, handlePublish: () => {}, handleDownload: () => {},
        handleResizeMouseDown: (e: React.MouseEvent) => { e.preventDefault(); setIsResizing(true); },
        handleNavigateError: (f: string, l: number) => { layout.setRightTab('code'); editor.selectFile((entry.files ?? []).find(x => x.name === f)!); editor.setScrollToLine(l); },
        handleUseSelectorsInChat: () => { setChatInput(prev => prev + " " + chatContextSelectors.join(", ")); toggleSelectionMode(false); },
        handleRemoveSelector: (s: string) => setChatContextSelectors(p => p.filter(x => x !== s)),
        handleClearSelectors: () => setChatContextSelectors([]),
        handleEnvVarSave: (v: any) => onUpdate({ ...entry, envVars: { ...entry.envVars, ...v } })
    }
  };
};