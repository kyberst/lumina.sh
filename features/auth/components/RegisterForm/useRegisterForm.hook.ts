
import { useState, useEffect } from 'react';
import { authService } from '../../../../services/auth';
import { checkPasswordStrength, PasswordStrengthResult } from '../../../../services/auth/passwordStrength';
import { toast } from '../../../../services/toastService';
import { t } from '../../../../services/i18n';
import { User } from '../../../../types';

export const useRegisterForm = (onSuccess: (u: User) => void, initialEmail: string = '') => {
    const [step, setStep] = useState(1);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState(initialEmail);
    const [password, setPassword] = useState('');
    const [passwordStrength, setPasswordStrength] = useState<PasswordStrengthResult>({ score: 0, label: '', color: '', isSafe: false });
    const [telemetryConsent, setTelemetryConsent] = useState(false);
    const [code, setCode] = useState('');
    const [expectedCode, setExpectedCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialEmail) setEmail(initialEmail);
    }, [initialEmail]);

    // Predictive Password Analysis
    useEffect(() => {
        setPasswordStrength(checkPasswordStrength(password));
    }, [password]);

    const validateForm = (): boolean => {
        if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
            toast.error(t('error.fillFields', 'auth'));
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast.error(t('error.invalidEmail', 'auth'));
            return false;
        }
        // Enforce Security Policy: Prevent registration with weak passwords
        if (!passwordStrength.isSafe) {
            toast.error(t('error.passwordTooWeak', 'auth'));
            return false;
        }
        return true;
    };

    const handleRegister = async () => {
        if (!validateForm()) return;
        setIsSubmitting(true);
        try {
            const fullName = `${firstName.trim()} ${lastName.trim()}`;
            const sentCode = await authService.register(fullName, email, password);
            setExpectedCode(sentCode);
            setStep(2);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerify = async () => {
        if (code !== expectedCode) return toast.error(t('error.invalidCode', 'auth'));
        setIsSubmitting(true);
        try {
            const fullName = `${firstName.trim()} ${lastName.trim()}`;
            const user = await authService.completeRegistration(fullName, email, password, telemetryConsent);
            onSuccess(user);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        state: { step, firstName, lastName, email, password, passwordStrength, telemetryConsent, code, isSubmitting },
        actions: { setFirstName, setLastName, setEmail, setPassword, setTelemetryConsent, setCode, handleRegister, handleVerify }
    };
};
