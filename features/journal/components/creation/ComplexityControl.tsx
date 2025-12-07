import React from 'react';
import { t } from '../../../../services/i18n';

interface Props {
    value: number;
    onChange: (val: number) => void;
    disabled?: boolean;
}

export const ComplexityControl: React.FC<Props> = ({ value, onChange, disabled }) => {
    return (
        <div className="flex flex-col gap-3 bg-white text-slate-800 p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between w-full text-[11px] text-slate-900 font-black uppercase tracking-wider items-center">
                <span>Simple</span>
                <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{t('mood', 'journal')}: {value}%</span>
                <span>Complex</span>
            </div>
            <div className="relative pt-2">
                <input
                    type="range" min="0" max="100" value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
                    disabled={disabled}
                />
            </div>
        </div>
    );
};