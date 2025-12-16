
import React from 'react';
import { JournalEntry } from '../../../../types';
import { t } from '../../../../services/i18n';

interface EntryCardViewProps {
  entry: JournalEntry;
  onDelete?: (id: string) => void;
  onSelect?: () => void;
  onTagClick?: (tag: string) => void;
  isEditing: boolean;
  editTitle: string;
  setEditTitle: (title: string) => void;
  handleSave: (e: React.MouseEvent) => void;
  handleCancel: (e: React.MouseEvent) => void;
  setIsEditing: (isEditing: boolean) => void;
}

export const EntryCardView: React.FC<EntryCardViewProps> = ({ 
    entry, onDelete, onSelect, onTagClick, isEditing, editTitle, setEditTitle, handleSave, handleCancel, setIsEditing 
}) => {
  return (
    <div 
        className="rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col h-full" 
        onClick={onSelect}
    >
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
                    <h3 className="text-lg font-semibold leading-none tracking-tight group-hover:text-primary transition-colors">
                        {entry.project || t('untitled', 'project')}
                    </h3>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} 
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-all p-1"
                        title={t('rename', 'project')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                </div>
             )}
             <div className="text-sm text-muted-foreground">
                {new Date(entry.timestamp).toLocaleDateString()}
             </div>
           </div>
           
           {!isEditing && onDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
              className="h-8 w-8 rounded-md hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-colors text-muted-foreground"
              title={t('delete', 'common')}
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
             {(entry.tags || []).slice(0, 3).map(tag => (
               <span 
                 key={tag} 
                 onClick={(e) => { e.stopPropagation(); onTagClick && onTagClick(tag); }}
                 className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
               >
                 #{tag}
               </span>
             ))}
           </div>

           <button 
             className="shadcn-btn shadcn-btn-primary h-8 px-3 text-xs"
           >
             {t('openStudio', 'project')}
           </button>
        </div>
      </div>
      
      {/* Visual Tech Bar */}
      <div className="h-1 w-full flex opacity-80 rounded-b-xl overflow-hidden">
         <div className="h-full bg-primary" style={{ width: `${((entry.files || []).filter(f => f.name.endsWith('js')).length / ((entry.files || []).length || 1)) * 100}%` }}></div>
         <div className="h-full bg-blue-400" style={{ width: `${((entry.files || []).filter(f => f.name.endsWith('html')).length / ((entry.files || []).length || 1)) * 100}%` }}></div>
         <div className="h-full bg-slate-300" style={{ width: `${((entry.files || []).filter(f => f.name.endsWith('css')).length / ((entry.files || []).length || 1)) * 100}%` }}></div>
      </div>
    </div>
  );
};
