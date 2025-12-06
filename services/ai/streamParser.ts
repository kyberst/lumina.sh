import { GeneratedFile } from '../../types';

export type StreamMode = 'TEXT' | 'REASONING' | 'SUMMARY' | 'FILE' | 'PATCH' | 'SEARCH' | 'REPLACE' | 'COMMAND';

export interface StreamState {
  buffer: string;
  mode: StreamMode;
  currentFileName: string;
  searchBuffer: string;
  replaceBuffer: string;
  reasoningBuffer: string;
  textBuffer: string;
  fileStatuses: Record<string, 'pending' | 'success' | 'error'>;
  workingFiles: GeneratedFile[];
  commands: string[];
}

export const createInitialStreamState = (initialFiles: GeneratedFile[]): StreamState => ({
  buffer: '',
  mode: 'TEXT',
  currentFileName: '',
  searchBuffer: '',
  replaceBuffer: '',
  reasoningBuffer: '',
  textBuffer: '',
  fileStatuses: {},
  workingFiles: [...initialFiles],
  commands: []
});

const getLanguageFromFilename = (filename: string): string => {
    if(filename.endsWith('html')) return 'html';
    if(filename.endsWith('css')) return 'css';
    if(filename.endsWith('json')) return 'json';
    if(filename.endsWith('md')) return 'markdown';
    if(filename.endsWith('ts') || filename.endsWith('tsx')) return 'typescript';
    return 'javascript';
};

const updateFile = (state: StreamState, name: string, content: string): StreamState => {
    const existingIdx = state.workingFiles.findIndex(f => f.name === name);
    const newFile = { 
        name, 
        content: content.trim(), 
        language: getLanguageFromFilename(name) as any 
    };
    
    let newFiles = [...state.workingFiles];
    if (existingIdx >= 0) {
        newFiles[existingIdx] = newFile;
    } else {
        newFiles.push(newFile);
    }
    
    return {
        ...state,
        workingFiles: newFiles,
        fileStatuses: { ...state.fileStatuses, [name]: 'success' }
    };
};

const applyPatch = (originalContent: string, searchBlock: string, replaceBlock: string): string => {
    // 1. Exact Match
    if (originalContent.includes(searchBlock)) {
        return originalContent.replace(searchBlock, replaceBlock);
    }

    // 2. Normalized Line Endings Match
    const normalize = (s: string) => s.replace(/\r\n/g, '\n');
    const normOriginal = normalize(originalContent);
    const normSearch = normalize(searchBlock).trim();
    const normReplace = normalize(replaceBlock).trim();

    if (normOriginal.includes(normSearch)) {
        return normOriginal.replace(normSearch, normReplace);
    } 
    
    // 3. Fuzzy / Trimmed Line Match
    // Split into lines and match by trimmed content to ignore indentation diffs
    const originalLines = normOriginal.split('\n');
    const searchLines = normSearch.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const replaceLines = normReplace.split('\n'); // keep replacing structure mostly intact or just use block

    if (searchLines.length === 0) return originalContent;

    for (let i = 0; i < originalLines.length; i++) {
        // Attempt match starting at i
        let match = true;
        // We need to match all search lines sequentially against original lines, skipping empty original lines if needed? 
        // No, usually strict line sequence.
        
        // Let's try matching strict sequence of non-empty search lines against original lines (trimming both)
        for (let j = 0; j < searchLines.length; j++) {
            if (i + j >= originalLines.length) { match = false; break; }
            if (originalLines[i + j].trim() !== searchLines[j]) { match = false; break; }
        }

        if (match) {
            // Found match at lines i to i+searchLines.length-1
            // But we matched against *filtered* search lines. We need to replace the corresponding span in original.
            // This is tricky if the original had blank lines that we skipped? 
            // Simplified approach: Match against searchLinesStrict (unfiltered) to preserve spacing intent if possible,
            // but LLMs often mess up empty lines.
            
            // Let's assume the LLM provided a contiguous block. 
            // We'll replace the block of lines in original that matched.
            // Since we matched `searchLines.length` non-empty lines, we need to find the span in original.
            
            const before = originalLines.slice(0, i).join('\n');
            const after = originalLines.slice(i + searchLines.length).join('\n');
            
            return before + (before ? '\n' : '') + normReplace + (after ? '\n' : '') + after;
        }
    }

    console.warn("Patch failed to apply even with fuzzy matching.");
    return originalContent; 
};

