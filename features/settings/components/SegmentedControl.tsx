
import React from 'react';

interface SegmentedControlProps {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, selected, onSelect }) => {
  return (
    <div className="flex bg-muted p-1 rounded-lg w-full ring-1 ring-border/50">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onSelect(opt.toLowerCase())}
          className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold transition-all duration-200 ${
            selected.toLowerCase() === opt.toLowerCase()
              ? 'bg-background text-foreground shadow-sm scale-[1.02] ring-1 ring-black/5 dark:ring-white/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
};
