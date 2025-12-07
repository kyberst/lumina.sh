
import React, { useState, useEffect } from 'react';
import { JournalEntry, ChatMessage, AppSettings } from '../../types';
import { analyzeSecurity } from '../../services/geminiService';
import { publishToGitHub } from '../../services/githubService';
import { dbFacade } from '../../services/dbFacade';
import { toast } from '../../services/toastService';
import { dialogService } from '../../services/dialogService';
import { MarkdownRenderer } from '../../components/ui/MarkdownRenderer';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useRefactorStream } from './hooks/useRefactorStream';

import { WorkspaceHeader } from './components/WorkspaceHeader';
import { WorkspaceChat } from './components/WorkspaceChat';
import { WorkspacePreview } from './components/WorkspacePreview';
import { WorkspaceCode } from './components/WorkspaceCode';
import { WorkspaceInfo } from './components/WorkspaceInfo';

import { useWorkspaceLayout } from './hooks/useWorkspaceLayout';
import { usePreviewSystem } from './hooks/usePreviewSystem';
import { useEditorSystem } from './hooks/useEditorSystem';

interface WorkspaceViewProps {
  entry: JournalEntry;
  onUpdate: (updatedEntry: JournalEntry) => void;
  onClose: () => void;
  settings: AppSettings;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({ entry, onUpdate, onClose, settings }) => {
  const layout = useWorkspaceLayout();
  const [chatInput, setChatInput] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [chatAttachments, setChatAttachments] = useState<any[]>([]);
  const [totalUsage, setTotalUsage] = useState({ input: 0, output: 0 });

  const handleUpdate = async (updatedEntry: JournalEntry) => {
      try { await onUpdate(updatedEntry); return true; } catch (e: any) { toast.error(e.message); return false; }
  };

  const preview = usePreviewSystem(entry.files, entry.dependencies, layout.iframeKey);
  const editor = useEditorSystem(entry, handleUpdate, layout.refreshPreview);
  const voice = useVoiceInput();
  
  const { isProcessing, streamState, handleStreamingBuild, cancelStream } = useRefactorStream({
      entry, settings, history, setHistory, onUpdate: handleUpdate, setTotalUsage, setIframeKey: layout.setIframeKey
  });

  useEffect(() => { if(voice.transcript) { setChatInput(p => p + ' ' + voice.transcript); voice.resetTranscript(); } }, [voice.transcript]);
  useEffect(() => {
    dbFacade.getRefactorHistory(entry.id).then(msgs => {
        setHistory(msgs);
        if(entry.pendingGeneration && msgs.length === 0) handleStreamingBuild(); 
    });
  }, [entry.id]);

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in fade-in duration-300">
      <WorkspaceHeader 
        entry={entry} rightTab={layout.rightTab} setRightTab={layout.setRightTab} onClose={onClose} 
        onSecurityScan={async () => dialogService.alert("Report", <MarkdownRenderer content={await analyzeSecurity(entry.files, "Check")}/>)}
        onPublish={() => publishToGitHub(entry, 'app', settings.githubToken!, false).then(u => window.open(u))}
        onDownload={() => toast.success("Downloading...")} onRefresh={layout.refreshPreview} totalUsage={totalUsage}
      />
      <div className="flex-1 flex overflow-hidden relative">
          <WorkspaceChat 
            history={history} chatInput={chatInput} setChatInput={setChatInput} isProcessing={isProcessing} thinkTime={0} 
            fileStatuses={streamState.fileStatuses} currentReasoning={streamState.reasoningBuffer} currentText={streamState.textBuffer}
            onSend={() => { handleStreamingBuild(chatInput, chatAttachments, editor.getContext()); setChatInput(''); setChatAttachments([]); }} 
            onStop={cancelStream} onRollback={async (snap) => { await handleUpdate({...entry, files: snap}); layout.refreshPreview(); }} 
            onEnvVarSave={(v) => handleUpdate({...entry, envVars: {...entry.envVars, ...v}})} isListening={voice.isListening} toggleListening={voice.toggleListening} 
            attachments={chatAttachments} setAttachments={setChatAttachments} isCollapsed={layout.isSidebarCollapsed} setCollapsed={layout.setIsSidebarCollapsed} aiPlan={streamState.aiPlan}
          />
          <div className={`flex-1 flex flex-col bg-slate-100 overflow-hidden relative ${layout.isSidebarCollapsed ? 'w-full' : 'hidden md:flex'}`}>
              {layout.rightTab === 'info' && <WorkspaceInfo entry={entry} onUpdate={handleUpdate} />}
              {layout.rightTab === 'preview' && (
                  <WorkspacePreview 
                      iframeSrc={preview.iframeSrc} iframeKey={layout.iframeKey} deviceMode={layout.deviceMode} setDeviceMode={layout.setDeviceMode} 
                      showConsole={preview.showConsole} setShowConsole={preview.setShowConsole} consoleLogs={preview.consoleLogs} errorCount={preview.errorCount} onClearLogs={preview.clearLogs} 
                      onNavigateError={(f, l) => { layout.setRightTab('code'); editor.selectFile(entry.files.find(x => x.name === f) || entry.files[0]); editor.setScrollToLine(l); }}
                  />
              )}
              {layout.rightTab === 'code' && (
                  <WorkspaceCode 
                      files={entry.files} selectedFile={editor.selectedFile} editorContent={editor.editorContent} hasChanges={editor.hasChanges} 
                      onFileSelect={editor.selectFile} onCodeChange={editor.handleContentChange} onSave={editor.saveChanges} scrollToLine={editor.scrollToLine}
                      onEditorMount={(api) => editor.editorApiRef.current = api} annotations={streamState.annotations}
                      readOnly={isProcessing}
                  />
              )}
          </div>
      </div>
    </div>
  );
};
