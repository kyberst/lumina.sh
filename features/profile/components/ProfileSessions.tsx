
import React, { useEffect, useState } from 'react';
import { Session } from '../../../types';
import { dbFacade } from '../../../services/dbFacade';
// FIX: Corrected import path for authService
import { authService } from '../../../services/auth';
import { toast } from '../../../services/toastService';
import { t } from '../../../services/i18n';

export const ProfileSessions: React.FC<{ userId: string }> = ({ userId }) => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const currentSessionId = authService.getSessionId();

    const load = async () => {
        const list = await dbFacade.getUserSessions(userId);
        setSessions(list.map(s => ({ ...s, isCurrent: s.id === currentSessionId })));
    };

    useEffect(() => { load(); }, [userId]);

    const handleRevoke = async (id: string) => {
        if (id === currentSessionId) {
            toast.error(t('revokeCurrentSessionError', 'profile'));
            return;
        }
        await dbFacade.revokeSession(id);
        toast.success(t('sessionRevoked', 'profile'));
        load();
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-slate-500 mb-4">{t('sessionsDesc', 'profile')}</p>
            {sessions.map(s => (
                <div key={s.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white transition-colors">
                    <div className="flex gap-4 items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${s.isCurrent ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                {s.device.includes('Mac') ? t('deviceMac', 'profile') : s.device.includes('Win') ? t('deviceWindows', 'profile') : t('deviceUnknown', 'profile')}
                                {s.isCurrent && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">{t('currentSession', 'profile')}</span>}
                            </div>
                            <div className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-xs">{s.device}</div>
                            <div className="text-[10px] text-slate-400 mt-1">
                                {t('ipAddress', 'profile')} {s.ip} • {t('lastActive', 'profile')} {new Date(s.lastActive).toLocaleDateString()} {new Date(s.lastActive).toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                    {!s.isCurrent && (
                        <button onClick={() => handleRevoke(s.id)} className="mt-3 sm:mt-0 text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded transition-colors">
                            {t('revokeAccess', 'profile')}
                        </button>
                    )}
                </div>
            ))}
            {sessions.length === 0 && <div className="text-slate-400 text-sm">{t('noSessions', 'profile')}</div>}
        </div>
    );
};
