
import React, { useState } from 'react';
// FIX: Corrected import path for authService
import { authService } from '../../../services/auth';
import { User } from '../../../types';
import { toast } from '../../../services/toastService';
import { t } from '../../../services/i18n';

interface Props {
    onSuccess: (u: User) => void;
    onLoginClick: () => void;
    isLoading: boolean;
}

/**
 * Formulario de Registro.
 * Maneja la creación de cuenta con validación de fortaleza de contraseña.
 */
export const RegisterForm: React.FC<Props> = ({ onSuccess, onLoginClick, isLoading }) => {
    const [step, setStep] = useState(1);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [expectedCode, setExpectedCode] = useState('');
    const [localSubmitting, setLocalSubmitting] = useState(false);

    const isProcessing = isLoading || localSubmitting;

    // Zero-Cost Frontend Validation Logic
    const validateForm = (): boolean => {
        if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
            toast.error(t('errorFillAllFields', 'auth'));
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Invalid email format");
            return false;
        }

        // Strong Password Check (Min 8 chars, 1 number)
        if (password.length < 8) {
            toast.error("Password must be at least 8 characters long.");
            return false;
        }
        if (!/\d/.test(password)) {
            toast.error("Password must contain at least one number.");
            return false;
        }

        return true;
    };

    const handleRegister = async () => {
        if (!validateForm()) return;
        
        setLocalSubmitting(true);
        try {
            const fullName = `${firstName.trim()} ${lastName.trim()}`;
            const sentCode = await authService.register(fullName, email, password);
            setExpectedCode(sentCode);
            setStep(2);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLocalSubmitting(false);
        }
    };

    const handleVerify = async () => {
        if (code !== expectedCode) return toast.error(t('errorInvalidCode', 'auth'));
        
        setLocalSubmitting(true);
        try {
            const fullName = `${firstName.trim()} ${lastName.trim()}`;
            const user = await authService.completeRegistration(fullName, email, password);
            onSuccess(user);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLocalSubmitting(false);
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
                            <input value={firstName} onChange={e => setFirstName(e.target.value)} className="shadcn-input" placeholder={t('firstNamePlaceholder', 'auth')} disabled={isProcessing} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">{t('lastName', 'auth')}</label>
                            <input value={lastName} onChange={e => setLastName(e.target.value)} className="shadcn-input" placeholder={t('lastNamePlaceholder', 'auth')} disabled={isProcessing} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t('email', 'auth')}</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="shadcn-input" placeholder={t('emailPlaceholder', 'auth')} disabled={isProcessing} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t('password', 'auth')}</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="shadcn-input" placeholder="Min 8 chars, 1 number" disabled={isProcessing} />
                        {password.length > 0 && password.length < 8 && <p className="text-[10px] text-amber-600">Weak password</p>}
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
                    />
                </div>
            )}

            <button 
                onClick={step === 1 ? handleRegister : handleVerify} 
                disabled={isProcessing}
                className="shadcn-btn shadcn-btn-primary w-full h-11 flex items-center justify-center gap-2"
            >
                {isProcessing && <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                {step === 1 ? t('signUp', 'auth') : t('verify', 'auth')}
            </button>

            <div className="mt-6 text-center pt-4 border-t">
                <p className="text-muted-foreground text-sm">
                    {t('alreadyHaveAccount', 'auth')} <button onClick={onLoginClick} disabled={isProcessing} className="text-primary font-semibold hover:underline">{t('signIn', 'auth')}</button>
                </p>
            </div>
        </div>
    );
};
