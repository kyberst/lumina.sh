
import React from 'react';
import { GeneratedFile, CodeAnnotation } from '../../../types';
import { CodeEditor, CodeEditorApi } from '../../../components/ui/CodeEditor';
import { FileExplorer } from './editor/FileExplorer';
import { t } from '../../../services/i18n';

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
  
  const safeFiles = Array.isArray(files) ? files : [];

  // Filter annotations for active file
  const activeAnnotations = selectedFile 
      ? annotations.filter(a => a.file === selectedFile.name) 
      : [];

  return (
    <div className="w-full h-full flex">
        {/* Sidebar: Increased width for tree view */}
        <div className={`w-64 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 transition-all ${readOnly ? 'opacity-80 pointer-events-none' : ''}`}>
            <div className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 flex justify-between items-center bg-white">
                <span>{t('panel.explorer', 'workspace')}</span>
                <span className="bg-slate-100 text-slate-500 px-1.5 rounded text-[9px]">{(safeFiles || []).length}</span>
            </div>
            <div className="flex-1 overflow-hidden">
                <FileExplorer 
                    files={safeFiles} 
                    selectedFile={selectedFile} 
                    onSelect={onFileSelect} 
                    annotations={annotations}
                    readOnly={readOnly}
                />
            </div>
        </div>
        
        {/* Editor Area */}
        <div className="flex-1 relative bg-[#1e1e1e] flex flex-col min-w-0">
            {selectedFile ? (
                <>
                    {/* File Tab Header (Visual only for now) */}
                    <div className="h-9 bg-[#1e1e1e] border-b border-[#333] flex items-center px-4 select-none">
                        <span className="text-xs text-slate-400 font-mono flex items-center gap-2">
                            <span className="text-indigo-400">📄</span>
                            {selectedFile.name}
                            {hasChanges && <span className="w-2 h-2 rounded-full bg-white ml-2"></span>}
                        </span>
                    </div>
                    <div className="flex-1 relative">
                        <CodeEditor 
                            value={editorContent} 
                            language={selectedFile.language} 
                            onChange={onCodeChange} 
                            scrollToLine={scrollToLine}
                            onMount={onEditorMount}
                            annotations={activeAnnotations}
                            readOnly={readOnly}
                        />
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                    </div>
                    <p className="text-sm font-medium">{t('editor.selectFile', 'workspace')}</p>
                </div>
            )}
            
            {/* Lock Indicator */}
            {readOnly && (
                <div className="absolute top-12 right-6 z-20 flex items-center gap-2 bg-indigo-600/90 text-white px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    <span className="text-[10px] font-bold uppercase tracking-wide">{t('editor.aiEditing', 'workspace')}</span>
                </div>
            )}

            {hasChanges && !readOnly && (
                <div className="absolute bottom-6 right-6 z-10 animate-in fade-in zoom-in">
                    <button onClick={onSave} className="shadcn-btn shadcn-btn-primary shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                        {t('saveCode', 'builder')}
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};
