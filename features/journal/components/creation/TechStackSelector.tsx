import React from 'react';

const COMMON_STACKS = [
    'React', 'Vue', 'Svelte', 'Angular', 
    'TypeScript', 'JavaScript', 'Python', 'Node.js', 
    'Tailwind', 'Bootstrap', 'Sass', 'HTML/CSS',
    'SQL', 'MongoDB', 'Firebase', 'Next.js'
];

interface Props {
    selected: string[];
    onToggle: (item: string) => void;
}

export const TechStackSelector: React.FC<Props> = ({ selected, onToggle }) => {
    return (
        <div className="bg-white text-slate-800 p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-[11px] text-slate-900 font-black uppercase tracking-widest mb-3 flex justify-between items-center">
                <span>Target Stack</span>
                <span className="text-indigo-600">{selected.length} selected</span>
            </div>
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
        </div>
    );
};