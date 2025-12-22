
import React from 'react';
import { JournalEntry, AppSettings } from '../../types';
import { useWorkspaceLogic } from './hooks/useWorkspaceLogic';
import { WorkspaceViewPresentation } from './WorkspaceView.view';

interface WorkspaceViewProps {
  entry: JournalEntry;
  onUpdate: (updatedEntry: JournalEntry) => Promise<void>;
  onClose: () => void;
  settings: AppSettings;
}

/**
 * WorkspaceView Entry Point.
 * Follows Atomic Modularity Rule by delegating logic to useWorkspaceLogic hook
 * and rendering to WorkspaceViewPresentation.
 */
export const WorkspaceView: React.FC<WorkspaceViewProps> = (props) => {
  const logic = useWorkspaceLogic(props);
  
  return <WorkspaceViewPresentation {...logic} />;
};
