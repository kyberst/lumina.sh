
import React, { useState, useMemo, useEffect } from 'react';
import { GeneratedFile, CodeAnnotation } from '../../../../types';
import { t } from '../../../../services/i18n';

interface TreeNode {
    name: string;
    path: string;
    type: 'folder' | 'file';
    children: TreeNode[];
    file?: GeneratedFile;
    errorCount: number;
}

interface FileExplorerProps {
    files: GeneratedFile[];
    selectedFile: GeneratedFile | null;
    onSelect: (file: GeneratedFile) => void;
    annotations: CodeAnnotation[];
    readOnly?: boolean;
}

const getIcon = (name: string, type: 'folder' | 'file', isOpen: boolean) => {
    if (type === 'folder') {
        return isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 2H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground group-hover:text-foreground"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 2H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
        );
    }
    // File Icons
    if (name.endsWith('ts') || name.endsWith('tsx')) return <span className="text-blue-500 font-extrabold text-[9px] tracking-tighter">TS</span>;
    if (name.endsWith('js') || name.endsWith('jsx')) return <span className="text-yellow-500 font-extrabold text-[9px] tracking-tighter">JS</span>;
    if (name.endsWith('css')) return <span className="text-sky-400 font-extrabold text-[9px] tracking-tighter">#</span>;
    if (name.endsWith('html')) return <span className="text-orange-500 font-extrabold text-[9px] tracking-tighter">&lt;&gt;</span>;
    if (name.endsWith('json')) return <span className="text-emerald-500 font-extrabold text-[9px] tracking-tighter">{'{ }'}</span>;
    return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>;
};

const FileNode: React.FC<{ 
    node: TreeNode; 
    depth: number; 
    selectedFile: GeneratedFile | null; 
    onSelect: (f: GeneratedFile) => void;
    defaultExpanded?: boolean;
}> = ({ node, depth, selectedFile, onSelect, defaultExpanded }) => {
    const [isOpen, setIsOpen] = useState(defaultExpanded || false);
    
    // Auto-expand if a child file is selected
    useEffect(() => {
        if (node.type === 'folder' && selectedFile && selectedFile.name.startsWith(node.path + '/')) {
            setIsOpen(true);
        }
    }, [selectedFile, node.path, node.type]);

    if (node.type === 'folder') {
        return (
            <div className="animate-in fade-in slide-in-from-left-1 duration-200">
                <div 
                    className={`group flex items-center gap-1.5 py-1.5 px-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none text-xs text-foreground font-medium rounded-md mx-1`}
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className={`transition-transform duration-200 text-muted-foreground ${isOpen ? 'rotate-90' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </span>
                    {getIcon(node.name, 'folder', isOpen)}
                    <span className="truncate opacity-90 group-hover:opacity-100">{node.name}</span>
                    {node.errorCount > 0 && (
                        <span className="ml-auto w-2 h-2 bg-destructive rounded-full shadow-sm"></span>
                    )}
                </div>
                {isOpen && (
                    <div className="relative">
                        {/* Thread line visual */}
                        <div className="absolute left-[calc(1.5rem-1px)] top-0 bottom-0 w-px bg-border/50" style={{ left: `${depth * 12 + 19}px` }}></div>
                        {node.children.map(child => (
                            <FileNode key={child.path} node={child} depth={depth + 1} selectedFile={selectedFile} onSelect={onSelect} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-left-1 duration-200">
            <div 
                className={`group flex items-center gap-2 py-1.5 px-2 cursor-pointer text-xs font-mono transition-all rounded-md mx-1 my-0.5 ${selectedFile?.name === node.path ? 'bg-primary/10 text-primary font-bold shadow-sm ring-1 ring-primary/20' : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground'}`}
                style={{ paddingLeft: `${depth * 12 + 20}px` }}
                onClick={() => node.file && onSelect(node.file)}
            >
                {getIcon(node.name, 'file', false)}
                <span className="truncate">{node.name}</span>
                {node.errorCount > 0 && (
                    <span className="ml-auto text-[9px] bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full font-bold shadow-sm">{node.errorCount}</span>
                )}
            </div>
        </div>
    );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({ files, selectedFile, onSelect, annotations, readOnly }) => {
    
    const tree = useMemo(() => {
        const root: TreeNode[] = [];
        const map = new Map<string, TreeNode>();

        // Ensure files is always an array to prevent "not iterable" errors
        const safeFiles = Array.isArray(files) ? files : [];
        const sortedFiles = [...safeFiles].sort((a, b) => a.name.localeCompare(b.name));

        sortedFiles.forEach(file => {
            const parts = file.name.split('/');
            let currentPath = '';
            
            parts.forEach((part, index) => {
                const isFile = index === parts.length - 1;
                const parentPath = currentPath;
                currentPath = currentPath ? `${currentPath}/${part}` : part;

                if (!map.has(currentPath)) {
                    const node: TreeNode = {
                        name: part,
                        path: currentPath,
                        type: isFile ? 'file' : 'folder',
                        children: [],
                        file: isFile ? file : undefined,
                        errorCount: 0
                    };
                    
                    map.set(currentPath, node);

                    if (parentPath) {
                        const parent = map.get(parentPath);
                        if (parent) parent.children.push(node);
                    } else {
                        root.push(node);
                    }
                }
                
                const node = map.get(currentPath)!;
                if (isFile) {
                    node.errorCount = annotations.filter(a => a.file === file.name && a.type === 'error').length;
                }
            });
        });

        const pathsByLength = Array.from(map.keys()).sort((a, b) => b.length - a.length);
        pathsByLength.forEach(path => {
            const node = map.get(path)!;
            if (node.type === 'folder') {
                node.errorCount = node.children.reduce((acc, child) => acc + child.errorCount, 0);
            }
        });

        const sortNodes = (nodes: TreeNode[]) => {
            nodes.sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === 'folder' ? -1 : 1;
            });
            nodes.forEach(n => {
                if (n.children.length > 0) sortNodes(n.children);
            });
        };
        sortNodes(root);

        return root;
    }, [files, annotations]);

    return (
        <div className={`h-full overflow-y-auto custom-scrollbar pb-4 pt-2 ${readOnly ? 'opacity-75 grayscale' : ''}`}>
            {tree.length === 0 && <div className="p-4 text-xs text-muted-foreground italic text-center mt-10">{t('explorer.empty', 'workspace')}</div>}
            {tree.map(node => (
                <FileNode 
                    key={node.path} 
                    node={node} 
                    depth={0} 
                    selectedFile={selectedFile} 
                    onSelect={onSelect}
                    defaultExpanded={true}
                />
            ))}
        </div>
    );
};
