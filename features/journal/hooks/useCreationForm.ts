
import React, { useState, useRef, useEffect } from 'react';
import { useVoiceInput } from '../../../hooks/useVoiceInput';
import { AppSettings } from '../../../types';

export const useCreationForm = (settings: AppSettings, onContentChange: (c: string) => void) => {
  const [content, setContent] = useState('');
  const [project, setProject] = useState('');
  const [complexity, setComplexity] = useState(50);
  const [stack, setStack] = useState<string[]>([]);
  const [appLanguages, setAppLanguages] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<{ name: string; type: string; data: string }[]>([]);
  
  const [selectedProvider, setSelectedProvider] = useState<string>('gemini');
  const [selectedModel, setSelectedModel] = useState<string>('flash');

  const { isListening, toggleListening, transcript, resetTranscript } = useVoiceInput();
  const attachmentRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (transcript) {
        const newContent = content + (content ? ' ' : '') + transcript;
        setContent(newContent);
        onContentChange(newContent);
        resetTranscript();
    }
  }, [transcript, resetTranscript, content, onContentChange]);

  const handleAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (evt) => {
              if (evt.target?.result) {
                  setAttachments(prev => [...prev, {
                      name: file.name,
                      type: file.type,
                      data: evt.target!.result as string
                  }]);
              }
          };
          reader.readAsDataURL(file);
      }
      if(attachmentRef.current) attachmentRef.current.value = '';
  };
  
  const removeAttachment = (index: number) => {
      setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const toggleStackItem = (item: string) => {
      setStack(prev => prev.includes(item) ? prev.filter(s => s !== item) : [...prev, item]);
  };

  return {
    content, setContent,
    project, setProject,
    complexity, setComplexity,
    stack, setStack,
    appLanguages, setAppLanguages,
    attachments, setAttachments,
    selectedProvider, setSelectedProvider,
    selectedModel, setSelectedModel,
    isListening, toggleListening,
    handleAttachment, removeAttachment,
    toggleStackItem,
    attachmentRef
  };
};
