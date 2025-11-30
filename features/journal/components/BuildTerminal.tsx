import React from 'react';

export interface ConsoleLog {
  id: string;
  text: string;
  status: 'pending' | 'success' | 'error';
}

interface BuildTerminalProps {
  logs: ConsoleLog[];
}

export const BuildTerminal: React.FC<BuildTerminalProps> = ({ logs }) => {
  return (
    <div className="absolute inset-0 bg-[#2a1b1b] rounded-xl border border-[#ff7e15]/30 p-4 font-mono text-xs sm:text-sm overflow-y-auto custom-scrollbar shadow-[0_0_20px_rgba(255,126,21,0.1)]">
      <div className="flex items-center gap-2 mb-4 border-b border-[#ffc93a]/20 pb-2">
        <div className="w-2.5 h-2.5 rounded-full bg-[#ff2935]"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-[#ffc93a]"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-[#ff7e15]"></div>
        <span className="ml-2 text-[#ff7e15] text-[10px] uppercase tracking-widest font-bold">Builder Terminal</span>
      </div>
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3">
            <span className="text-[#ffc93a] select-none opacity-50">{'>'}</span>
            <span className={`${
              log.status === 'success' ? 'text-[#ffc93a] font-bold' : 
              log.status === 'error' ? 'text-[#ff2935] font-bold' : 'text-[#fffdf0]'
            }`}>
              {log.text}
            </span>
            {log.status === 'success' && <span className="text-[#ff7e15] ml-auto font-bold">✔</span>}
            {log.status === 'pending' && <span className="ml-auto w-2 h-4 bg-[#ff7e15]/50 animate-pulse block"></span>}
          </div>
        ))}
      </div>
    </div>
  );
};