
import React from 'react';
import { JournalEntry, AppSettings } from '../../../../types';
import { useWorkspaceInfo } from './useWorkspaceInfo.hook';
import { WorkspaceInfoView } from './WorkspaceInfo.view';

interface WorkspaceInfoProps {
  entry: JournalEntry;
  onUpdate: (e: JournalEntry) => void;
  settings: AppSettings;
  selectedElement: any | null;
  onPropertyChange: (changes: { textContent?: string; className?: string }) => void;
}

export const WorkspaceInfo: React.FC<WorkspaceInfoProps> = (props) => {
    const hook = useWorkspaceInfo(props);

    return (
        <WorkspaceInfoView
            {...props}
            tagInput={hook.tagInput}
            setTagInput={hook.setTagInput}
            showSecrets={hook.showSecrets}
            setShowSecrets={hook.setShowSecrets}
            showHelp={hook.showHelp}
            setShowHelp={hook.setShowHelp}
            containerRef={hook.containerRef}
            handleRestoreSnapshot={hook.handleRestoreSnapshot}
        />
    );
};
