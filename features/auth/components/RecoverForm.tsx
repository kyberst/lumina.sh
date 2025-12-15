
import React, { useState } from 'react';
// FIX: Corrected import path for authService
import { authService } from '../../../services/auth';
import { toast } from '../../../services/toastService';
import { t } from '../../../services/i18n';

interface Props {
    onSuccess: () => void;
    onCancel: () => void;
    isLoading: boolean;
}

/**
 * Formulario de Recuperación.
 * Solicita email, envía código y permite establecer nueva contraseña con validación.
 */
export const RecoverForm: React.FC<Props> = ({ onSuccess, onCancel, isLoading }) => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [expectedCode, setExpectedCode] = useState('');
    const [localSubmitting, setLocalSubmitting] = useState(false);

    const isProcessing = isLoading || localSubmitting;

    const handleSendCode = async () => {
        if (!email) return toast.error(t('errorEmailRequired', 'auth'));
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return toast.error("Invalid email format");

        setLocalSubmitting(true);
        try {
            const c = await authService.sendRecoveryCode(email);
            setExpectedCode(c);
            setStep(2);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLocalSubmitting(false);
        }
    };

    const handleReset = async () => {
        if (code !== expectedCode) return toast.error(t('errorInvalidCode', 'auth'));
        if (!password) return toast.error(t('errorNewPassword', 'auth'));
        if (password.length < 8) return toast.error("Password too short");
        if (password !== confirmPassword) return toast.error("Passwords do not match");

        setLocalSubmitting(true);
        try {
            await authService.resetPassword(email, password);
            toast.success(t('passwordChanged', 'auth'));
            onSuccess();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLocalSubmitting(false);
        }
    };

    return (
        <div className="space-y-4 animate-in zoom-in-95">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold tracking-tight">
                    {step === 1 ? t('recoverPass', 'auth') : t('setNewPass', 'auth')}
                </h2>
                <p className="text-muted-foreground text-sm mt-2">
                    {step === 1 ? t('recoverDesc1', 'auth') : t('recoverDesc2', 'auth')}
                </p>
            </div>

            {step === 1 ? (
                <div className="space-y-1">
                    <label className="text-sm font-medium">{t('email', 'auth')}</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="shadcn-input" disabled={isProcessing} />
                </div>
            ) : (
                <>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t('verificationCode', 'auth')}</label>
                        <input value={code} onChange={e => setCode(e.target.value)} className="shadcn-input text-center text-xl" maxLength={6} disabled={isProcessing} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t('newPassword', 'auth')}</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="shadcn-input" placeholder="New Password" disabled={isProcessing} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Confirm Password</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="shadcn-input" placeholder="Confirm" disabled={isProcessing} />
                    </div>
                </>
            )}

            <button onClick={step === 1 ? handleSendCode : handleReset} disabled={isProcessing} className="shadcn-btn shadcn-btn-primary w-full h-11">
                {isProcessing ? 'Processing...' : (step === 1 ? t('sendCode', 'auth') : t('resetPassword', 'auth'))}
            </button>

            <button onClick={onCancel} disabled={isProcessing} className="shadcn-btn shadcn-btn-ghost w-full h-11">
                {t('cancel', 'common')}
            </button>
        </div>
    );
};
