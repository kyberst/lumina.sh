import { useState, useEffect, useRef } from 'react';
import { useVoiceInput } from '../../../hooks/useVoiceInput';
import { useRefactorStream } from './useRefactorStream';
import { useOnboarding } from '../../../hooks/useOnboarding';
import { useWorkspaceLayout } from './useWorkspaceLayout';
import { usePreviewSystem } from './usePreviewSystem';
import { useEditorSystem } from './useEditorSystem';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { toast } from '../../../services/toastService';
import { analyzeSecurity } from '../../../services/geminiService';
import { useWorkspaceHandlers } from './useWorkspaceHandlers';
import { useWorkspaceHistory } from './useWorkspaceHistory';

/**
 * Hook that orchestrates the workspace state and logic.
 */
export const useWorkspaceLogic = (props: any) => {
  const { entry, onUpdate, settings } = props;
  const layout = useWorkspaceLayout();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [chatInput, setChatInput] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isIntegrityChecking, setIsIntegrityChecking] = useState(false);
  const [chatAttachments, setChatAttachments] = useState<any[]>([]);
  const [activeModel, setActiveModel] = useState(entry.envVars?._INIT_MODEL || settings.aiModel || 'flash');
  const [activeProvider, setActiveProvider] = useState(entry.envVars?._INIT_PROVIDER || 'gemini');
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [editorPanel, setEditorPanel] = useState({ isOpen: false, selector: null, initialValues: null } as any);
  const [chatContextSelectors, setChatContextSelectors] = useState<{ selector: string; styles?: any }[]>([]);
  const [selectedLogs, setSelectedLogs] = useState<any[]>([]);
  const [security, setSecurity] = useState({ report: null, isScanning: false } as any);
  const [isResizing, setIsResizing] = useState(false);
  const onboarding = useOnboarding();
  const securityAbortRef = useRef<AbortController | null>(null);

  const preview = usePreviewSystem(entry.files ?? [], entry.dependencies, layout.iframeKey, entry.envVars, entry.requiredEnvVars);
  const editor = useEditorSystem(entry, (e: any) => onUpdate(e).then(() => true), layout.refreshPreview);
  const stream = useRefactorStream({ entry, settings: { ...settings, aiModel: activeModel, activeProviderId: activeProvider }, history, setHistory, onTurnComplete: (d: any) => onUpdate(d.updatedEntry), setIframeKey: layout.setIframeKey });
  const voice = useVoiceInput();

  useWorkspaceHistory(entry, onUpdate, setHistory, setIsHistoryLoading, setIsIntegrityChecking);
  const handlersBase = useWorkspaceHandlers(entry, onUpdate, layout, editor, stream, history, setHistory, setEditorPanel, isMobile);

  // TRIGGER: Automatic initial generation for new projects
  useEffect(() => {
    if (!isHistoryLoading && entry.pendingGeneration && !stream.isProcessing && history.length > 0) {
        // We trigger the build. useRefactorStream already handles reading entry.prompt 
        // if no message is passed to handleStreamingBuild.
        stream.handleStreamingBuild();
    }
  }, [isHistoryLoading, entry.pendingGeneration, history.length]);

  useEffect(() => {
    const handler = (e: any) => {
      if (e.data?.type === 'ELEMENT_SELECTED_FOR_CHAT') {
        setChatContextSelectors(prev => prev.find(i => i.selector === e.data.selector) ? prev : [...prev, { selector: e.data.selector, styles: e.data.styles }]);
      }
      if (e.data?.type === 'ELEMENT_SELECTED_FOR_EDIT') {
        setEditorPanel({ isOpen: true, selector: e.data.selector, initialValues: e.data.styles });
        setIsSelectionModeActive(false);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleSend = (p?: string) => {
    const text = p || chatInput; if (!text.trim()) return;
    const msg = { refactor_history_id: crypto.randomUUID(), role: 'user', text, timestamp: Date.now(), attachments: chatAttachments, pending: true, contextLogs: selectedLogs, contextElements: chatContextSelectors.map(s => s.selector) };
    setHistory(prev => [...prev, msg]);
    stream.handleStreamingBuild(text, chatAttachments, editor.getContext(), msg, selectedLogs);
    setChatInput(''); setChatAttachments([]); setSelectedLogs([]); setChatContextSelectors([]);
  };

  const handleSecurityScan = async () => {
    if (security.isScanning) return;
    layout.setRightTab('security');
    setSecurity({ ...security, isScanning: true });
    securityAbortRef.current = new AbortController();
    try {
      const r = await analyzeSecurity(entry.files, "Standard Audit", securityAbortRef.current.signal);
      setSecurity({ report: r, isScanning: false });
    } catch (e: any) {
      if (e.message !== "Scan Cancelled") toast.error("Scan Failed: " + e.message);
      setSecurity({ ...security, isScanning: false });
    }
  };

  const handleCancelScan = () => {
    if (securityAbortRef.current) {
      securityAbortRef.current.abort();
      setSecurity({ ...security, isScanning: false });
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    const startX = e.pageX;
    const startWidth = layout.chatPanelWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.pageX - startX;
      const newWidth = Math.max(300, Math.min(window.innerWidth - 300, startWidth + delta));
      layout.setChatPanelWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const headerProps = { 
    entry, 
    rightTab: layout.rightTab, 
    setRightTab: layout.setRightTab, 
    saveStatus: 'saved' as const, 
    isMobile, 
    mobileView: layout.mobileView, 
    isScanningSecurity: security.isScanning, 
    hasFiles: (entry.files?.length ?? 0) > 0, 
    onRefresh: layout.refreshPreview, 
    onSecurityScan: handleSecurityScan, 
    onPublish: () => handlersBase.handlePublish(settings), 
    onDownload: handlersBase.handleDownload 
  };

  const chatProps = { 
    history, 
    chatInput, 
    setChatInput, 
    isProcessing: stream.isProcessing, 
    isHistoryLoading, 
    isIntegrityChecking, 
    thinkTime: 0, 
    fileStatuses: stream.streamState.fileStatuses, 
    currentReasoning: stream.streamState.reasoningBuffer, 
    currentText: stream.streamState.textBuffer, 
    attachments: chatAttachments, 
    setAttachments: setChatAttachments, 
    aiPlan: stream.streamState.aiPlan, 
    suggestions: stream.streamState.suggestions, 
    chatContextSelectors: chatContextSelectors.map(x => x.selector), 
    selectedModel: activeModel, 
    availableModels: activeProvider === 'gemini' 
        ? [
            { id: '2.5-pro', name: 'Gemini 2.5 Pro' },
            { id: '2.5-flash', name: 'Gemini 2.5 Flash' },
            { id: '2.5-lite', name: 'Gemini 2.5 Lite' },
            { id: 'pro', name: 'Gemini 3 Pro' }, 
            { id: 'flash', name: 'Gemini 3 Flash' }
          ]
        : (settings.customProviders?.find((p: any) => p.id === activeProvider)?.models || []), 
    onSend: handleSend, 
    onStop: handlersBase.handleStop, 
    onEnvVarSave: (v: any) => onUpdate({ ...entry, envVars: { ...entry.envVars, ...v } }), 
    onRevert: handlersBase.handleRevert, 
    onUseSelectorsInChat: () => setChatInput(v => `Regarding ${chatContextSelectors.map(x => x.selector).join(', ')}: ` + v), 
    onRemoveSelector: (s: string) => setChatContextSelectors(p => p.filter(x => x.selector !== s)), 
    onClearSelectors: () => setChatContextSelectors([]), 
    onModelChange: setActiveModel, 
    selectedLogs: selectedLogs, 
    onRemoveLog: (id: string) => setSelectedLogs(p => p.filter(l => l.id !== id)),
    settings,
    selectedProvider: activeProvider,
    onProviderChange: setActiveProvider
  };

  const consoleProps = { 
    logs: preview.consoleLogs, 
    selectedLogs, 
    onToggleLog: (log: any) => setSelectedLogs(p => p.find(l => l.id === log.id) ? p.filter(l => l.id !== log.id) : [...p, log]), 
    onClose: () => preview.setShowConsole(false), 
    onNavigate: (file: string, line: number) => { 
      const f = entry.files?.find((x: any) => x.name === file); 
      if (f) { 
        layout.setRightTab('code'); 
        editor.selectFile(f); 
        setTimeout(() => editor.setScrollToLine(line), 100); 
      } 
    } 
  };

  const handlers = { 
    ...handlersBase, 
    setEditorPanel, 
    handleSend,
    handleSendFromPanel: (text: string) => { handleSend(text); setEditorPanel({ isOpen: false, selector: null }); },
    handleEnvVarSave: (v: any) => onUpdate({ ...entry, envVars: { ...entry.envVars, ...v } }),
    handleUseSelectorsInChat: () => setChatInput(v => `Regarding ${chatContextSelectors.map(x => x.selector).join(', ')}: ` + v),
    handleRemoveSelector: (s: string) => setChatContextSelectors(p => p.filter(x => x.selector !== s)),
    handleClearSelectors: () => setChatContextSelectors([]),
    setActiveModel,
    handleNavigateError: consoleProps.onNavigate,
    handleSecurityScan,
    handleFixSecurityIssue: (prompt: string) => handleSend(prompt),
    handleCancelScan,
    handleResizeMouseDown
  };

  return {
    layout, entry, onUpdate, onClose: props.onClose, settings, voice, stream,
    editor: { ...editor, codeProps: { files: entry.files ?? [], selectedFile: editor.selectedFile, editorContent: editor.editorContent, hasChanges: editor.hasChanges, onFileSelect: editor.selectFile, onCodeChange: editor.handleContentChange, onSave: editor.saveChanges, scrollToLine: editor.scrollToLine, onEditorMount: (api: any) => { editor.editorApiRef.current = api; }, annotations: stream.streamState.annotations } },
    preview: { ...preview, previewProps: { iframeSrc: preview.iframeSrc, iframeKey: layout.iframeKey, deviceMode: layout.deviceMode, setDeviceMode: layout.setDeviceMode, showConsole: preview.showConsole, setShowConsole: preview.setShowConsole, consoleLogs: preview.consoleLogs, errorCount: preview.errorCount, onClearLogs: preview.clearLogs, iframeRef: preview.iframeRef, isSelectionModeActive, onToggleSelectionMode: () => { const newState = !isSelectionModeActive; setIsSelectionModeActive(newState); preview.iframeRef.current?.contentWindow?.postMessage({ type: 'TOGGLE_SELECTION_MODE', active: newState }, '*'); } } },
    state: { isMobile, onboarding: { ...onboarding, onNext: onboarding.next, onFinish: onboarding.finish, onSkip: onboarding.skip, steps: [ { target: '[data-tour="chat-input"]', titleKey: 'chatTitle', descKey: 'chatDesc', position: 'top' as const }, { target: '[data-tour="workspace-panel"]', titleKey: 'panelTitle', descKey: 'panelDesc', position: 'left' as const } ] }, editorPanel, history, security, isResizing, headerProps, chatProps, consoleProps },
    handlers
  };
};

export type WorkspaceHookReturn = ReturnType<typeof useWorkspaceLogic>;
