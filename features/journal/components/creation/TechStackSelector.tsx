
import React, { useState } from 'react';
import { t } from '../../../../services/i18n';

const COMMON_STACKS = [
    'React', 'Vue', 'Svelte', 'Angular', 
    'TypeScript', 'JavaScript', 'Python', 'Node.js', 
    'Tailwind', 'Bootstrap', 'Sass', 'HTML/CSS',
    'SQL', 'MongoDB', 'Firebase', 'Next.js', 'Supabase'
];

interface Props {
    selected: string[];
    onToggle: (item: string) => void;
}

export const TechStackSelector: React.FC<Props> = ({ selected, onToggle }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-white text-slate-800 rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex justify-between items-center p-5 text-left hover:bg-slate-50 transition-colors outline-none"
            >
                <div className="flex flex-col">
                    <span className="text-[11px] text-slate-900 font-black uppercase tracking-widest">
                        {t('creation.stackTitle', 'builder')}
                    </span>
                    <span className="text-xs text-slate-500 mt-1 font-medium">
                        {selected.length === 0 
                            ? t('creation.stackDefault', 'builder') 
                            : `${selected.length} ${t('creation.stackSelected', 'builder')}`}
                    </span>
                </div>
                <div className={`transform transition-transform duration-200 text-slate-400 ${isExpanded ? 'rotate-180' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
            </button>
            
            {isExpanded && (
                <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2">
                    <div className="h-px bg-slate-100 mb-4 w-full"></div>
                    <div className="flex flex-wrap gap-2">
                        {COMMON_STACKS.map(tech => (
                            <button
                                key={tech}
                                onClick={() => onToggle(tech)}
                                className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold transition-all shadow-sm ${
                                    selected.includes(tech)
                                    ? 'border-indigo-600 bg-indigo-600 text-white'
                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                }`}
                            >
                                {tech}
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-3 italic">
                        {t('creation.stackNote', 'builder')}
                    </p>
                </div>
            )}
        </div>
    );
};
