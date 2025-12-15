
import { useState, useEffect } from 'react';
import { authService } from '../../../../services/auth';
import { checkPasswordStrength, PasswordStrengthResult } from '../../../../services/auth/passwordStrength';
import { toast } from '../../../../services/toastService';
import { t } from '../../../../services/i18n';

export const useRecoverForm = (onSuccess: () => void) => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [passwordStrength, setPasswordStrength] = useState<PasswordStrengthResult>({ score: 0, label: '', color: '', isSafe: false });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(0);

    // Analyze password strength
    useEffect(() => {
        setPasswordStrength(checkPasswordStrength(password));
    }, [password]);

    // Countdown Timer
    useEffect(() => {
        let timer: any;
        if (resendCountdown > 0) {
            timer = setTimeout(() => setResendCountdown(prev => prev - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [resendCountdown]);

    const handleSendCode = async () => {
        if (!email) return toast.error(t('errorEmailRequired', 'auth'));
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("Invalid email format");

        setIsSubmitting(true);
        try {
            await authService.sendRecoveryCode(email);
            setStep(2);
            setResendCountdown(60); // Start cooldown immediately upon success
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResend = async () => {
        if (resendCountdown > 0) return;
        
        setIsSubmitting(true);
        try {
            await authService.sendRecoveryCode(email);
            setResendCountdown(60);
            toast.success(t('codeSent', 'auth'));
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = async () => {
        if (!code || code.length !== 6) return toast.error(t('errorInvalidCodeLength', 'auth'));
        if (!password) return toast.error(t('errorNewPassword', 'auth'));
        
        // Security Check
        if (!passwordStrength.isSafe) return toast.error(t('error.passwordTooWeak', 'auth'));

        if (password !== confirmPassword) return toast.error(t('errorPasswordMismatch', 'profile'));

        setIsSubmitting(true);
        try {
            await authService.resetPassword(email, code, password);
            toast.success(t('passwordUpdatedSuccess', 'profile'));
            onSuccess();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        state: { step, email, code, password, passwordStrength, confirmPassword, isSubmitting, resendCountdown },
        actions: { setEmail, setCode, setPassword, setConfirmPassword, handleSendCode, handleReset, handleResend }
    };
};
