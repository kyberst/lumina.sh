
import React, { useState, useEffect } from 'react';
import { AppSettings } from '../../../../types';
import { t } from '../../../../services/i18n';

interface UniversalPropertyInspectorProps {
    selectedElement: any | null;
    onPropertyChange: (changes: { textContent?: string; className?: string }) => void;
    settings: AppSettings;
}

export const UniversalPropertyInspector: React.FC<UniversalPropertyInspectorProps> = ({ selectedElement, onPropertyChange, settings }) => {
    const [textContent, setTextContent] = useState('');
    const [className, setClassName] = useState('');

    useEffect(() => {
        if (selectedElement) {
            setTextContent(selectedElement.textContent || '');
            setClassName(selectedElement.className || '');
        }
    }, [selectedElement]);

    const handleSave = () => {
        const changes: { textContent?: string; className?: string } = {};
        const textChanged = textContent !== selectedElement.textContent;
        const classChanged = className !== selectedElement.className;

        if (textChanged) changes.textContent = textContent;
        if (classChanged) changes.className = className;
        
        if (Object.keys(changes).length > 0) {
            onPropertyChange(changes);
        }
    };
    
    if (!selectedElement) {
        return (
            <div className="bg-white rounded-xl p-8 border-2 border-dashed border-slate-200 text-center">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full mx-auto flex items-center justify-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 13a8 8 0 0 1 7-7 6 6 0 0 1 6 6 6 6 0 0 1-6 6 8 8 0 0 1-7-7z"/><path d="M9 13h-1a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1"/></svg>
                </div>
                <p className="text-sm font-bold text-slate-600">{t('clickToInspect', 'workspace')}</p>
                <p className="text-xs text-slate-400 mt-1">{t('clickToInspectDesc', 'workspace')}</p>
            </div>
        );
    }
    
    const isTextEditable = selectedElement && selectedElement.textContent;

    return (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('propertyInspector', 'workspace')}</h3>
                 {selectedElement && <span className="text-xs font-mono bg-slate-100 text-indigo-700 px-2 py-1 rounded-md border border-slate-200 font-bold">{`<${selectedElement.tagName.toLowerCase()}>`}</span>}
            </div>
            
            {isTextEditable && (
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t('textContent', 'workspace')}</label>
                    <textarea className="shadcn-input h-20 resize-none" value={textContent} onChange={e => setTextContent(e.target.value)} />
                </div>
            )}
            
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">{t('cssClasses', 'workspace')}</label>
                <input className="shadcn-input font-mono text-xs" value={className} onChange={e => setClassName(e.target.value)} />
            </div>
            
            <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                <p className="text-[10px] text-slate-400 italic max-w-[60%]">{t('inspectorNote', 'workspace')}</p>
                <button onClick={handleSave} className="shadcn-btn shadcn-btn-primary">
                    {t('applyChanges', 'workspace')}
                </button>
            </div>
        </div>
    );
};
