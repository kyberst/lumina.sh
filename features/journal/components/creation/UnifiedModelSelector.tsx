import React, { useState, useRef, useEffect } from 'react';
import { t } from '../../../../services/i18n';
import { AppSettings, AIProvider } from '../../../../types';

interface ModelOption {
    id: string;
    name: string;
}

interface ProviderOption {
    id: string;
    name: string;
    models: ModelOption[];
}

interface Props {
    settings: AppSettings;
    selectedProvider: string;
    selectedModel: string;
    onChange: (providerId: string, modelId: string) => void;
    className?: string;
    isProcessing?: boolean;
}

export const UnifiedModelSelector: React.FC<Props> = ({ 
    settings, selectedProvider, selectedModel, onChange, className = '', isProcessing 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<'providers' | 'models'>('providers');
    const [activeProvider, setActiveProvider] = useState<ProviderOption | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Aggregate all providers (Native Gemini + Custom from settings)
    const providers: ProviderOption[] = [
        { 
            id: 'gemini', 
            name: 'Neural Engine (Google)', 
            models: [
                { id: '2.5-pro', name: 'Gemini 2.5 Pro (Deep Thought)' },
                { id: '2.5-flash', name: 'Gemini 2.5 Flash (Performance)' },
                { id: '2.5-lite', name: 'Gemini 2.5 Flash-Lite (Efficient)' },
                { id: 'pro', name: 'Gemini 3 Pro (Visionary)' },
                { id: 'flash', name: 'Gemini 3 Flash (Instant)' }
            ] 
        },
        ...(settings.customProviders || []).map(p => ({
            id: p.id,
            name: p.name,
            models: p.models || []
        }))
    ];

    const currentProvider = providers.find(p => p.id === selectedProvider) || providers[0];
    const currentModel = currentProvider.models.find(m => m.id === selectedModel) || currentProvider.models[0];

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setTimeout(() => setView('providers'), 300);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectProvider = (p: ProviderOption) => {
        setActiveProvider(p);
        setView('models');
    };

    const handleSelectModel = (m: ModelOption) => {
        if (activeProvider) {
            onChange(activeProvider.id, m.id);
            setIsOpen(false);
            setTimeout(() => setView('providers'), 300);
        }
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <label className="block text-[10px] text-muted-foreground font-black uppercase mb-2 ml-1 tracking-[0.3em] opacity-40">
                Core Entity Control
            </label>
            
            <button
                type="button"
                onClick={() => !isProcessing && setIsOpen(!isOpen)}
                className={`w-full h-12 flex items-center justify-between px-5 bg-black/5 dark:bg-white/5 backdrop-blur-xl border border-border/40 rounded-2xl hover:border-primary/40 transition-all shadow-lg group ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="relative flex items-center justify-center">
                        <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-primary scale-125' : 'bg-slate-400'} transition-all duration-500 shadow-[0_0_10px_currentColor]`}></div>
                        {isOpen && <div className="absolute inset-0 w-2 h-2 rounded-full bg-primary animate-ping"></div>}
                    </div>
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60 group-hover:text-primary transition-colors">
                            {currentProvider.name}
                        </span>
                        <span className="text-[11px] font-bold truncate text-foreground/90 mt-1">
                            {currentModel?.name || selectedModel}
                        </span>
                    </div>
                </div>
                <svg className={`w-4 h-4 text-muted-foreground/50 transition-transform duration-500 ${isOpen ? 'rotate-180 text-primary' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute bottom-full mb-3 left-0 right-0 md:w-80 bg-card/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[100] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-2 origin-bottom ring-1 ring-black/20">
                    <div className="p-3.5 border-b border-white/5 bg-white/5 flex items-center justify-between">
                        <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                            {view === 'providers' ? 'Select Domain' : 'Select Logic Model'}
                        </h4>
                        {view === 'models' && (
                            <button onClick={() => setView('providers')} className="text-[10px] font-black text-primary hover:opacity-80 flex items-center gap-1 uppercase tracking-tighter transition-opacity">
                                <span>&larr;</span> Back
                            </button>
                        )}
                    </div>
                    
                    <div className="max-h-72 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {view === 'providers' ? (
                            providers.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => handleSelectProvider(p)}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group/item ${selectedProvider === p.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-1 h-1 rounded-full ${selectedProvider === p.id ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary),1)]' : 'bg-slate-600'}`}></div>
                                        <span>{p.name}</span>
                                    </div>
                                    <span className="opacity-0 group-hover/item:opacity-100 transition-all transform translate-x-[-10px] group-hover/item:translate-x-0 font-mono text-primary tracking-tighter">EXECUTE</span>
                                </button>
                            ))
                        ) : (
                            activeProvider?.models.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => handleSelectModel(m)}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${selectedProvider === activeProvider.id && selectedModel === m.id ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}
                                >
                                    <div className="flex flex-col">
                                        <span>{m.name}</span>
                                        <span className="text-[8px] opacity-40 uppercase tracking-widest mt-0.5 font-mono">{m.id}</span>
                                    </div>
                                    {selectedProvider === activeProvider.id && selectedModel === m.id && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_white]"></div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
