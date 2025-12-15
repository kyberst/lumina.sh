
import React from 'react';

interface LoadingScreenProps {
  message: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-400 font-sans gap-6">
        <div className="w-20 h-20 bg-slate-800 rounded-2xl shadow-lg flex items-center justify-center border border-slate-700">
            <span className="text-white font-bold text-4xl tracking-tighter">Lu</span>
        </div>
        <div className="relative">
            <div className="w-10 h-10 rounded-full border-4 border-slate-700/50"></div>
            <div className="absolute inset-0 w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-sm font-medium animate-pulse tracking-wide">{message}</p>
    </div>
  );
};