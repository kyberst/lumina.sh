
import React from 'react';
import { JournalEntry } from '../../../../types';
import { useEntryCard } from './useEntryCard.hook';
import { EntryCardView } from './EntryCard.view';

interface EntryCardProps {
  entry: JournalEntry;
  onDelete?: (id: string) => void;
  onSelect?: () => void;
  onTagClick?: (tag: string) => void;
  onUpdate?: (entry: JournalEntry) => void;
}

export const EntryCard: React.FC<EntryCardProps> = (props) => {
  const hook = useEntryCard(props);

  return (
    <EntryCardView 
      {...props}
      isEditing={hook.isEditing}
      editTitle={hook.editTitle}
      setEditTitle={hook.setEditTitle}
      handleSave={hook.handleSave}
      handleCancel={hook.handleCancel}
      setIsEditing={hook.setIsEditing}
    />
  );
};
