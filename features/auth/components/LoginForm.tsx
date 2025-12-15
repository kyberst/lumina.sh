
import React, { useState } from 'react';
// FIX: Corrected import path for authService
import { authService } from '../../../services/auth';
import { User } from '../../../types';
import { toast } from '../../../services/toastService';
import { t } from '../../../services/i18n';

interface Props {
    onSuccess: (u: User) => void;
    onForgotPassword: () => void;
    onRegisterClick: () => void;
    isLoading: boolean;
}

/**
 * Formulario de Inicio de Sesión.
 * Maneja credenciales estándar y verificación de 2FA.
 */
export const LoginForm: React.FC<Props> = ({ onSuccess, onForgotPassword, onRegisterClick, isLoading }) => {
    const [step, setStep] = useState(1); // 1: Credenciales, 2: 2FA
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [localSubmitting, setLocalSubmitting] = useState(false);

    const isProcessing = isLoading || localSubmitting;

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) return toast.error(t('errorFillFields', 'auth'));
        
        setLocalSubmitting(true);
        try {
            const res = await authService.login(email, password);
            if (res.require2FA) {
                setStep(2);
            } else if (res.user) {
                onSuccess(res.user);
            }
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLocalSubmitting(false);
        }
    };

    const handleVerify = async () => {
        if (!code.trim()) return;
        setLocalSubmitting(true);
        try {
            const user = await authService.verify2FALogin(code);
            onSuccess(user);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLocalSubmitting(false);
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold tracking-tight">
                    {step === 1 ? t('welcomeBack', 'auth') : t('twoFATitle', 'auth')}
                </h2>
                <p className="text-muted-foreground text-sm mt-2">
                    {step === 1 ? t('enterDetails', 'auth') : t('twoFADesc', 'auth')}
                </p>
            </div>

            {step === 1 ? (
                <>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t('email', 'auth')}</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            className="shadcn-input" 
                            placeholder={t('emailPlaceholder', 'auth')} 
                            disabled={isProcessing}
                        />
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <label className="text-sm font-medium">{t('password', 'auth')}</label>
                            <button onClick={onForgotPassword} disabled={isProcessing} className="text-sm font-medium text-primary hover:underline">{t('forgotPass', 'auth')}</button>
                        </div>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            className="shadcn-input" 
                            placeholder="••••••••" 
                            disabled={isProcessing}
                            onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        />
                    </div>
                </>
            ) : (
                <div className="space-y-1">
                    <label className="text-sm font-medium">{t('verificationCode', 'auth')}</label>
                    <input 
                        value={code} 
                        onChange={e => setCode(e.target.value)} 
                        className="shadcn-input text-center text-xl tracking-widest" 
                        maxLength={6} 
                        autoFocus 
                        disabled={isProcessing}
                        onKeyDown={e => e.key === 'Enter' && handleVerify()}
                    />
                </div>
            )}

            <button 
                onClick={step === 1 ? handleLogin : handleVerify} 
                disabled={isProcessing}
                className="shadcn-btn shadcn-btn-primary w-full h-11 flex items-center justify-center gap-2"
            >
                {isProcessing && <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                {step === 1 ? t('signIn', 'auth') : t('verify', 'auth')}
            </button>

            <div className="mt-6 text-center pt-4 border-t">
                <p className="text-muted-foreground text-sm">
                    {t('noAccount', 'auth')} <button onClick={onRegisterClick} disabled={isProcessing} className="text-primary font-semibold hover:underline">{t('createOne', 'auth')}</button>
                </p>
            </div>
        </div>
    );
};
