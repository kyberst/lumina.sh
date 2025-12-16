
import React from 'react';
import { useCodeEditor } from './useCodeEditor.hook';
import { CodeEditorView } from './CodeEditor.view';
import { CodeAnnotation } from '../../../types';

export interface CodeEditorApi {
  getSelection: () => string;
  getPosition: () => { lineNumber: number, column: number };
}

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  className?: string;
  scrollToLine?: number | null;
  onMount?: (api: CodeEditorApi) => void;
  annotations?: CodeAnnotation[];
  readOnly?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = (props) => {
    const { containerRef } = useCodeEditor(props);

    return (
        <CodeEditorView
            containerRef={containerRef}
            className={props.className}
            readOnly={props.readOnly}
        />
    );
};
