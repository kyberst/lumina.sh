
import { GeneratedFile, DependencyDetails } from '../../../types';

export const getLanguageFromFilename = (filename: string): string => {
    if(filename.endsWith('html')) return 'html';
    if(filename.endsWith('css')) return 'css';
    if(filename.endsWith('json')) return 'json';
    if(filename.endsWith('md')) return 'markdown';
    if(filename.endsWith('ts') || filename.endsWith('tsx')) return 'typescript';
    return 'javascript';
};

export const parseAttributes = (tagContent: string): Record<string, string> => {
    const attrs: Record<string, string> = {};
    const regex = /([a-zA-Z0-9-]+)=["']([^"']*)["']/g;
    let match;
    while ((match = regex.exec(tagContent)) !== null) {
        attrs[match[1]] = match[2];
    }
    return attrs;
};

export const updateFile = (files: GeneratedFile[], name: string, content: string): { updatedFiles: GeneratedFile[], status: 'success' } => {
    const existingIdx = files.findIndex(f => f.name === name);
    const newFile: GeneratedFile = { name, content: content.trim(), language: getLanguageFromFilename(name) as any };
    const newFiles = [...files];
    if (existingIdx >= 0) newFiles[existingIdx] = newFile; else newFiles.push(newFile);
    return { updatedFiles: newFiles, status: 'success' };
};

export const detectRuntime = (deps: Record<string, DependencyDetails>, files: GeneratedFile[]): 'node' | 'python' => {
   const runtimes = Object.values(deps).map(d => d.runtime);
   if (runtimes.includes('python')) return 'python';
   if (runtimes.includes('node')) return 'node';
   
   if (files.some(f => f.name.endsWith('.py'))) return 'python';
   
   return 'node';
};