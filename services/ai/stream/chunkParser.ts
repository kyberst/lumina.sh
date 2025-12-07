
import { applyDiff } from '../diffUtils';
import { StreamState } from './types';
import { parseAttributes, updateFile, detectRuntime } from './utils';

export const parseStreamChunk = (chunk: string, state: StreamState): StreamState => {
    let { buffer, mode, currentFileName, currentCommandType, reasoningBuffer, textBuffer, fileStatuses, workingFiles, commands, dependencies, annotations, aiPlan } = state;
    buffer += chunk;
    let processed = true;
    while (processed) {
        processed = false;
        if (mode === 'TEXT') {
            const match = buffer.match(/<lumina-([a-z]+)\s*([^>]*?)(\/?)>/);
            if (match && match.index !== undefined) {
                const tagName = match[1]; const attrs = parseAttributes(match[2]);
                buffer = buffer.substring(match.index + match[0].length); processed = true; 
                
                if (tagName === 'dependency') { 
                    if (attrs.name && attrs.version) {
                        const runtime = (attrs.runtime as 'node' | 'python') || 'node';
                        dependencies = { ...dependencies, [attrs.name]: { version: attrs.version, runtime } };
                        
                        // Generate appropriate shell command based on runtime
                        const cmd = runtime === 'python' 
                            ? `pip install ${attrs.name}==${attrs.version}`
                            : `npm install ${attrs.name}@${attrs.version}`;
                        
                        // Avoid duplicate commands if possible, though simple push is safer for history
                        if (!commands.includes(cmd)) {
                            commands = [...commands, cmd];
                        }
                    } 
                }
                else if (tagName === 'annotation') { if (attrs.file && attrs.message) annotations = [...annotations, { file: attrs.file, line: parseInt(attrs.line)||1, type: (attrs.type as any)||'info', message: attrs.message, suggestion: attrs.suggestion }]; }
                else if (tagName === 'plan') { const stepParts = (attrs.step || '0/0').split('/'); aiPlan = { currentStep: parseInt(stepParts[0])||0, totalSteps: parseInt(stepParts[1])||0, currentTask: attrs.task||'Processing...' }; }
                else if (tagName === 'reasoning') mode = 'REASONING';
                else if (tagName === 'summary') mode = 'SUMMARY';
                else if (tagName === 'file') { mode = 'FILE'; currentFileName = attrs.name || 'unknown.txt'; fileStatuses = { ...fileStatuses, [currentFileName]: 'pending' }; }
                else if (tagName === 'patch') { mode = 'PATCH'; currentFileName = attrs.name || 'unknown.txt'; fileStatuses = { ...fileStatuses, [currentFileName]: 'pending' }; }
                else if (tagName === 'command') { mode = 'COMMAND'; currentCommandType = attrs.type || 'shell'; }
            }
        } else {
            const closeTag = `</lumina-${mode.toLowerCase()}>`;
            const closeIdx = buffer.indexOf(closeTag);
            if (closeIdx !== -1) {
                const content = buffer.substring(0, closeIdx);
                
                if (mode === 'REASONING') reasoningBuffer += content;
                else if (mode === 'SUMMARY') textBuffer += content;
                else if (mode === 'FILE') { const res = updateFile(workingFiles, currentFileName, content); workingFiles = res.updatedFiles; fileStatuses = { ...fileStatuses, [currentFileName]: res.status }; }
                else if (mode === 'PATCH') { 
                    const f = workingFiles.find(f => f.name === currentFileName);
                    if (f) { 
                        const patched = applyDiff(f.content, content); 
                        workingFiles = workingFiles.map(x => x.name === currentFileName ? { ...x, content: patched } : x);
                        fileStatuses = { ...fileStatuses, [currentFileName]: 'success' };
                    } else fileStatuses = { ...fileStatuses, [currentFileName]: 'error' };
                }
                else if (mode === 'COMMAND') {
                    const rawContent = content.trim();
                    let finalCmd = rawContent;

                    if (currentCommandType === 'package_install') {
                        const runtime = detectRuntime(dependencies, workingFiles);
                        if (runtime === 'python') finalCmd = `pip install ${rawContent}`;
                        else finalCmd = `npm install ${rawContent}`;
                    } else if (currentCommandType === 'db_migration') {
                        finalCmd = `lumina db:migrate ${rawContent}`;
                    } else if (currentCommandType === 'build') {
                        finalCmd = rawContent; // Use raw build command provided by AI
                    }
                    
                    if (!commands.includes(finalCmd)) {
                        commands = [...commands, finalCmd];
                    }
                    currentCommandType = undefined;
                }

                buffer = buffer.substring(closeIdx + closeTag.length); mode = 'TEXT'; processed = true; 
            }
        }
    }
    return { buffer, mode, currentFileName, currentCommandType, reasoningBuffer, textBuffer, fileStatuses, workingFiles, commands, dependencies, annotations, aiPlan };
};