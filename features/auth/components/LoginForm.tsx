
import React, { useState } from 'react';
import { authService } from '../../../services/authService';
import { User } from '../../../types';
import { toast } from '../../../services/toastService';
import { t } from '../../../services/i18n';

interface Props {
    onSuccess: (u: User) => void;
    onForgotPassword: () => void;
    onRegisterClick: () => void;
}

/**
 * Formulario de Inicio de Sesión.
 * Maneja credenciales estándar y verificación de 2FA.
 */
export const LoginForm: React.FC<Props> = ({ onSuccess, onForgotPassword, onRegisterClick }) => {
    const [step, setStep] = useState(1); // 1: Credenciales, 2: 2FA
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');

    const handleLogin = async () => {
        if (!email || !password) return toast.error("Please fill fields");
        try {
            const res = await authService.login(email, password);
            if (res.require2FA) {
                setStep(2);
            } else if (res.user) {
                onSuccess(res.user);
            }
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleVerify = async () => {
        try {
            const user = await authService.verify2FALogin(code);
            onSuccess(user);
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold tracking-tight">
                    {step === 1 ? t('welcomeBack', 'auth') : '2FA Security'}
                </h2>
                <p className="text-muted-foreground text-sm mt-2">
                    {step === 1 ? t('enterDetails', 'auth') : "Enter code from Authenticator App"}
                </p>
            </div>

            {step === 1 ? (
                <>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t('email', 'auth')}</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="shadcn-input" placeholder="you@example.com" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <label className="text-sm font-medium">{t('password', 'auth')}</label>
                            <button onClick={onForgotPassword} className="text-sm font-medium text-primary hover:underline">{t('forgotPass', 'auth')}</button>
                        </div>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="shadcn-input" placeholder="••••••••" />
                    </div>
                </>
            ) : (
                <div className="space-y-1">
                    <label className="text-sm font-medium">{t('verificationCode', 'auth')}</label>
                    <input value={code} onChange={e => setCode(e.target.value)} className="shadcn-input text-center text-xl tracking-widest" maxLength={6} autoFocus />
                </div>
            )}

            <button onClick={step === 1 ? handleLogin : handleVerify} className="shadcn-btn shadcn-btn-primary w-full h-11">
                {step === 1 ? t('signIn', 'auth') : t('verify', 'auth')}
            </button>

            <div className="mt-6 text-center pt-4 border-t">
                <p className="text-muted-foreground text-sm">
                    Don't have an account? <button onClick={onRegisterClick} className="text-primary font-semibold hover:underline">{t('createOne', 'auth')}</button>
                </p>
            </div>
        </div>
    );
};
