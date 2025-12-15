
import React, { useState } from 'react';
import { ChatMessage, GeneratedFile, AppSettings } from '../../../../types';
import { ChatMessageItem } from '../ChatMessageItem';
import { t } from '../../../../services/i18n';

interface TaskGroupProps {
    userMsg: ChatMessage;
    modelMsg: ChatMessage;
    prevSnapshot?: GeneratedFile[];
    onRegenerate: (messageId: string) => void;
    onEnvVarSave: (messageId: string, vals: Record<string, string>) => void;
    settings: AppSettings;
    onSuggestionResponse: (msgId: string, action: string, payload: any) => void;
}

export const TaskGroup: React.FC<TaskGroupProps> = (props) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const summaryText = props.userMsg.text.length > 80 
        ? props.userMsg.text.substring(0, 80) + '...'
        : props.userMsg.text;

    if (!isExpanded) {
        return (
            <div 
                className="bg-white border border-emerald-200 p-4 rounded-2xl shadow-md shadow-emerald-500/10 cursor-pointer hover:bg-emerald-50/50 transition-all group"
                onClick={() => setIsExpanded(true)}
            >
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600 shadow-sm shadow-emerald-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-700">{t('taskCompleted', 'builder')}</h3>
                            <p className="text-xs text-slate-500 italic">"{summaryText}"</p>
                        </div>
                    </div>
                    <div className="text-slate-400 group-hover:text-indigo-600 transition-transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                </div>
                {props.modelMsg.checkpointName && (
                    <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center gap-2" title={props.modelMsg.checkpointName}>
                        <div className="text-amber-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                        </div>
                        <span className="text-xs font-bold text-amber-700">{t('checkpoint', 'builder')}</span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-slate-100/50 border border-slate-200 p-4 rounded-2xl space-y-4 animate-in fade-in">
             <div className="flex justify-between items-center cursor-pointer group" onClick={() => setIsExpanded(false)}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-indigo-600">{t('taskDetails', 'builder')}</h3>
                <div className="text-slate-400 group-hover:text-indigo-600 transition-transform duration-300 rotate-180">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
             </div>
            <ChatMessageItem msg={props.userMsg} {...props} />
            <ChatMessageItem msg={props.modelMsg} prevSnapshot={props.prevSnapshot} {...props} />
        </div>
    );
};
