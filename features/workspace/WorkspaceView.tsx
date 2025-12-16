
import React, { useState, useEffect } from 'react';
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
import { t } from '../../services/i18n';

import { WorkspaceHeader } from './components/WorkspaceHeader';
import { WorkspaceChat } from './components/WorkspaceChat';
import { WorkspacePreview } from './components/WorkspacePreview';
import { WorkspaceCode } from './components/WorkspaceCode';
import { WorkspaceInfo } from './components/WorkspaceInfo';
import { PublishStatusCard } from './components/PublishStatusCard';
import { InviteCollaboratorDialog } from './components/InviteCollaboratorDialog';
import { ReviewFocusModal } from './components/ReviewFocusModal';

import { useWorkspaceLayout } from './hooks/useWorkspaceLayout';
import { usePreviewSystem } from './hooks/usePreviewSystem';
import { useEditorSystem } from './hooks/useEditorSystem';
import { findOrphanedFiles } from './utils/codeHealth';

interface WorkspaceViewProps {
  entry: JournalEntry;
  onUpdate: (updatedEntry: JournalEntry) => void;
  onCloseWorkspace: () => void;
  settings: AppSettings;
  onSaveSettings: (s: AppSettings) => void;
  isOffline: boolean;
  setIsOffline: (isOffline: boolean) => void;
}

type PublishStatus = 'idle' | 'saving' | 'packaging' | 'published' | 'error';

