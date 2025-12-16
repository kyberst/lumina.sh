
import React from 'react';

interface CodeEditorViewProps {
  containerRef: React.RefObject<HTMLDivElement>;
  className?: string;
  readOnly?: boolean;
}

export const CodeEditorView: React.FC<CodeEditorViewProps> = ({ containerRef, className, readOnly }) => {
  return (
    <div 
        ref={containerRef} 
        className={`w-full h-full ${className || ''} ${readOnly ? 'opacity-90' : ''}`} 
    />
  );
};
