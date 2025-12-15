
import React, { useState, useEffect } from 'react';
import { EnvVarRequest } from '../../../types';
import { toast } from '../../../services/toastService';
import { t } from '../../../services/i18n';

export const EnvVarRequestMessage: React.FC<{ 
    requests: EnvVarRequest[], 
    saved: boolean, 
    onSave: (values: Record<string, string>) => void 
}> = ({ requests, saved, onSave }) => {
    const [values, setValues] = useState<Record<string, string>>({});

    useEffect(() => {
        const defaults: Record<string, string> = {};
        requests.forEach(r => {
            if(r.defaultValue) defaults[r.key] = r.defaultValue;
        });
        setValues(defaults);
    }, [requests]);

    const handleSubmit = () => {
        for (const req of requests) {
            if (!values[req.key] && !req.defaultValue) {
                toast.error(t('missingValue', 'env').replace('{key}', req.key));
                return;
            }
        }
        onSave(values);
    };

    if (saved) {
        return (
            <div className="bg-[#ffffbb]/50 border border-[#ffc93a]/50 p-3 rounded-xl text-xs mt-2 flex items-center gap-2">
                <span className="text-[#ff7e15] font-bold">✔</span>
                <span className="text-[#ff7e15]">{t('varsSaved', 'env')}</span>
            </div>
        );
    }

    return (
        <div className="bg-white border border-[#ffc93a] p-5 rounded-2xl mt-3 shadow-lg shadow-[#ffc93a]/10 animate-in zoom-in-95 relative overflow-hidden">
            {/* Security Ribbon */}
            <div className="absolute top-0 right-0 bg-[#ffc93a] text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl shadow-sm uppercase tracking-wider flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                {t('secureStorage', 'env')}
            </div>

            <h4 className="text-[#ff7e15] text-xs font-extrabold uppercase tracking-widest mb-4 flex items-center gap-2">
                {t('configRequired', 'env')}
            </h4>
            <div className="space-y-4">
                {requests.map(req => (
                    <div key={req.key}>
                        <label className="block text-[10px] text-slate-400 mb-1.5 uppercase font-bold tracking-wider">{req.key}</label>
                        {req.type === 'select' && req.options ? (
                            <select 
                                className="w-full bg-[#ffffbb]/30 border border-[#ffc93a]/50 hover:border-[#ff7e15] rounded-xl p-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#ffff7e] transition-all cursor-pointer font-bold"
                                value={values[req.key] || ''}
                                onChange={e => setValues({...values, [req.key]: e.target.value})}
                            >
                                <option value="">{t('selectOption', 'env')}</option>
                                {req.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        ) : (
                            <div className="relative group">
                                <input 
                                    type={req.type === 'text' ? 'text' : 'password'}
                                    className="w-full bg-[#ffffbb]/30 border border-[#ffc93a]/50 hover:border-[#ff7e15] rounded-xl p-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#ffff7e] transition-all font-mono placeholder:text-slate-400"
                                    placeholder={req.description}
                                    value={values[req.key] || ''}
                                    onChange={e => setValues({...values, [req.key]: e.target.value})}
                                />
                                <div className="text-[10px] text-slate-400 mt-1.5 ml-1">{req.description}</div>
                            </div>
                        )}
                    </div>
                ))}
                <button 
                    onClick={handleSubmit}
                    className="w-full bg-gradient-to-r from-[#ff7e15] to-[#ff2935] hover:from-[#ff2935] hover:to-[#ff7e15] text-white py-3 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all shadow-lg shadow-[#ff7e15]/20 mt-2 transform hover:-translate-y-0.5"
                >
                    {t('encryptAndSave', 'env')}
                </button>
            </div>
        </div>
    );
};
