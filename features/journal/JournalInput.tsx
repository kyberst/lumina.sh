
import React, { useState, useRef } from 'react';
import { JournalEntry, AppModule, AppSettings } from '../../types';
import { validate } from '../../services/validator';
import { ImportForm } from './components/ImportForm';
import { CreationForm } from './components/CreationForm';
import { getLanguage, t } from '../../services/i18n';

const ADJECTIVES = ['Crimson', 'Azure', 'Golden', 'Emerald', 'Starlight', 'Cosmic', 'Quantum', 'Nebula', 'Phoenix', 'Orion'];
const NOUNS = ['Forge', 'Weaver', 'Nexus', 'Voyage', 'Canvas', 'Harbor', 'Pioneer', 'Echo', 'Matrix', 'Circuit'];

function generateUniqueProjectName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const hex = Math.floor(Math.random() * 0xFFFF).toString(16).padStart(4, '0');
  return `${adj}-${noun}-${hex}`;
}

interface JournalInputProps {
  onEntryCreated: (entry: JournalEntry) => Promise<void>;
  settings: AppSettings;
}

export const JournalInput: React.FC<JournalInputProps> = ({ onEntryCreated, settings }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'import'>('create');
  const [content, setContent] = useState('');
  const [project, setProject] = useState('');
  const [complexity, setComplexity] = useState(50);
  const [stack, setStack] = useState<string[]>([]);
  const [appLanguages, setAppLanguages] = useState<string[]>([getLanguage() === 'es' ? 'Spanish' : 'English']);
  const [attachments, setAttachments] = useState<{ name: string; type: string; data: string }[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('gemini');
  const [selectedModel, setSelectedModel] = useState<string>('flash');
  const [error, setError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  const handleSubmit = async () => {
    if (isSubmittingRef.current || !content.trim()) return;
    isSubmittingRef.current = true;
    
    setError(null);
    try {
      validate(content, { type: 'string', minLength: 3, maxLength: 8000 }, AppModule.BUILDER);
      
      const skeletonEntry: JournalEntry = {
        projects_id: crypto.randomUUID(), 
        prompt: content,
        timestamp: Date.now(),
        description: t('initDescription', 'builder'),
        files: [],
        tags: [...stack, ...appLanguages],
        mood: complexity,
        sentimentScore: 0,
        project: project.trim() || generateUniqueProjectName(),
        pendingGeneration: true, 
        contextSource: 'manual',
        status: 'active', // Explicit active status
        envVars: {
            _INIT_PROVIDER: selectedProvider,
            _INIT_MODEL: selectedModel,
            _INIT_COMPLEXITY: complexity.toString()
        }
      };
      
      await onEntryCreated(skeletonEntry);

      setContent('');
      setProject('');
      setComplexity(50);
      setStack([]);
      setAttachments([]);

    } catch (err: any) {
        setError(err.message || 'Unknown error');
    } finally {
        isSubmittingRef.current = false;
    }
  };

  const handleImportSuccess = async (entry: JournalEntry) => {
      await onEntryCreated({ ...entry, status: 'active' });
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 glass-panel p-2 rounded-2xl shadow-xl shadow-black/5 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>

      <div className="inline-flex h-10 items-center justify-center rounded-xl bg-muted p-1 text-muted-foreground w-fit mx-auto mt-4 mb-2">
         <button onClick={() => setActiveTab('create')} className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${activeTab === 'create' ? 'bg-background text-foreground shadow-sm scale-105' : 'hover:bg-background/50 hover:text-foreground'}`}>
             {t('creation.newApp', 'builder')}
         </button>
         <button onClick={() => setActiveTab('import')} className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${activeTab === 'import' ? 'bg-background text-foreground shadow-sm scale-105' : 'hover:bg-background/50 hover:text-foreground'}`}>
             {t('creation.importApp', 'builder')}
         </button>
      </div>

      <div className="px-6 pb-8 pt-2 relative z-10">
        {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex justify-between items-center">
            <span className="flex items-center gap-2 font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                {error}
            </span>
            <button onClick={() => setError(null)} className="hover:text-red-800 dark:hover:text-red-200 ml-2">&times;</button>
            </div>
        )}

        {activeTab === 'create' && (
            <div className="relative group min-h-[14rem] animate-in fade-in duration-300">
                <CreationForm 
                    settings={settings}
                    content={content} setContent={setContent}
                    project={project} setProject={setProject}
                    complexity={complexity} setComplexity={setComplexity}
                    stack={stack} setStack={setStack}
                    appLanguages={appLanguages} setAppLanguages={setAppLanguages}
                    isProcessing={false} onSubmit={handleSubmit}
                    attachments={attachments} setAttachments={setAttachments}
                    selectedProvider={selectedProvider} setSelectedProvider={setSelectedProvider}
                    selectedModel={selectedModel} setSelectedModel={setSelectedModel}
                />
            </div>
        )}

        {activeTab === 'import' && (
            <div className="animate-in fade-in duration-300">
                <ImportForm 
                    settings={settings} onImport={handleImportSuccess}
                    isProcessing={false} setIsProcessing={() => {}} setError={setError}
                />
            </div>
        )}
      </div>
    </div>
  );
};
