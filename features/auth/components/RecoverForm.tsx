
import React, { useState } from 'react';
import { authService } from '../../../services/authService';
import { toast } from '../../../services/toastService';
import { t } from '../../../services/i18n';

interface Props {
    onSuccess: () => void;
    onCancel: () => void;
}

/**
 * Formulario de Recuperación.
 * Solicita email, envía código y permite establecer nueva contraseña.
 */
export const RecoverForm: React.FC<Props> = ({ onSuccess, onCancel }) => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [expectedCode, setExpectedCode] = useState('');

    const handleSendCode = async () => {
        if (!email) return toast.error("Email required");
        try {
            const c = await authService.sendRecoveryCode(email);
            setExpectedCode(c);
            setStep(2);
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleReset = async () => {
        if (code !== expectedCode) return toast.error("Invalid Code");
        if (!password) return toast.error("Enter new password");
        try {
            await authService.resetPassword(email, password);
            toast.success("Password Changed");
            onSuccess();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return (
        <div className="space-y-4 animate-in zoom-in-95">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold tracking-tight">
                    {step === 1 ? t('recoverPass', 'auth') : t('setNewPass', 'auth')}
                </h2>
                <p className="text-muted-foreground text-sm mt-2">
                    {step === 1 ? "We'll send you a verification code." : "Create a secure password."}
                </p>
            </div>

            {step === 1 ? (
                <div className="space-y-1">
                    <label className="text-sm font-medium">{t('email', 'auth')}</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="shadcn-input" />
                </div>
            ) : (
                <>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t('verificationCode', 'auth')}</label>
                        <input value={code} onChange={e => setCode(e.target.value)} className="shadcn-input text-center text-xl" maxLength={6} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t('newPassword', 'auth')}</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="shadcn-input" />
                    </div>
                </>
            )}

            <button onClick={step === 1 ? handleSendCode : handleReset} className="shadcn-btn shadcn-btn-primary w-full h-11">
                {step === 1 ? t('sendCode', 'auth') : 'Reset Password'}
            </button>

            <button onClick={onCancel} className="shadcn-btn shadcn-btn-ghost w-full h-11">
                {t('cancel', 'common')}
            </button>
        </div>
    );
};
