import { useState, useRef, useEffect } from 'react';
import { GeneratedFile, JournalEntry } from '../../../types';
import { CodeEditorApi } from '../../../components/ui/CodeEditor';

export const useEditorSystem = (entry: JournalEntry, onUpdateEntry: (e: JournalEntry) => Promise<boolean>, onSaveSuccess?: () => void) => {
    const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
    const [editorContent, setEditorContent] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const [scrollToLine, setScrollToLine] = useState<number | null>(null);
    const editorApiRef = useRef<CodeEditorApi | null>(null);

    useEffect(() => {
        if (!selectedFile && entry.files.length > 0) {
            const f = entry.files.find(x => x.name === 'index.html') || entry.files[0];
            setSelectedFile(f);
            setEditorContent(f.content);
        }
    }, [entry.files.length]);

    const selectFile = (f: GeneratedFile) => {
        setSelectedFile(f);
        setEditorContent(f.content);
        setScrollToLine(null);
        setHasChanges(false);
    };

    const saveChanges = async () => {
        if (selectedFile) {
            const updatedFiles = entry.files.map(x => x.name === selectedFile.name ? { ...x, content: editorContent } : x);
            if (await onUpdateEntry({ ...entry, files: updatedFiles })) {
                setHasChanges(false);
                if (onSaveSuccess) onSaveSuccess();
            }
        }
    };

    const getContext = () => {
        if (!selectedFile || !editorApiRef.current) return undefined;
        const pos = editorApiRef.current.getPosition();
        return { activeFile: selectedFile.name, cursorLine: pos.lineNumber, selectedCode: editorApiRef.current.getSelection() };
    };

    return { selectedFile, editorContent, hasChanges, scrollToLine, setScrollToLine, editorApiRef, selectFile, handleContentChange: (v: string) => { setEditorContent(v); setHasChanges(true); }, saveChanges, getContext };
};