

import { GeneratedFile, CodeAnnotation, AIPlan } from '../../types';
import { applyDiff } from './diffUtils';

/**
 * State definitions for the Stream Parser.
 */
export type StreamMode = 'TEXT' | 'REASONING' | 'SUMMARY' | 'FILE' | 'PATCH' | 'COMMAND';

export interface StreamState {
  buffer: string;             // Raw text buffer from stream
  mode: StreamMode;           // Current parsing mode
  currentFileName: string;    // Active file being written/patched
  reasoningBuffer: string;    // Accumulator for <lumina-reasoning>
  textBuffer: string;         // Accumulator for <lumina-summary>
  fileStatuses: Record<string, 'pending' | 'success' | 'error'>;
  workingFiles: GeneratedFile[];
  commands: string[];
  dependencies: Record<string, string>;
  annotations: CodeAnnotation[]; // Visual feedback/errors from AI
  aiPlan?: AIPlan; // Structured plan progress
}

/** Initializes a fresh stream state based on current project files. */
export const createInitialStreamState = (initialFiles: GeneratedFile[]): StreamState => ({
  buffer: '',
  mode: 'TEXT',
  currentFileName: '',
  reasoningBuffer: '',
  textBuffer: '',
  fileStatuses: {},
  workingFiles: [...initialFiles],
  commands: [],
  dependencies: {},
  annotations: [],
  aiPlan: undefined
});

/** Determines generic language based on file extension. */
const getLanguageFromFilename = (filename: string): string => {
    if(filename.endsWith('html')) return 'html';
    if(filename.endsWith('css')) return 'css';
    if(filename.endsWith('json')) return 'json';
    if(filename.endsWith('md')) return 'markdown';
    if(filename.endsWith('ts') || filename.endsWith('tsx')) return 'typescript';
    return 'javascript';
};

/** 
 * Updates or Creates a file in the working file list.
 * IMMUTABLE: Creates a new GeneratedFile instance and a new array.
 */
const updateFile = (state: StreamState, name: string, content: string): StreamState => {
    const existingIdx = state.workingFiles.findIndex(f => f.name === name);
    
    // Create NEW instance for immutability compliance
    const newFile: GeneratedFile = { 
        name, 
        content: content.trim(), 
        language: getLanguageFromFilename(name) as any 
    };
    
    // Create NEW array for state update
    let newFiles = [...state.workingFiles];
    if (existingIdx >= 0) newFiles[existingIdx] = newFile;
    else newFiles.push(newFile);
    
    return {
        ...state,
        workingFiles: newFiles,
        fileStatuses: { ...state.fileStatuses, [name]: 'success' }
    };
};

/** Extracts attributes like name="file.js" from XML tags. */
const parseAttributes = (tagContent: string): Record<string, string> => {
    const attrs: Record<string, string> = {};
    const regex = /([a-zA-Z0-9-]+)=["']([^"']*)["']/g;
    let match;
    while ((match = regex.exec(tagContent)) !== null) {
        attrs[match[1]] = match[2];
    }
    return attrs;
};

/** 
 * Main Parsing Logic.
 * Takes a chunk of text, appends to buffer, and processes state transitions.
 * strictly enforces immutability for file patching.
 */
export const parseStreamChunk = (chunk: string, state: StreamState): StreamState => {
    let { buffer, mode, currentFileName, reasoningBuffer, textBuffer, fileStatuses, workingFiles, commands, dependencies, annotations, aiPlan } = state;
    
    buffer += chunk;

    let processed = true;
    while (processed) {
        processed = false;

        // Mode: TEXT (Looking for Open Tags)
        if (mode === 'TEXT') {
            const tagRegex = /<lumina-([a-z]+)\s*([^>]*?)(\/?)>/;
            const match = buffer.match(tagRegex);
            
            if (match && match.index !== undefined) {
                const tagName = match[1];
                const attrs = parseAttributes(match[2]);

                buffer = buffer.substring(match.index + match[0].length);
                processed = true; 

                if (tagName === 'dependency') {
                    if (attrs.name && attrs.version) {
                        dependencies = { ...dependencies, [attrs.name]: attrs.version };
                    }
                } else if (tagName === 'annotation') {
                    if (attrs.file && attrs.line && attrs.message) {
                        annotations = [...annotations, {
                            file: attrs.file,
                            line: parseInt(attrs.line) || 1,
                            type: (attrs.type as any) || 'info',
                            message: attrs.message,
                            suggestion: attrs.suggestion // Code fix suggestion
                        }];
                    }
                } else if (tagName === 'plan') {
                    // <lumina-plan step="1/5" task="Creating..." />
                    const stepParts = (attrs.step || '0/0').split('/');
                    aiPlan = {
                        currentStep: parseInt(stepParts[0]) || 0,
                        totalSteps: parseInt(stepParts[1]) || 0,
                        currentTask: attrs.task || 'Processing...'
                    };
                } else if (tagName === 'reasoning') {
                    mode = 'REASONING';
                } else if (tagName === 'summary') {
                    mode = 'SUMMARY';
                } else if (tagName === 'file') {
                    mode = 'FILE';
                    currentFileName = attrs.name || 'unknown.txt';
                    fileStatuses = { ...fileStatuses, [currentFileName]: 'pending' };
                } else if (tagName === 'patch') {
                    mode = 'PATCH';
                    currentFileName = attrs.name || 'unknown.txt';
                    fileStatuses = { ...fileStatuses, [currentFileName]: 'pending' };
                } else if (tagName === 'command') {
                    mode = 'COMMAND';
                }
            }
        }
        // Mode: INSIDE A TAG (Looking for Close Tag)
        else {
            const closeTag = `</lumina-${mode.toLowerCase()}>`;
            const closeIdx = buffer.indexOf(closeTag);

            if (closeIdx !== -1) {
                const content = buffer.substring(0, closeIdx);
                
                if (mode === 'REASONING') reasoningBuffer += content;
                else if (mode === 'SUMMARY') textBuffer += content;
                else if (mode === 'COMMAND') commands = [...commands, content.trim()];
                else if (mode === 'FILE') {
                    state = updateFile({ ...state, workingFiles, fileStatuses, aiPlan }, currentFileName, content);
                    workingFiles = state.workingFiles;
                    fileStatuses = state.fileStatuses;
                }
                else if (mode === 'PATCH') {
                    const fIndex = workingFiles.findIndex(f => f.name === currentFileName);
                    if (fIndex >= 0) {
                        const original = workingFiles[fIndex].content;
                        const patched = applyDiff(original, content);
                        if (patched !== original) {
                            // IMMUTABLE UPDATE: Create new file instance
                            const updatedFile: GeneratedFile = {
                                ...workingFiles[fIndex],
                                content: patched
                            };
                            // IMMUTABLE UPDATE: Create new array
                            workingFiles = workingFiles.map((f, i) => i === fIndex ? updatedFile : f);
                            fileStatuses = { ...fileStatuses, [currentFileName]: 'success' };
                        } else {
                            fileStatuses = { ...fileStatuses, [currentFileName]: 'error' };
                        }
                    } else {
                        fileStatuses = { ...fileStatuses, [currentFileName]: 'error' };
                    }
                }

                buffer = buffer.substring(closeIdx + closeTag.length);
                mode = 'TEXT';
                processed = true; 
            }
        }
    }

    return { buffer, mode, currentFileName, reasoningBuffer, textBuffer, fileStatuses, workingFiles, commands, dependencies, annotations, aiPlan };
};

export const finalizeStream = (state: StreamState): StreamState => ({ ...state, buffer: '', mode: 'TEXT' });