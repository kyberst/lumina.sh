import React from 'react';
import { WorkspaceHeader } from './components/WorkspaceHeader';
import { WorkspaceChat } from './components/WorkspaceChat';
import { WorkspacePreview } from './components/WorkspacePreview';
import { WorkspaceCode } from './components/WorkspaceCode';
import { WorkspaceInfo } from './components/WorkspaceInfo';
import { WorkspaceHistory } from './components/WorkspaceHistory';
import { WorkspaceSecurity } from './components/WorkspaceSecurity';
import { WorkspacePublish } from './components/WorkspacePublish';
import { ElementEditorPanel } from './components/editor/ElementEditorPanel';
import { OnboardingOverlay } from '../../components/ui/OnboardingOverlay';
import { WorkspaceHookReturn } from './hooks/useWorkspaceLogic';
import { t } from '../../services/i18n';

export const WorkspaceViewPresentation: React.FC<WorkspaceHookReturn> = (props) => {
  const { layout, editor, preview, voice, stream, state, handlers } = props;

  const ChatContent = (
    <div className="relative h-full w-full">
        {state.editorPanel.isOpen && state.editorPanel.selector && (
            <ElementEditorPanel 
                selector={state.editorPanel.selector}
                initialValues={state.editorPanel.initialValues}
                onClose={() => handlers.setEditorPanel({ isOpen: false, selector: null })}
                onApplyAI={handlers.handleSendFromPanel}
                onApplyDirectly={handlers.handleApplyDirectStyle}
            />
        )}
        <WorkspaceChat 
            {...state.chatProps}
            statusOverride={stream.streamState.statusOverride} // New prop
            onSend={handlers.handleSend}
            onStop={stream.cancelStream}
            onEnvVarSave={handlers.handleEnvVarSave}
            isListening={voice.isListening}
            toggleListening={voice.toggleListening}
            onRevert={handlers.handleRevert}
            onUseSelectorsInChat={handlers.handleUseSelectorsInChat}
            onRemoveSelector={handlers.handleRemoveSelector}
            onClearSelectors={handlers.handleClearSelectors}
            onModelChange={handlers.setActiveModel}
        />
    </div>
  );
  
  const RightPanel = (
    <div className="flex-1 overflow-hidden relative h-full">
        {layout.rightTab === 'info' && <WorkspaceInfo entry={props.entry} onUpdate={props.onUpdate} />}
        {layout.rightTab === 'preview' && (
            <WorkspacePreview 
                {...preview.previewProps} 
                onNavigateError={handlers.handleNavigateError}
                consolePanelProps={state.consoleProps}
            />
        )}
        {layout.rightTab === 'code' && <WorkspaceCode {...editor.codeProps} readOnly={stream.isProcessing} />}
        {layout.rightTab === 'history' && <WorkspaceHistory history={state.history} onRevert={handlers.handleRevert} />}
        {layout.rightTab === 'publish' && <WorkspacePublish entry={props.entry} settings={props.settings} onUpdate={props.onUpdate} />}
        {layout.rightTab === 'security' && (
            <WorkspaceSecurity 
                report={state.security.report} 
                isScanning={state.security.isScanning} 
                onRunScan={handlers.handleSecurityScan} 
                onFixIssue={handlers.handleFixSecurityIssue}
                onCancelScan={handlers.handleCancelScan} 
            />
        )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in fade-in duration-300">
      {state.onboarding.isActive && <OnboardingOverlay {...state.onboarding} />}
      <WorkspaceHeader 
        {...state.headerProps}
        onClose={props.onClose} 
        onSecurityScan={handlers.handleSecurityScan} 
        onPublish={() => layout.setRightTab('publish')} 
        onDownload={handlers.handleDownload} 
        onRefresh={layout.refreshPreview} 
        setMobileView={layout.setMobileView}
      />
      <div className="flex-1 flex overflow-hidden">
        {state.isMobile ? (
          <div className="w-full h-full">
            {layout.mobileView === 'chat' ? ChatContent : RightPanel}
          </div>
        ) : (
          <>
            <div style={{ width: layout.isChatCollapsed ? '48px' : (layout.rightTab ? layout.chatPanelWidth : '100%'), flexShrink: 0 }} className="h-full relative transition-all duration-300 ease-in-out">
                {layout.isChatCollapsed ? (
                    <div className="h-full flex items-center justify-center bg-slate-50 border-r border-slate-200">
                         <button onClick={layout.toggleChatCollapse} className="p-2 rounded-full hover:bg-slate-200 text-slate-500" title="Expand Chat"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>
                    </div>
                ) : ChatContent}
            </div>
            {layout.rightTab && !layout.isChatCollapsed && (
                <div onMouseDown={handlers.handleResizeMouseDown} className={`w-1.5 cursor-col-resize bg-slate-200 transition-colors group relative ${state.isResizing ? 'bg-indigo-400' : 'hover:bg-indigo-300'}`}>
                   <button onClick={layout.toggleChatCollapse} className="absolute top-1/2 -translate-y-1/2 -left-2.5 z-10 w-5 h-8 bg-white border border-slate-300 rounded-sm shadow-md flex items-center justify-center text-slate-500 hover:bg-indigo-50 hover:border-indigo-200 opacity-0 group-hover:opacity-100 transition-opacity" title="Collapse Chat"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
                </div>
            )}
            {layout.rightTab && <div className="flex-1 flex flex-col bg-slate-100 min-w-0" data-tour="workspace-panel">{RightPanel}</div>}
          </>
        )}
      </div>
    </div>
  );
};