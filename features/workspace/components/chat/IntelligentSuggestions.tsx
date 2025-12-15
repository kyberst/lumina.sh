
import React, { useState } from 'react';
import { ChatMessage } from '../../../../types';
import { t } from '../../../../services/i18n';

interface Props {
    msg: ChatMessage;
    onSuggestionResponse: (msgId: string, action: string, payload: any) => void;
}

export const IntelligentSuggestions: React.FC<Props> = ({ msg, onSuggestionResponse }) => {
    const [propValues, setPropValues] = useState<Record<string, string>>({});

    const handlePropChange = (name: string, value: string) => {
        setPropValues(prev => ({ ...prev, [name]: value }));
    };

    const handlePropSubmit = () => {
        // Find the original user prompt that triggered this
        // This is a placeholder, a more robust solution would pass the original prompt through payload
        const originalPrompt = "User's original prompt"; // This needs to be passed down
        onSuggestionResponse(msg.id, 'submit_props', { ...propValues, originalPrompt });
    };

    if (msg.suggestions) {
        return (
            <div className="mt-4 pt-4 border-t border-dashed border-slate-200 space-y-2">
                {msg.suggestions.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => onSuggestionResponse(msg.id, s.action, s.payload)}
                        className="w-full text-left p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 hover:bg-indigo-100 hover:border-indigo-300 transition-all font-semibold text-sm"
                    >
                        {s.label}
                    </button>
                ))}
            </div>
        );
    }

    if (msg.propInputs) {
        return (
            <div className="mt-4 pt-4 border-t border-dashed border-slate-200 space-y-4">
                {msg.propInputs.map(p => (
                    <div key={p.name}>
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                            {p.name} <span className="font-mono text-indigo-500 lowercase bg-indigo-50 px-1 rounded-sm">{p.type}</span>
                        </label>
                        <input
                            type="text"
                            value={propValues[p.name] || ''}
                            onChange={e => handlePropChange(p.name, e.target.value)}
                            className="shadcn-input mt-1"
                        />
                    </div>
                ))}
                <button
                    onClick={handlePropSubmit}
                    className="shadcn-btn shadcn-btn-primary w-full"
                >
                    {t('continue', 'assistant')}
                </button>
            </div>
        );
    }

    return null;
};
