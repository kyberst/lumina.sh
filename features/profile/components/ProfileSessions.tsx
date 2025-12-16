
import React, { useEffect, useState } from 'react';
import { Session } from '../../../types';
import { dbFacade } from '../../../services/dbFacade';
// FIX: Corrected import path for authService
import { authService } from '../../../services/auth';
import { toast } from '../../../services/toastService';
import { t } from '../../../services/i18n';

export const ProfileSessions: React.FC<{ userId: string }> = ({ userId }) => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [canUseBiometrics, setCanUseBiometrics] = useState(false);
    const currentSessionId = authService.getSessionId();

    const load = async () => {
        const list = await dbFacade.getUserSessions(userId);
        setSessions(list.map(s => ({ ...s, isCurrent: s.id === currentSessionId })));
    };

    useEffect(() => { 
        load();
        authService.isWebAuthnAvailable().then(setCanUseBiometrics);
    }, [userId]);

    const handleRevoke = async (id: string) => {
        if (id === currentSessionId) {
            toast.error(t('revokeCurrentSessionError', 'profile'));
            return;
        }
        await dbFacade.revokeSession(id);
        toast.success(t('sessionRevoked', 'profile'));
        load();
    };

    const handleRegisterPasskey = async () => {
        try {
            // Need email for display name in passkey
            const user = await dbFacade.getUserById(userId);
            if (!user) return;
            
            await authService.registerDevice(userId, user.email);
            toast.success(t('passkeyRegistered', 'profile'));
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-slate-500">{t('sessionsDesc', 'profile')}</p>
                {canUseBiometrics && (
                    <button 
                        onClick={handleRegisterPasskey} 
                        className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M9 6.8a6 6 0 0 1 9 5.2c0 .47 0 1.17-.02 2"/></svg>
                        {t('registerPasskey', 'profile')}
                    </button>
                )}
            </div>
            
            {sessions.map(s => (
                <div key={s.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white transition-colors">
                    <div className="flex gap-4 items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${s.isCurrent ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                {s.device?.includes('Mac') ? t('deviceMac', 'profile') : s.device?.includes('Win') ? t('deviceWindows', 'profile') : t('deviceUnknown', 'profile')}
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
