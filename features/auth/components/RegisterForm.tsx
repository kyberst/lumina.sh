
import React, { useState } from 'react';
// FIX: Corrected import path for authService
import { authService } from '../../../services/auth';
import { User } from '../../../types';
import { toast } from '../../../services/toastService';
import { t } from '../../../services/i18n';

interface Props {
    onSuccess: (u: User) => void;
    onLoginClick: () => void;
}

/**
 * Formulario de Registro.
 * Maneja la creación de cuenta y verificación de email simulada.
 */
export const RegisterForm: React.FC<Props> = ({ onSuccess, onLoginClick }) => {
    const [step, setStep] = useState(1);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [expectedCode, setExpectedCode] = useState('');

    const handleRegister = async () => {
        if (!firstName || !lastName || !email || !password) return toast.error(t('errorFillAllFields', 'auth'));
        try {
            const fullName = `${firstName.trim()} ${lastName.trim()}`;
            const sentCode = await authService.register(fullName, email, password);
            setExpectedCode(sentCode);
            setStep(2);
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleVerify = async () => {
        if (code !== expectedCode) return toast.error(t('errorInvalidCode', 'auth'));
        try {
            const fullName = `${firstName.trim()} ${lastName.trim()}`;
            const user = await authService.completeRegistration(fullName, email, password);
            onSuccess(user);
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold tracking-tight">
                    {step === 1 ? t('createAccount', 'auth') : t('verifyEmail', 'auth')}
                </h2>
                <p className="text-muted-foreground text-sm mt-2">
                    {step === 1 ? t('enterDetails', 'auth') : t('checkEmailForCode', 'auth')}
                </p>
            </div>

            {step === 1 ? (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">{t('firstName', 'auth')}</label>
                            <input value={firstName} onChange={e => setFirstName(e.target.value)} className="shadcn-input" placeholder={t('firstNamePlaceholder', 'auth')} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">{t('lastName', 'auth')}</label>
                            <input value={lastName} onChange={e => setLastName(e.target.value)} className="shadcn-input" placeholder={t('lastNamePlaceholder', 'auth')} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t('email', 'auth')}</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="shadcn-input" placeholder={t('emailPlaceholder', 'auth')} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t('password', 'auth')}</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="shadcn-input" placeholder="••••••••" />
                    </div>
                </>
            ) : (
                <div className="space-y-1">
                    <label className="text-sm font-medium">{t('verificationCode', 'auth')}</label>
                    <input value={code} onChange={e => setCode(e.target.value)} className="shadcn-input text-center text-xl tracking-widest" maxLength={6} autoFocus />
                </div>
            )}

            <button onClick={step === 1 ? handleRegister : handleVerify} className="shadcn-btn shadcn-btn-primary w-full h-11">
                {step === 1 ? t('signUp', 'auth') : t('verify', 'auth')}
            </button>

            <div className="mt-6 text-center pt-4 border-t">
                <p className="text-muted-foreground text-sm">
                    {t('alreadyHaveAccount', 'auth')} <button onClick={onLoginClick} className="text-primary font-semibold hover:underline">{t('signIn', 'auth')}</button>
                </p>
            </div>
        </div>
    );
};
