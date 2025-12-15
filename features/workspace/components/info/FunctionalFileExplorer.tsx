
import React from 'react';
import { GeneratedFile } from '../../../../types';
import { t } from '../../../../services/i18n';

const getFunctionalName = (filename: string): string => {
    const basicName = filename.split('/').pop()?.split('.')[0] || 'Component';
    
    if (['index', 'main', 'app', 'home'].includes(basicName.toLowerCase())) {
        if (filename.toLowerCase().includes('page') || filename.endsWith('.html')) return 'Main Page';
        if (filename.toLowerCase().includes('style') || filename.endsWith('.css')) return 'Global Styles';
        return 'Entry Point';
    }
    if (basicName.toLowerCase().includes('button')) {
        return 'Button';
    }
    if (basicName.toLowerCase().includes('login')) {
        return 'User Login';
    }
    // Title Case
    return basicName.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).trim();
};

interface Props {
    files: GeneratedFile[];
}

export const FunctionalFileExplorer: React.FC<Props> = ({ files }) => {
    return (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 block">{t('functionalFiles', 'builder')}</h3>
            <div className="space-y-1">
                {files.map(file => (
                    <div key={file.name} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 transition-colors cursor-pointer">
                        <span className="text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                        </span>
                        <span className="text-sm font-medium text-slate-700">{getFunctionalName(file.name)}</span>
                        <span className="text-xs text-slate-400 ml-auto font-mono opacity-60">{file.name}</span>
                    </div>
                ))}
            </div>
        </div>
    )
};
