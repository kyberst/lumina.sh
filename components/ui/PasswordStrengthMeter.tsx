
import React from 'react';
import { PasswordStrengthResult } from '../../services/auth/passwordStrength';

interface Props {
    result: PasswordStrengthResult;
}

export const PasswordStrengthMeter: React.FC<Props> = ({ result }) => {
    if (!result.label) return null;

    return (
        <div className="mt-2 space-y-1 animate-in fade-in slide-in-from-top-1">
            <div className="flex gap-1 h-1.5 w-full">
                {[0, 1, 2, 3].map((level) => (
                    <div
                        key={level}
                        className={`h-full flex-1 rounded-full transition-colors duration-300 ${
                            result.score > level ? result.color : 'bg-slate-200'
                        }`}
                    />
                ))}
            </div>
            <div className={`text-[10px] font-bold uppercase tracking-wider text-right transition-colors ${result.score < 2 ? 'text-red-500' : result.score === 2 ? 'text-amber-500' : 'text-emerald-600'}`}>
                {result.label}
            </div>
        </div>
    );
};
