
import React, { useState } from 'react';
// FIX: Corrected import path for authService
import { authService } from '../../../services/auth';
import { toast } from '../../../services/toastService';
import { t } from '../../../services/i18n';

interface Props {
    userId: string;
}

export const ChangePasswordForm: React.FC<Props> = ({ userId }) => {
    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [loading, setLoading] = useState(false);

    const validate = (): boolean => {
        if (!currentPass || !newPass || !confirmPass) {
            toast.error(t('error.fillFields', 'auth'));
            return false;
        }
        
        if (newPass.length < 8) {
            toast.error(t('errorPasswordShort', 'profile'));
            return false;
        }

        // Deterministic Strength Check (At least 1 number)
        if (!/\d/.test(newPass)) {
            toast.error(t('errorPasswordWeak', 'profile'));
            return false;
        }

        if (newPass !== confirmPass) {
            toast.error(t('errorPasswordMismatch', 'profile'));
            return false;
        }

        if (currentPass === newPass) {
            toast.error(t('errorPasswordSame', 'profile'));
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            await authService.changePassword(userId, currentPass, newPass);
            toast.success(t('passwordUpdatedSuccess', 'profile'));
            // Reset form
            setCurrentPass('');
            setNewPass('');
            setConfirmPass('');
        } catch (e: any) {
            toast.error(e.message || t('unknownError', 'common'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                {t('changePassword', 'profile')}
            </h4>
            
            <div className="space-y-4 max-w-md">
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">{t('currentPassword', 'profile')}</label>
                    <input 
                        type="password" 
                        className="shadcn-input bg-white" 
                        value={currentPass}
                        onChange={e => setCurrentPass(e.target.value)}
                        disabled={loading}
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">{t('newPassword', 'profile')}</label>
                        <input 
                            type="password" 
                            className="shadcn-input bg-white" 
                            value={newPass}
                            onChange={e => setNewPass(e.target.value)}
                            placeholder={t('passwordPlaceholder', 'profile')}
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">{t('confirmNewPassword', 'profile')}</label>
                        <input 
                            type="password" 
                            className="shadcn-input bg-white" 
                            value={confirmPass}
                            onChange={e => setConfirmPass(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <button 
                        onClick={handleSubmit} 
                        disabled={loading}
                        className="shadcn-btn shadcn-btn-primary w-full sm:w-auto px-6 text-xs font-bold uppercase tracking-wide"
                    >
                        {loading ? t('updating', 'profile') : t('updatePassword', 'profile')}
                    </button>
                </div>
            </div>
        </div>
    );
};