const ONBOARDING_STAGE2_STEPS: Step[] = [
    { target: '[data-tour="properties-tab"]', titleKey: 'firstBlockTitle', descKey: 'firstBlockDesc', position: 'bottom' },
];

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({ entry, onUpdate, onCloseWorkspace, settings, onSaveSettings, isOffline, setIsOffline }) => {
  const layout = useWorkspaceLayout();
  const [chatInput, setChatInput] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [chatAttachments, setChatAttachments] = useState<any[]>([]);
  const [totalUsage, setTotalUsage] = useState({ input: 0, output: 0 });
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [publishState, setPublishState] = useState<{ status: PublishStatus; message: string; url?: string; }>({ status: 'idle', message: '' });
  const [reviewData, setReviewData] = useState<{ msg: ChatMessage, prevSnapshot?: GeneratedFile[] } | null>(null);
  const [selectedElement, setSelectedElement] = useState<any | null>(null);
  
  // Active Context Mapping (Selection)
  const [selectedContextFiles, setSelectedContextFiles] = useState<Set<string>>(new Set());

  // Initialize context with all files on load or file change
  useEffect(() => {
      setSelectedContextFiles(prev => {
          // If purely new load (size 0), select all. 
          // If files changed (add/delete), try to maintain selection but add new files by default.
          const newSet = new Set(prev);
          const currentNames = (entry.files || []).map(f => f.name);
          
          if (prev.size === 0) return new Set(currentNames);

          // Add new files automatically to context
          currentNames.forEach(name => {
              if (!prev.has(name) && !prev.has('__deleted__'+name)) newSet.add(name);
          });
          
          return newSet;
      });
  }, [(entry.files || []).length, entry.id]);

  const isFirstGenComplete = history.some(m => m.role === 'model') && (entry.tags || []).includes('Generated');
  const onboarding = useOnboarding('first_generation', { enabled: isFirstGenComplete, delay: 1500 });

  const handleUpdate = async (updatedEntry: JournalEntry) => {
      setSaveStatus('saving');
      try { 
          await onUpdate(updatedEntry); 
          setTimeout(() => setSaveStatus('saved'), 800);
          return true; 
      } catch (e: any) { 
          setSaveStatus('error');
          toast.error(e.message); 
          return false; 
      }
  };

  const { isProcessing, streamState, handleStreamingBuild, cancelStream, handleEnvVarSave } = useRefactorStream({ 
      entry, settings, history, setHistory, onUpdate: handleUpdate, setTotalUsage, setIframeKey: layout.setIframeKey, setIsOffline,
      // Pass setter to allow the AI (Guardrail) to auto-select files if user approves
      setSelectedContextFiles 
  });

  useEffect(() => {
    if (!settings.developerMode && layout.rightTab === 'code') layout.setRightTab('preview');
  }, [settings.developerMode, layout.rightTab]);

  const handleApply = async (messageId: string, snapshot: GeneratedFile[], isCheckpoint: boolean) => {
    const success = await handleUpdate({ ...entry, files: snapshot });
    if (success) {
        layout.refreshPreview();
        toast.success(t('changeApplied', 'builder'));
        const messageIndex = history.findIndex(m => m.id === messageId);
        if (messageIndex > -1) {
            const messageToUpdate = history[messageIndex];
            const updatedMessage: ChatMessage = { ...messageToUpdate, applied: true };
            if (isCheckpoint) {
                const userPromptMsg = history.slice(0, messageIndex).reverse().find(m => m.role === 'user');
                const promptSummary = userPromptMsg ? userPromptMsg.text.substring(0, 40) + '...' : 'Manual Checkpoint';
                updatedMessage.checkpointName = `${t('checkpoint', 'builder')}: "${promptSummary}"`;
                toast.success(t('checkpointSet', 'builder'));
            }
            setHistory(prev => prev.map(m => m.id === messageId ? updatedMessage : m));
            dbFacade.updateRefactorMessage(entry.id, updatedMessage).catch(err => { toast.error(t('errorSyncHistory', 'common')); console.error(err); });
        }
    }
  };
  
  const handleRollback = async (snap: GeneratedFile[]) => {
      const success = await handleUpdate({...entry, files: snap});
      if (success) { layout.refreshPreview(); toast.info(t('changesDiscarded', 'builder')); }
  };

  const handlePublish = async () => { /* ... existing publish logic ... */ };
  const handleInvite = () => { dialogService.custom(t('inviteCollaborator', 'builder'), <InviteCollaboratorDialog projectId={entry.id} onClose={() => dialogService.close()} />); };

  const preview = usePreviewSystem(entry.files, entry.dependencies, layout.iframeKey, settings, entry.envVars, entry.requiredEnvVars, setSelectedElement);
  const editor = useEditorSystem(entry, handleUpdate, layout.refreshPreview);
  const voice = useVoiceInput();

  const handleAskToFix = (errorLogs: any[]) => {
      const errorMessages = errorLogs.map(log => log.msg).join('\n');
      handleStreamingBuild(`Fix errors:\n\`\`\`\n${errorMessages}\n\`\`\``, [], editor.getContext(), 'modify', { allowedContextFiles: selectedContextFiles });
      toast.info(t('askingToFix', 'workspace'));
  };

  const handlePropertyChange = async (changes: { textContent?: string; className?: string }) => { /* ... existing prop logic ... */ };

  useEffect(() => { if(voice.transcript) { setChatInput(p => p + ' ' + voice.transcript); voice.resetTranscript(); } }, [voice.transcript]);
  useEffect(() => {
    dbFacade.getRefactorHistory(entry.id).then(msgs => {
        setHistory(msgs);
        if(entry.pendingGeneration && msgs.length === 0) handleStreamingBuild(); 
    });
  }, [entry.id]);

  const activeFilesForContextBar = settings.developerMode 
      ? (entry.files || []).filter(f => selectedContextFiles.has(f.name))
      : (entry.files || []);

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in fade-in duration-300">
      {onboarding.isActive && <OnboardingOverlay steps={ONBOARDING_STAGE2_STEPS} currentStep={onboarding.currentStep} onNext={onboarding.next} onFinish={onboarding.finish} onSkip={onboarding.skip} />}

      <WorkspaceHeader 
        entry={entry} rightTab={layout.rightTab} setRightTab={layout.setRightTab} onCloseWorkspace={onCloseWorkspace} 
        onSecurityScan={async () => dialogService.alert(t('reportTitle', 'workspace'), <MarkdownRenderer content={await analyzeSecurity(entry.files || [], t('check', 'workspace'))}/>)}
        onPublish={handlePublish} onInvite={handleInvite} onDownload={() => toast.success(t('downloading', 'workspace'))} onRefresh={layout.refreshPreview} totalUsage={totalUsage}
        saveStatus={saveStatus} settings={settings} isProcessing={isProcessing}
      />
      <div className="flex-1 flex overflow-hidden relative">
          <WorkspaceChat 
            history={history} chatInput={chatInput} setChatInput={setChatInput} isProcessing={isProcessing} thinkTime={0} 
            fileStatuses={streamState.fileStatuses} currentReasoning={streamState.reasoningBuffer} currentText={streamState.textBuffer}
            onSend={(mode) => { 
                handleStreamingBuild(chatInput, chatAttachments, editor.getContext(), mode, { allowedContextFiles: selectedContextFiles }); 
                setChatInput(''); setChatAttachments([]); 
            }} 
            onStop={cancelStream} onRollback={handleRollback} 
            onRegenerate={() => {}}
            onReview={(msg, prev) => setReviewData({ msg, prevSnapshot: prev })}
            onEnvVarSave={handleEnvVarSave} isListening={voice.isListening} toggleListening={voice.toggleListening} 
            attachments={chatAttachments} setAttachments={setChatAttachments} isCollapsed={layout.isSidebarCollapsed} setCollapsed={layout.setIsSidebarCollapsed} aiPlan={streamState.aiPlan}
            settings={settings} onSaveSettings={onSaveSettings}
            isOffline={isOffline} setIsOffline={setIsOffline}
            files={activeFilesForContextBar}
          />
          <div className={`flex-1 flex flex-col bg-slate-100 overflow-hidden relative ${layout.isSidebarCollapsed ? 'w-full' : 'hidden md:flex'}`} data-tour="workspace-panel">
              {layout.rightTab === 'info' && <WorkspaceInfo entry={entry} onUpdate={handleUpdate} settings={settings} selectedElement={selectedElement} onPropertyChange={handlePropertyChange} />}
              {layout.rightTab === 'preview' && (
                  <WorkspacePreview 
                      iframeSrc={preview.iframeSrc} iframeKey={layout.iframeKey} deviceMode={layout.deviceMode} setDeviceMode={layout.setDeviceMode} 
                      showConsole={preview.showConsole} setShowConsole={preview.setShowConsole} consoleLogs={preview.consoleLogs} errorCount={preview.errorCount} onClearLogs={preview.clearLogs} 
                      onNavigateError={(f, l) => { layout.setRightTab('code'); editor.selectFile((entry.files || []).find(x => x.name === f) || (entry.files || [])[0]); editor.setScrollToLine(l); }}
                      settings={settings} onAskToFix={handleAskToFix}
                  />
              )}
              {layout.rightTab === 'code' && settings.developerMode && (
                  <WorkspaceCode 
                      files={entry.files || []} selectedFile={editor.selectedFile} editorContent={editor.editorContent} hasChanges={editor.hasChanges} 
                      onFileSelect={editor.selectFile} onCodeChange={editor.handleContentChange} onSave={editor.saveChanges} scrollToLine={editor.scrollToLine}
                      onEditorMount={(api) => editor.editorApiRef.current = api} annotations={streamState.annotations}
                      readOnly={isProcessing}
                      contextFiles={selectedContextFiles}
                      toggleContextFile={(name) => setSelectedContextFiles(prev => { const n = new Set(prev); if(n.has(name)) n.delete(name); else n.add(name); return n; })}
                      setAllContextFiles={(all) => setSelectedContextFiles(all ? new Set((entry.files || []).map(f => f.name)) : new Set())}
                  />
              )}
          </div>
      </div>
      
      {publishState.status !== 'idle' && <PublishStatusCard status={publishState.status} message={publishState.message} url={publishState.url} onClose={() => setPublishState({ status: 'idle', message: '', url: '' })} />}
      {reviewData && <ReviewFocusModal reviewData={reviewData} settings={settings} onApply={(snapshot, isCheckpoint) => { handleApply(reviewData.msg.id, snapshot, isCheckpoint); setReviewData(null); }} onRollback={(snapshot) => { handleRollback(snapshot); setReviewData(null); }} onClose={() => setReviewData(null)} />}
    </div>
  );
};
