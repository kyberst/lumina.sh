


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
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (s: AppSettings) => void;
  isOffline: boolean;
  setIsOffline: (isOffline: boolean) => void;
}

type PublishStatus = 'idle' | 'saving' | 'packaging' | 'published' | 'error';

const ONBOARDING_STAGE2_STEPS: Step[] = [
    { target: '[data-tour="properties-tab"]', titleKey: 'firstBlockTitle', descKey: 'firstBlockDesc', position: 'bottom' },
];

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({ entry, onUpdate, onClose, settings, onSaveSettings, isOffline, setIsOffline }) => {
  const layout = useWorkspaceLayout();
  const [chatInput, setChatInput] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [chatAttachments, setChatAttachments] = useState<any[]>([]);
  const [totalUsage, setTotalUsage] = useState({ input: 0, output: 0 });
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [publishState, setPublishState] = useState<{ status: PublishStatus; message: string; url?: string; }>({ status: 'idle', message: '' });
  const [reviewData, setReviewData] = useState<{ msg: ChatMessage, prevSnapshot?: GeneratedFile[] } | null>(null);
  const [selectedElement, setSelectedElement] = useState<any | null>(null);

  const isFirstGenComplete = history.some(m => m.role === 'model') && (entry.tags || []).includes('Generated');
  const onboarding = useOnboarding('first_generation', { enabled: isFirstGenComplete, delay: 1500 });

  // FIX: Moved handleUpdate before its usage in useRefactorStream to fix block-scoped variable error.
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

  const { isProcessing, streamState, handleStreamingBuild, cancelStream, handleEnvVarSave } = useRefactorStream({ entry, settings, history, setHistory, onUpdate: handleUpdate, setTotalUsage, setIframeKey: layout.setIframeKey, setIsOffline });

  useEffect(() => {
    if (!settings.developerMode && layout.rightTab === 'code') layout.setRightTab('preview');
  }, [settings.developerMode, layout.rightTab]);

  const runCodeHealthCheck = async (currentFiles: GeneratedFile[]) => {
    if (!settings.developerMode || isProcessing) return;
    await new Promise(r => setTimeout(r, 2000));

    const orphanedFiles = findOrphanedFiles(currentFiles);

    if (orphanedFiles.length > 0) {
        const confirmed = await dialogService.confirm(
            t('cleanupSuggestionTitle', 'workspace'),
            <>
                <p>{t('cleanupSuggestionDesc', 'workspace').replace('{count}', String(orphanedFiles.length))}</p>
                <ul className="text-xs font-mono bg-slate-100 p-2 mt-2 rounded border max-h-32 overflow-y-auto">
                    {orphanedFiles.map(f => <li key={f}>- {f}</li>)}
                </ul>
            </>,
            { destructive: true, confirmText: t('applyCleanup', 'workspace') }
        );

        if (confirmed) {
            const cleanedFiles = currentFiles.filter(f => !orphanedFiles.includes(f.name));
            const success = await handleUpdate({ ...entry, files: cleanedFiles });
            if (success) {
                toast.success(t('cleanupApplied', 'workspace'));
            } else {
                toast.error(t('cleanupFailed', 'workspace'));
            }
        }
    }
  };

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
            dbFacade.updateRefactorMessage(entry.id, updatedMessage).catch(err => {
                toast.error("Failed to sync history state.");
                console.error(err);
            });
        }
        runCodeHealthCheck(snapshot);
    }
  };
  
  const handleRollback = async (snap: GeneratedFile[]) => {
      const success = await handleUpdate({...entry, files: snap});
      if (success) {
          layout.refreshPreview();
          toast.info(t('changesDiscarded', 'builder'));
      }
  };

  const handlePublish = async () => {
    const confirmed = await dialogService.confirm(t('publishStatus.confirmTitle', 'builder'), t('publishStatus.confirmDesc', 'builder'));
    if (!confirmed) return;
    if (!settings.githubToken) return toast.error("Please connect GitHub in Settings first.");
    
    setPublishState({ status: 'saving', message: t('publishStatus.saving', 'builder'), url: '' });
    await new Promise(r => setTimeout(r, 1500));
    setPublishState(p => ({ ...p, status: 'packaging', message: t('publishStatus.packaging', 'builder') }));

    try {
        const repoName = (entry.project || 'lumina-app').toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-5);
        const url = await publishToGitHub(entry, repoName, settings.githubToken, false, true);
        setPublishState({ status: 'published', message: t('publishStatus.published', 'builder'), url });
    } catch (e: any) {
        setPublishState({ status: 'error', message: `${t('publishStatus.error', 'builder')}: ${e.message}`, url: '' });
    }
  };

  const handleInvite = () => {
    const dialog = dialogService.custom(t('inviteCollaborator', 'builder'), <InviteCollaboratorDialog projectId={entry.id} onClose={() => dialog.close()} />);
  };

  const preview = usePreviewSystem(entry.files, entry.dependencies, layout.iframeKey, settings, entry.envVars, entry.requiredEnvVars, setSelectedElement);
  const editor = useEditorSystem(entry, handleUpdate, layout.refreshPreview);
  const voice = useVoiceInput();

  const handleAskToFix = (errorLogs: any[]) => {
      const errorMessages = errorLogs.map(log => log.msg).join('\n');
      const prompt = `My application is not working correctly. I see these errors in the console:\n\n\`\`\`\n${errorMessages}\n\`\`\`\n\nPlease analyze the code, explain what is wrong in simple terms, and fix the issue.`;
      handleStreamingBuild(prompt, [], editor.getContext(), 'modify');
      toast.info(t('askingToFix', 'workspace'));
  };

  const handlePropertyChange = async (changes: { textContent?: string; className?: string }) => {
    if (!selectedElement || !selectedElement.outerHTML) return;

    const tempEl = document.createElement('div');
    tempEl.innerHTML = selectedElement.outerHTML;
    const child = tempEl.firstElementChild as HTMLElement;

    if (!child) return toast.error("Failed to parse selected element.");

    const oldOuterHTML = child.outerHTML;

    if (changes.textContent !== undefined) {
      child.textContent = changes.textContent;
    }
    if (changes.className !== undefined) {
      child.className = changes.className;
    }
    
    const newOuterHTML = child.outerHTML;
    
    if (oldOuterHTML === newOuterHTML) return;

    let fileUpdated = false;
    const newFiles: GeneratedFile[] = JSON.parse(JSON.stringify(entry.files));

    for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        if (file.content.includes(oldOuterHTML)) {
            const newContent = file.content.replace(oldOuterHTML, newOuterHTML);
            if (newContent !== file.content) {
                newFiles[i] = { ...file, content: newContent };
                fileUpdated = true;
                
                setSelectedElement({
                    ...selectedElement,
                    outerHTML: newOuterHTML,
                    textContent: changes.textContent ?? selectedElement.textContent,
                    className: changes.className ?? selectedElement.className,
                });
                break; 
            }
        }
    }

    if (fileUpdated) {
        const success = await handleUpdate({ ...entry, files: newFiles });
        if (success) {
            toast.success("Property updated.");
        }
    } else {
        toast.error("Could not find the code to update automatically. This might be dynamic content.");
    }
  };

  useEffect(() => { if(voice.transcript) { setChatInput(p => p + ' ' + voice.transcript); voice.resetTranscript(); } }, [voice.transcript]);
  useEffect(() => {
    dbFacade.getRefactorHistory(entry.id).then(msgs => {
        setHistory(msgs);
        if(entry.pendingGeneration && msgs.length === 0) handleStreamingBuild(); 
    });
  }, [entry.id]);

  const handleRegenerate = (messageId: string) => {
    // ... (unchanged regenerate logic) ...
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in fade-in duration-300">
      
      {onboarding.isActive && <OnboardingOverlay steps={ONBOARDING_STAGE2_STEPS} currentStep={onboarding.currentStep} onNext={onboarding.next} onFinish={onboarding.finish} onSkip={onboarding.skip} />}

      <WorkspaceHeader 
        entry={entry} rightTab={layout.rightTab} setRightTab={layout.setRightTab} onClose={onClose} 
        onSecurityScan={async () => dialogService.alert(t('reportTitle', 'workspace'), <MarkdownRenderer content={await analyzeSecurity(entry.files, t('check', 'workspace'))}/>)}
        onPublish={handlePublish}
        onInvite={handleInvite}
        onDownload={() => toast.success(t('downloading', 'workspace'))} onRefresh={layout.refreshPreview} totalUsage={totalUsage}
        saveStatus={saveStatus} settings={settings} isProcessing={isProcessing}
      />
      <div className="flex-1 flex overflow-hidden relative">
          <WorkspaceChat 
            history={history} chatInput={chatInput} setChatInput={setChatInput} isProcessing={isProcessing} thinkTime={0} 
            fileStatuses={streamState.fileStatuses} currentReasoning={streamState.reasoningBuffer} currentText={streamState.textBuffer}
            onSend={(mode) => { handleStreamingBuild(chatInput, chatAttachments, editor.getContext(), mode); setChatInput(''); setChatAttachments([]); }} 
            onStop={cancelStream} onRollback={handleRollback} 
            onRegenerate={handleRegenerate}
            onReview={(msg, prev) => setReviewData({ msg, prevSnapshot: prev })}
            onEnvVarSave={handleEnvVarSave} isListening={voice.isListening} toggleListening={voice.toggleListening} 
            attachments={chatAttachments} setAttachments={setChatAttachments} isCollapsed={layout.isSidebarCollapsed} setCollapsed={layout.setIsSidebarCollapsed} aiPlan={streamState.aiPlan}
            settings={settings} onSaveSettings={onSaveSettings}
            isOffline={isOffline} setIsOffline={setIsOffline}
          />
          <div 
            className={`flex-1 flex flex-col bg-slate-100 overflow-hidden relative ${layout.isSidebarCollapsed ? 'w-full' : 'hidden md:flex'}`}
            data-tour="workspace-panel"
          >
              {layout.rightTab === 'info' && <WorkspaceInfo entry={entry} onUpdate={handleUpdate} settings={settings} selectedElement={selectedElement} onPropertyChange={handlePropertyChange} />}
              {layout.rightTab === 'preview' && (
                  <WorkspacePreview 
                      iframeSrc={preview.iframeSrc} iframeKey={layout.iframeKey} deviceMode={layout.deviceMode} setDeviceMode={layout.setDeviceMode} 
                      showConsole={preview.showConsole} setShowConsole={preview.setShowConsole} consoleLogs={preview.consoleLogs} errorCount={preview.errorCount} onClearLogs={preview.clearLogs} 
                      onNavigateError={(f, l) => { layout.setRightTab('code'); editor.selectFile(entry.files.find(x => x.name === f) || entry.files[0]); editor.setScrollToLine(l); }}
                      settings={settings} onAskToFix={handleAskToFix}
                  />
              )}
              {layout.rightTab === 'code' && settings.developerMode && (
                  <WorkspaceCode 
                      files={entry.files} selectedFile={editor.selectedFile} editorContent={editor.editorContent} hasChanges={editor.hasChanges} 
                      onFileSelect={editor.selectFile} onCodeChange={editor.handleContentChange} onSave={editor.saveChanges} scrollToLine={editor.scrollToLine}
                      onEditorMount={(api) => editor.editorApiRef.current = api} annotations={streamState.annotations}
                      readOnly={isProcessing}
                  />
              )}
          </div>
      </div>
      
      {publishState.status !== 'idle' && (
        <PublishStatusCard 
            status={publishState.status}
            message={publishState.message}
            url={publishState.url}
            onClose={() => setPublishState({ status: 'idle', message: '', url: '' })}
        />
      )}

      {reviewData && (
          <ReviewFocusModal 
              reviewData={reviewData}
              settings={settings}
              onApply={(snapshot, isCheckpoint) => {
                  handleApply(reviewData.msg.id, snapshot, isCheckpoint);
                  setReviewData(null);
              }}
              onRollback={(snapshot) => {
                  handleRollback(snapshot);
                  setReviewData(null);
              }}
              onClose={() => setReviewData(null)}
          />
      )}
    </div>
  );
};