import React from 'react';

interface Props {
  selectors: string[];
  onUse: () => void;
  onRemove: (selector: string) => void;
  onClear: () => void;
}

export const ChatContextTray: React.FC<Props> = ({ selectors, onUse, onRemove, onClear }) => {
  if (selectors.length === 0) return null;

  return (
    <div className="p-3 bg-indigo-50 border-t border-b border-indigo-200 animate-in fade-in slide-in-from-top-2 shadow-inner">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Selected Elements ({selectors.length})</h4>
        <div className="flex gap-2">
          <button onClick={onUse} className="shadcn-btn shadcn-btn-primary h-7 px-3 text-xs">Use in Chat</button>
          <button onClick={onClear} className="shadcn-btn shadcn-btn-outline bg-white h-7 px-3 text-xs">Clear</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar p-1">
        {selectors.map((selector, i) => (
          <div key={i} className="bg-white text-xs font-mono px-2 py-1 rounded-md flex items-center gap-2 border border-indigo-200 text-indigo-700 shadow-sm animate-in zoom-in-95">
            <span className="truncate max-w-xs">{selector}</span>
            <button onClick={() => onRemove(selector)} className="text-indigo-300 hover:text-red-500 font-bold leading-none text-base">&times;</button>
          </div>
        ))}
      </div>
    </div>
  );
};
