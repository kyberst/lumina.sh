import React from 'react';

interface ToggleSwitchProps {
  label: string;
  description: string;
  isChecked: boolean;
  onToggle: (isChecked: boolean) => void;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, description, isChecked, onToggle }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1 pr-4">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          checked={isChecked} 
          onChange={e => onToggle(e.target.checked)} 
          className="sr-only peer" 
        />
        <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
      </label>
    </div>
  );
};