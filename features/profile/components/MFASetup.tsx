
import React, { useState } from 'react';
import { User } from '../../../types';
import { authService } from '../../../services/auth';
import { toast } from '../../../services/toastService';
import { t } from '../../../services/i18n';
import { dialogService } from '../../../services/dialogService';

interface Props {
    user: User;
    onUpdate: (u: User) => void;
}

export const MFASetup: React.FC<Props> = ({ user, onUpdate }) => {
    const [isSettingUp, setIsSettingUp] = useState(false);
    const [qrData, setQrData] = useState<{ secret: string, qrCodeUrl: string } | null>(null);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const startSetup = async () => {
        setLoading(true);
        try {
            const data = await authService.generateMFASecret(user.id);
            setQrData(data);
            setIsSettingUp(true);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (code.length !== 6) return toast.error(t('error.invalidCodeLength', 'auth'));
        
        setLoading(true);
        try {
            await authService.verifyAndActivateMFA(user.id, code);
            toast.success(t('mfaActivated', 'profile'));
            onUpdate({ ...user, twoFactorEnabled: true });
            setIsSettingUp(false);
            setQrData(null);
            setCode('');
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDisable = async () => {
        const confirmed = await dialogService.confirm(
            t('disableMFATitle', 'profile'),
            t('disableMFADesc', 'profile'),
            { destructive: true, confirmText: t('disable', 'profile') }
        );

        if (confirmed) {
            setLoading(true);
            try {
                await authService.disableMFA(user.id);
                toast.success(t('mfaDisabled', 'profile'));
                onUpdate({ ...user, twoFactorEnabled: false });
            } catch (e: any) {
                toast.error(e.message);
            } finally {
                setLoading(false);
            }
        }
    };

    if (user.twoFactorEnabled) {
        return (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 mb-8">
                <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                        <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">{t('mfaActiveTitle', 'profile')}</h4>
                            <p className="text-xs text-slate-600 mt-1 max-w-sm">{t('mfaActiveDesc', 'profile')}</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleDisable} 
                        disabled={loading}
                        className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded transition-colors"
                    >
                        {loading ? t('processing', 'common') : t('disableMFA', 'profile')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
            {!isSettingUp ? (
                <div className="flex justify-between items-center">
                    <div className="flex items-start gap-4">
                        <div className="bg-slate-200 text-slate-500 p-2 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">{t('mfaInactiveTitle', 'profile')}</h4>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm">{t('mfaInactiveDesc', 'profile')}</p>
                        </div>
                    </div>
                    <button 
                        onClick={startSetup} 
                        disabled={loading}
                        className="shadcn-btn shadcn-btn-primary h-9 text-xs"
                    >
                        {loading ? t('processing', 'common') : t('setupMFA', 'profile')}
                    </button>
                </div>
            ) : (
                <div className="animate-in fade-in zoom-in-95">
                    <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <button onClick={() => setIsSettingUp(false)} className="text-slate-400 hover:text-slate-600 mr-2">←</button>
                        {t('setupMFASteps', 'profile')}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex flex-col items-center justify-center bg-white p-4 rounded-lg border border-slate-200">
                            {qrData && <img src={qrData.qrCodeUrl} alt="QR Code" className="w-40 h-40 mix-blend-multiply" />}
                            <div className="mt-4 text-center">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{t('manualEntry', 'profile')}</p>
                                <code className="text-sm font-mono bg-slate-100 px-2 py-1 rounded select-all">{qrData?.secret}</code>
                            </div>
                        </div>
                        
                        <div className="flex flex-col justify-center space-y-4">
                            <ol className="list-decimal list-inside text-xs text-slate-600 space-y-2">
                                <li>{t('step1Download', 'profile')}</li>
                                <li>{t('step2Scan', 'profile')}</li>
                                <li>{t('step3Enter', 'profile')}</li>
                            </ol>
                            
                            <div className="pt-2">
                                <label className="text-xs font-bold text-slate-500 mb-1 block">{t('verificationCode', 'auth')}</label>
                                <div className="flex gap-2">
                                    <input 
                                        value={code}
                                        onChange={e => setCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                                        className="shadcn-input text-center font-mono tracking-widest text-lg"
                                        placeholder="000000"
                                        maxLength={6}
                                        onKeyDown={e => e.key === 'Enter' && handleVerify()}
                                    />
                                    <button 
                                        onClick={handleVerify}
                                        disabled={loading || code.length !== 6}
                                        className="shadcn-btn shadcn-btn-primary"
                                    >
                                        {loading ? '...' : t('login.action.verify', 'auth')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
