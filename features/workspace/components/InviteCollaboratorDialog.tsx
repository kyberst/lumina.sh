
import React from 'react';
import { t } from '../../../../services/i18n';
import { toast } from '../../../../services/toastService';

interface Props {
    projectId: string;
    onClose: () => void;
}

export const InviteCollaboratorDialog: React.FC<Props> = ({ projectId, onClose }) => {

    const handleInvite = (role: 'designer' | 'programmer') => {
        const url = `${window.location.origin}${window.location.pathname}?projectId=${projectId}&role=${role}`;
        navigator.clipboard.writeText(url);
        toast.success(t('linkCopied', 'builder'));
        onClose();
    };

    return (
        <div className="space-y-4 pt-2">
            <p className="text-sm text-slate-500">{t('inviteDescription', 'builder')}</p>
            
            <div className="space-y-3">
                {/* Designer Role */}
                <div 
                    onClick={() => handleInvite('designer')}
                    className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer"
                >
                    <div className="text-indigo-500 bg-indigo-100 p-2 rounded-lg mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800">{t('inviteAsDesigner', 'builder')}</h4>
                        <p className="text-xs text-slate-500">{t('inviteAsDesignerDesc', 'builder')}</p>
                    </div>
                </div>

                {/* Programmer Role */}
                <div 
                    onClick={() => handleInvite('programmer')}
                    className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer"
                >
                    <div className="text-emerald-600 bg-emerald-100 p-2 rounded-lg mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800">{t('inviteAsProgrammer', 'builder')}</h4>
                        <p className="text-xs text-slate-500">{t('inviteAsProgrammerDesc', 'builder')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};