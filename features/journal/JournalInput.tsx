
import React, { useState } from 'react';
import { JournalEntry, AppModule, AppSettings } from '../../types';
import { validate } from '../../services/validator';
import { ImportForm } from './components/ImportForm';
import { CreationForm } from './components/CreationForm';
import { getLanguage, t } from '../../services/i18n';

interface JournalInputProps {
  onEntryCreated: (entry: JournalEntry) => void;
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

  const handleSubmit = async () => {
    setError(null);
    try {
      validate(content, { type: 'string', minLength: 3, maxLength: 8000 }, AppModule.BUILDER);
      
      let finalPrompt = content;
      
      const requirements = [];
      if (stack.length > 0) requirements.push(`Tech Stack: ${stack.join(', ')}`);
      if (appLanguages.length > 0) requirements.push(`Target App Languages: ${appLanguages.join(', ')}`);
      
      if (requirements.length > 0) {
          finalPrompt += `\n\nRequirements:\n- ${requirements.join('\n- ')}`;
      }

      const skeletonEntry: JournalEntry = {
        id: crypto.randomUUID(),
        prompt: finalPrompt,
        timestamp: Date.now(),
        description: "Initializing Project...",
        files: [],
        tags: [...stack, ...appLanguages],
        mood: complexity,
        sentimentScore: 0,
        project: project.trim() || t('untitled', 'project'),
        pendingGeneration: true, 
        contextSource: 'manual',
        envVars: {
            _INIT_PROVIDER: selectedProvider,
            _INIT_MODEL: selectedModel,
            _INIT_COMPLEXITY: complexity.toString()
        }
      };

      onEntryCreated(skeletonEntry);

    } catch (err: any) {
        setError(err.message || 'Unknown error');
    }
  };

  const handleImportSuccess = async (entry: JournalEntry) => {
      onEntryCreated(entry);
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-white p-2 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 relative">
      
      {/* Top Tabs (Shadcn Style) */}
      <div className="inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500 w-fit mx-auto mt-2">
         <button 
            onClick={() => setActiveTab('create')} 
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === 'create' ? 'bg-white text-slate-950 shadow-sm' : 'hover:bg-slate-200 hover:text-slate-900'}`}
         >
             {t('newApp', 'builder')}
         </button>
         <button 
            onClick={() => setActiveTab('import')} 
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === 'import' ? 'bg-white text-slate-950 shadow-sm' : 'hover:bg-slate-200 hover:text-slate-900'}`}
         >
             {t('import', 'builder')}
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