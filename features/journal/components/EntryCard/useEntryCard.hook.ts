
import { useState } from 'react';
import { JournalEntry } from '../../../../types';

interface Props {
  entry: JournalEntry;
  onUpdate?: (entry: JournalEntry) => void;
}

export const useEntryCard = ({ entry, onUpdate }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(entry.project || '');

  const handleSave = (e: React.MouseEvent) => {
      e.stopPropagation();
      if(onUpdate) {
          onUpdate({ ...entry, project: editTitle });
          setIsEditing(false);
      }
  };

  const handleCancel = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditTitle(entry.project || '');
      setIsEditing(false);
  };

  return {
    isEditing,
    setIsEditing,
    editTitle,
    setEditTitle,
    handleSave,
    handleCancel,
  };
};
