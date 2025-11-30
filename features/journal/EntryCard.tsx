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
        className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-[#ffc93a]/20 hover:border-[#ffc93a]/50 hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative" 
        onClick={onSelect}
    >
      {/* Decorative gradient blob */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-[#ffff7e] to-[#ff7e15]/20 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

      <div className="p-7 relative z-10">
        <div className="flex justify-between items-start mb-4">
           <div className="flex-1 mr-4">
             {isEditing ? (
                 <div className="flex items-center gap-2 mb-1" onClick={e => e.stopPropagation()}>
                     <input 
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        className="bg-slate-50 border-2 border-[#ffc93a] rounded-xl px-3 py-1.5 text-lg font-bold text-slate-800 outline-none w-full focus:ring-4 focus:ring-[#ffff7e]"
                        autoFocus
                     />
                     <button onClick={handleSave} className="bg-emerald-100 text-emerald-600 rounded-lg p-2 hover:bg-emerald-200 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></button>
                     <button onClick={handleCancel} className="bg-rose-100 text-rose-600 rounded-lg p-2 hover:bg-rose-200 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                 </div>
             ) : (
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-extrabold text-slate-800 tracking-tight group-hover:text-[#ff7e15] transition-colors font-['Plus_Jakarta_Sans']">
                        {entry.project || 'Untitled App'}
                    </h3>
                    {onUpdate && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} 
                            className="opacity-50 hover:opacity-100 text-slate-400 hover:text-[#ff7e15] transition-all p-1.5 rounded-full hover:bg-[#ffff7e]"
                            title="Rename"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                    )}
                </div>
             )}
             <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                {new Date(entry.timestamp).toLocaleDateString()}
             </div>
           </div>
           
           {onDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
              className="p-2 text-slate-300 hover:text-[#ff2935] hover:bg-rose-50 rounded-xl transition-all"
              title="Delete Project"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
           )}
        </div>

        <p className="text-slate-500 text-sm mb-6 line-clamp-2 leading-relaxed font-medium">
           {entry.description || entry.prompt}
        </p>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-50">
           <div className="flex flex-wrap gap-2">
             {entry.tags.slice(0, 3).map(tag => (
               <span 
                 key={tag} 
                 onClick={(e) => { e.stopPropagation(); onTagClick && onTagClick(tag); }}
                 className="text-[10px] font-bold px-3 py-1.5 bg-[#ffffbb] text-slate-600 rounded-full hover:bg-[#ffc93a] hover:text-white cursor-pointer transition-colors border border-[#ffff7e]"
               >
                 #{tag}
               </span>
             ))}
             {entry.tags.length > 3 && <span className="text-[10px] text-slate-400 self-center font-bold px-2">+{entry.tags.length - 3}</span>}
           </div>

           <button 
             className="bg-[#fff7e6] text-[#ff7e15] group-hover:bg-[#ff7e15] group-hover:text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm"
           >
             Open Studio 
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
           </button>
        </div>
      </div>
      
      {/* Visual Tech Bar - Warm Palette */}
      <div className="h-1.5 w-full flex opacity-80">
         <div className="h-full bg-[#ff2935]" style={{ width: `${(entry.files.filter(f => f.name.endsWith('js')).length / (entry.files.length || 1)) * 100}%` }}></div>
         <div className="h-full bg-[#ff7e15]" style={{ width: `${(entry.files.filter(f => f.name.endsWith('html')).length / (entry.files.length || 1)) * 100}%` }}></div>
         <div className="h-full bg-[#ffc93a]" style={{ width: `${(entry.files.filter(f => f.name.endsWith('css')).length / (entry.files.length || 1)) * 100}%` }}></div>
      </div>
    </div>
  );
};