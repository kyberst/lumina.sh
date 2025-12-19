
import React, { useState, useRef } from 'react';
import { JournalEntry, AppModule, AppSettings } from '../../types';
import { validate } from '../../services/validator';
import { ImportForm } from './components/ImportForm';
import { CreationForm } from './components/CreationForm';
import { getLanguage } from '../../services/i18n';

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
  
  // Create State
  const [content, setContent] = useState('');
  const [project, setProject] = useState('');
  const [complexity, setComplexity] = useState(50);
  const [stack, setStack] = useState<string[]>([]); // Selected tech stack
  const [appLanguages, setAppLanguages] = useState<string[]>([getLanguage() === 'es' ? 'Spanish' : 'English']); // Target App Languages
  const [attachments, setAttachments] = useState<{ name: string; type: string; data: string }[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('gemini');
  const [selectedModel, setSelectedModel] = useState<string>('flash');
  const [error, setError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  const handleSubmit = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    
    setError(null);
    try {
      validate(content, { type: 'string', minLength: 3, maxLength: 8000 }, AppModule.BUILDER);
      
      // The user-facing prompt is just their content.
      // Requirements are stored in tags and will be added to the AI prompt internally
      // during the first build process.
      const skeletonEntry: JournalEntry = {
        id: crypto.randomUUID(),
        prompt: content,
        timestamp: Date.now(),
        description: "Initializing Project...",
        files: [],
        tags: [...stack, ...appLanguages],
        mood: complexity,
        sentimentScore: 0,
        project: project.trim() || generateUniqueProjectName(),
        pendingGeneration: true, 
        contextSource: 'manual',
        envVars: {
            _INIT_PROVIDER: selectedProvider,
            _INIT_MODEL: selectedModel,
            _INIT_COMPLEXITY: complexity.toString()
        }
      };
      
      console.log('[Lumina] Starting new project. Initial prompt captured:', content);
      console.log('[Lumina] Triggering project creation with skeleton entry:', skeletonEntry);
      await onEntryCreated(skeletonEntry);

      // Reset form state after successful submission
      setContent('');
      setProject('');
      setComplexity(50);
      setStack([]);
      setAppLanguages([getLanguage() === 'es' ? 'Spanish' : 'English']);
      setAttachments([]);

    } catch (err: any) {
        setError(err.message || 'Unknown error');
    } finally {
        isSubmittingRef.current = false;
    }
  };

  const handleImportSuccess = async (entry: JournalEntry) => {
      await onEntryCreated(entry);
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-white p-2 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 relative">
      
      {/* Top Tabs (Shadcn Style) */}
      <div className="inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500 w-fit mx-auto mt-2">
         <button 
            onClick={() => setActiveTab('create')} 
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === 'create' ? 'bg-white text-slate-950 shadow-sm' : 'hover:bg-slate-200 hover:text-slate-900'}`}
         >
             New App
         </button>
         <button 
            onClick={() => setActiveTab('import')} 
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === 'import' ? 'bg-white text-slate-950 shadow-sm' : 'hover:bg-slate-200 hover:text-slate-900'}`}
         >
             Import
         </button>
      </div>

      <div className="px-6 pb-8 pt-2">
        {error && (
            <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm flex justify-between items-center shadow-sm">
            <span className="flex items-center gap-2 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                {error}
            </span>
            <button onClick={() => setError(null)} className="hover:text-red-800 ml-2">&times;</button>
            </div>
        )}

        {activeTab === 'create' && (
            <div className="relative group min-h-[14rem]">
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
            <ImportForm 
                settings={settings} 
                onImport={handleImportSuccess}
                isProcessing={false}
                setIsProcessing={() => {}}
                setError={setError}
            />
        )}
      </div>
    </div>
  );
};
