import React, { useState } from 'react';
import { JournalEntry } from '../../types';
import { t } from '../../services/i18n';

interface EntryCardProps {
  entry: JournalEntry;
  onDelete?: (id: string) => void;
  onSelect?: () => void;
  onTagClick?: (tag: string) => void;
  onUpdate?: (entry: JournalEntry) => void;
}

export const EntryCard: React.FC<EntryCardProps> = ({ entry, onDelete, onSelect, onTagClick, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(entry.project || '');

  const handleSave = (e: React.MouseEvent) => {
      e.stopPropagation();
      if(onUpdate) {
          onUpdate({ ...entry, project: editTitle });
          setIsEditing(false);
      }
  };

  const handleCancel = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditTitle(entry.project || '');
      setIsEditing(false);
  };

  return (
    <div 
        className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col hover:-translate-y-1 relative overflow-hidden" 
        onClick={onSelect}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
           <div className="flex-1 mr-4">
             {isEditing ? (
                 <div className="flex items-center gap-2 mb-1" onClick={e => e.stopPropagation()}>
                     <input 
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        className="shadcn-input h-8 text-sm"
                        autoFocus
                     />
                     <button onClick={handleSave} className="shadcn-btn shadcn-btn-primary h-8 w-8 p-0"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></button>
                     <button onClick={handleCancel} className="shadcn-btn shadcn-btn-outline h-8 w-8 p-0"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                 </div>
             ) : (
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold leading-none tracking-tight group-hover:text-primary transition-colors font-['Plus_Jakarta_Sans']">
                        {entry.project || t('untitled', 'common')}
                    </h3>
                    {onUpdate && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} 
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-all p-1"
                            title="Rename"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                    )}
                </div>
             )}
             <div className="text-xs text-muted-foreground font-mono">
                {new Date(entry.timestamp).toLocaleDateString()}
             </div>
           </div>
           
           {!isEditing && onDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(entry.projects_id); }}
              className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors text-muted-foreground opacity-0 group-hover:opacity-100"
              title="Delete Project"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
           )}
        </div>

        <p className="text-sm text-muted-foreground mb-6 line-clamp-2 leading-relaxed flex-1">
           {entry.description || entry.prompt}
        </p>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 mt-auto">
           <div className="flex flex-wrap gap-2">
             {(entry.tags ?? []).slice(0, 3).map(tag => (
               <span 
                 key={tag} 
                 onClick={(e) => { e.stopPropagation(); onTagClick && onTagClick(tag); }}
                 className="inline-flex items-center rounded-md border border-transparent px-2 py-0.5 text-xs font-semibold transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80"
               >
                 #{tag}
               </span>
             ))}
           </div>

           <button 
             className="text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wide opacity-0 group-hover:opacity-100"
           >
             {t('openStudio', 'common')} &rarr;
           </button>
        </div>
      </div>
      
      {/* Visual Tech Bar (Slim) */}
      <div className="h-0.5 w-full flex opacity-50">
         <div className="h-full bg-primary" style={{ width: `${((entry.files ?? []).filter(f => f.name.endsWith('js')).length / ((entry.files ?? []).length || 1)) * 100}%` }}></div>
         <div className="h-full bg-sky-400" style={{ width: `${((entry.files ?? []).filter(f => f.name.endsWith('html')).length / ((entry.files ?? []).length || 1)) * 100}%` }}></div>
         <div className="h-full bg-slate-300" style={{ width: `${((entry.files ?? []).filter(f => f.name.endsWith('css')).length / ((entry.files ?? []).length || 1)) * 100}%` }}></div>
      </div>
    </div>
  );
};