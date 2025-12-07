
import React from 'react';
import { GeneratedFile, CodeAnnotation } from '../../../types';
import { CodeEditor, CodeEditorApi } from '../../../components/ui/CodeEditor';

interface WorkspaceCodeProps {
  files: GeneratedFile[];
  selectedFile: GeneratedFile | null;
  editorContent: string;
  hasChanges: boolean;
  onFileSelect: (f: GeneratedFile) => void;
  onCodeChange: (v: string) => void;
  onSave: () => void;
  scrollToLine?: number | null;
  onEditorMount?: (api: CodeEditorApi) => void;
  annotations?: CodeAnnotation[];
  readOnly?: boolean;
}

export const WorkspaceCode: React.FC<WorkspaceCodeProps> = ({
  files, selectedFile, editorContent, hasChanges, onFileSelect, onCodeChange, onSave, scrollToLine, onEditorMount, annotations = [], readOnly = false
}) => {
  
  // Filter annotations for active file
  const activeAnnotations = selectedFile 
      ? annotations.filter(a => a.file === selectedFile.name) 
      : [];

  return (
    <div className="w-full h-full flex">
        <div className={`w-48 bg-slate-50 border-r border-slate-200 flex flex-col ${readOnly ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
            <div className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">Files</div>
            <div className="overflow-y-auto flex-1">
                {files.map(f => {
                    const errorCount = annotations.filter(a => a.file === f.name && a.type === 'error').length;
                    return (
                        <button 
                            key={f.name} 
                            onClick={() => onFileSelect(f)}
                            disabled={readOnly}
                            className={`w-full text-left px-4 py-2.5 text-xs font-mono truncate hover:bg-white transition-all border-l-2 flex items-center gap-2 ${selectedFile?.name === f.name ? 'bg-white text-indigo-600 border-indigo-600 font-bold shadow-sm' : 'text-slate-600 border-transparent'}`}
                        >
                            <span className={`w-2 h-2 rounded-full ${f.name.endsWith('.html') ? 'bg-orange-400' : f.name.endsWith('.css') ? 'bg-blue-400' : f.name.endsWith('.js') || f.name.endsWith('.ts') ? 'bg-yellow-400' : 'bg-slate-300'}`}></span>
                            <span className="truncate flex-1">{f.name}</span>
                            {errorCount > 0 && <span className="text-[9px] bg-red-500 text-white rounded-full px-1.5">{errorCount}</span>}
                        </button>
                    );
                })}
            </div>
        </div>
        <div className="flex-1 relative bg-[#1e1e1e]">
            {selectedFile ? (
                <CodeEditor 
                    value={editorContent} 
                    language={selectedFile.language} 
                    onChange={onCodeChange} 
                    scrollToLine={scrollToLine}
                    onMount={onEditorMount}
                    annotations={activeAnnotations}
                    readOnly={readOnly}
                />
            ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">Select a file to edit</div>
            )}
            
            {/* Lock Indicator */}
            {readOnly && (
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-indigo-600/90 text-white px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    <span className="text-[10px] font-bold uppercase tracking-wide">AI Editing...</span>
                </div>
            )}

            {hasChanges && !readOnly && (
                <div className="absolute top-4 right-4 z-10 animate-in fade-in zoom-in">
                    <button onClick={onSave} className="shadcn-btn shadcn-btn-primary shadow-lg hover:scale-105 transition-transform">Save Changes</button>
                </div>
            )}
        </div>
    </div>
  );
};