export const parseStreamChunk = (chunk: string, state: StreamState): StreamState => {
    let { buffer, mode, currentFileName, searchBuffer, replaceBuffer, reasoningBuffer, textBuffer, fileStatuses, workingFiles, commands } = state;
    
    buffer += chunk;

    let processed = true;
    while (processed) {
        processed = false;

        // Detect Opening Tags
        if (mode === 'TEXT') {
            // Relaxed Regex: Supports quoted or unquoted attributes
            const tagRegex = /<lumina-(reasoning|summary|file|patch|command)(?:\s+name=["']?([^"'>\s]+)["']?)?(?:\s+type=["']?([^"'>\s]+)["']?)?\s*>/;
            const match = buffer.match(tagRegex);
            
            if (match && match.index !== undefined) {
                const tagName = match[1];
                const attrName = match[2];

                if (tagName === 'reasoning') mode = 'REASONING';
                else if (tagName === 'summary') mode = 'SUMMARY';
                else if (tagName === 'file') {
                    mode = 'FILE';
                    currentFileName = attrName || 'unknown.txt';
                    fileStatuses = { ...fileStatuses, [currentFileName]: 'pending' };
                }
                else if (tagName === 'patch') {
                    mode = 'PATCH';
                    currentFileName = attrName || 'unknown.txt';
                    fileStatuses = { ...fileStatuses, [currentFileName]: 'pending' };
                }
                else if (tagName === 'command') mode = 'COMMAND';

                buffer = buffer.substring(match.index + match[0].length);
                processed = true;
            }
        }
        // Detect Closing Tags
        else {
            let closeTag = '';
            if (mode === 'REASONING') closeTag = '</lumina-reasoning>';
            if (mode === 'SUMMARY') closeTag = '</lumina-summary>';
            if (mode === 'FILE') closeTag = '</lumina-file>';
            if (mode === 'PATCH') closeTag = '</lumina-patch>';
            if (mode === 'COMMAND') closeTag = '</lumina-command>';
            if (mode === 'SEARCH' || mode === 'REPLACE') closeTag = '</lumina-patch>'; // Failsafe

            const closeIdx = buffer.indexOf(closeTag);

            if (closeIdx !== -1) {
                const content = buffer.substring(0, closeIdx);
                
                if (mode === 'REASONING') reasoningBuffer += content;
                else if (mode === 'SUMMARY') textBuffer += content;
                else if (mode === 'FILE') {
                    state = updateFile({ ...state, workingFiles, fileStatuses }, currentFileName, content);
                    workingFiles = state.workingFiles;
                    fileStatuses = state.fileStatuses;
                }
                else if (mode === 'COMMAND') {
                    commands = [...commands, content.trim()];
                }
                else if (mode === 'PATCH' || mode === 'REPLACE') {
                    // Patch logic flushed on completion or handled internally
                }

                buffer = buffer.substring(closeIdx + closeTag.length);
                mode = 'TEXT';
                processed = true;
            } else {
                // INNER PATCH LOGIC (Search/Replace blocks)
                if (mode === 'PATCH') {
                    if (buffer.includes('<<<< SEARCH')) {
                        const parts = buffer.split('<<<< SEARCH');
                        buffer = parts[1];
                        mode = 'SEARCH';
                        processed = true;
                    }
                }
                else if (mode === 'SEARCH') {
                    if (buffer.includes('==== REPLACE')) {
                        const parts = buffer.split('==== REPLACE');
                        searchBuffer = parts[0]; 
                        buffer = parts[1];
                        mode = 'REPLACE';
                        processed = true;
                    }
                }
                else if (mode === 'REPLACE') {
                    if (buffer.includes('>>>> END')) {
                        const parts = buffer.split('>>>> END');
                        replaceBuffer = parts[0];
                        
                        const fIndex = workingFiles.findIndex(f => f.name === currentFileName);
                        if (fIndex >= 0) {
                            const original = workingFiles[fIndex].content;
                            const patched = applyPatch(original, searchBuffer, replaceBuffer);
                            
                            if (patched !== original) {
                                workingFiles = workingFiles.map((f, i) => i === fIndex ? { ...f, content: patched } : f);
                                fileStatuses = { ...fileStatuses, [currentFileName]: 'success' };
                            } else {
                                fileStatuses = { ...fileStatuses, [currentFileName]: 'error' };
                            }
                        } else {
                            fileStatuses = { ...fileStatuses, [currentFileName]: 'error' };
                        }

                        searchBuffer = '';
                        replaceBuffer = '';
                        buffer = parts[1];
                        mode = 'PATCH'; 
                        processed = true;
                    }
                }
            }
        }
    }

    return {
        buffer,
        mode,
        currentFileName,
        searchBuffer,
        replaceBuffer,
        reasoningBuffer,
        textBuffer,
        fileStatuses,
        workingFiles,
        commands
    };
};

export const finalizeStream = (state: StreamState): StreamState => {
    return {
        ...state,
        buffer: '',
        mode: 'TEXT'
    };
};