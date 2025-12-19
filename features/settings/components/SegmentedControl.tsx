import React from 'react';

interface SegmentedControlProps {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, selected, onSelect }) => {
  return (
    <div className="flex bg-slate-100 p-1 rounded-lg w-full mt-1">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onSelect(opt.toLowerCase())}
          className={`flex-1 py-2 px-2 rounded-md text-sm font-bold transition-all ${
            selected.toLowerCase() === opt.toLowerCase()
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
};