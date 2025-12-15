
import { useState, useEffect, useRef } from 'react';
import { authService } from '../../../../services/auth';
import { User } from '../../../../types';
import { t } from '../../../../services/i18n';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 60000;

export const useLoginForm = (onSuccess: (u: User) => void, initialEmail: string = '') => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState(initialEmail);
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [honeypot, setHoneypot] = useState(''); // Bot trap field
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [canUseBiometrics, setCanUseBiometrics] = useState(false);
    
    const [error, setError] = useState<string | null>(null);
    const errorTimerRef = useRef<any>(null);

    const [failedAttempts, setFailedAttempts] = useState(() => parseInt(localStorage.getItem('lumina_auth_attempts') || '0', 10));
    const [lockoutUntil, setLockoutUntil] = useState(() => parseInt(localStorage.getItem('lumina_auth_lockout') || '0', 10));
    const [countdown, setCountdown] = useState(0);

    // Sync if prop changes (e.g. user edits email in Identity step and comes back)
    useEffect(() => {
        if (initialEmail) setEmail(initialEmail);
    }, [initialEmail]);

    useEffect(() => {
        authService.isWebAuthnAvailable().then(setCanUseBiometrics);
        return () => { if (errorTimerRef.current) clearTimeout(errorTimerRef.current); };
    }, []);

    // ... (Existing Lockout Logic) ...
    useEffect(() => {
        if (lockoutUntil > Date.now()) {
            const updateTimer = () => {
                const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
                if (remaining <= 0) {
                    resetLockout();
                } else {
                    setCountdown(remaining);
                }
            };
            updateTimer();
            const interval = setInterval(updateTimer, 1000);
            return () => clearInterval(interval);
        } else if (lockoutUntil !== 0) {
            resetLockout();
        }
    }, [lockoutUntil]);

    const resetLockout = () => {
        setLockoutUntil(0);
        setFailedAttempts(0);
        setCountdown(0);
        localStorage.removeItem('lumina_auth_lockout');
        localStorage.removeItem('lumina_auth_attempts');
        setError(null);
    };

    const showError = (msgKey: string, autoDismiss = true) => {
        const translated = t(msgKey, 'auth');
        const finalMsg = translated === msgKey ? msgKey : translated;
        setError(finalMsg);
        if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
        if (autoDismiss) {
            errorTimerRef.current = setTimeout(() => setError(null), 5000);
        }
    };

    const handleInputChange = (setter: (v: string) => void, value: string) => {
        if (error) setError(null);
        setter(value);
    };

    const handleLogin = async () => {
        if (lockoutUntil > Date.now()) return;
        if (!email.trim() || !password.trim()) {
            showError('error.fillFields');
            return;
        }
        
        setIsSubmitting(true);
        setError(null);

        try {
            // Pass honeypot to service for validation
            const res = await authService.login(email, password, rememberMe, honeypot);
            resetLockout();

            if (res.require2FA) {
                setStep(2);
            } else if (res.user) {
                onSuccess(res.user);
            }
        } catch (e: any) {
            handleLoginError(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLoginError = (e: any) => {
        const backendLockout = e.meta?.['X-Account-Locked-Until'];
        if (backendLockout) {
            const until = parseInt(backendLockout, 10);
            setLockoutUntil(until);
            localStorage.setItem('lumina_auth_lockout', until.toString());
            showError('error.locked', false);
            return;
        }

        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        localStorage.setItem('lumina_auth_attempts', newAttempts.toString());

        if (newAttempts >= MAX_ATTEMPTS) {
            const lockoutEnd = Date.now() + LOCKOUT_DURATION;
            setLockoutUntil(lockoutEnd);
            localStorage.setItem('lumina_auth_lockout', lockoutEnd.toString());
            showError('error.locked', false);
        } else {
            showError(e.code === 'BOT_DETECTED' ? 'error.generic' : 'error.invalidCredentials');
        }
    };

    const handleSSO = async (provider: 'google' | 'github') => {
        if (lockoutUntil > Date.now()) return;
        setIsSubmitting(true);
        try {
            const user = await authService.loginWithSSO(provider);
            onSuccess(user);
        } catch (e: any) {
            showError(e.message || 'error.generic');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBiometricLogin = async () => {
        if (lockoutUntil > Date.now()) return;
        setIsSubmitting(true);
        try {
            await authService.loginWithDevice();
            const user = await authService.getCurrentUser();
            if (user) onSuccess(user);
        } catch (e: any) {
            showError(e.message || 'error.generic');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerify = async () => {
        if (!code.trim()) return;
        setIsSubmitting(true);
        try {
            const user = await authService.verify2FALogin(code);
            onSuccess(user);
        } catch (e: any) {
            showError(e.message || 'error.generic');
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        state: { step, email, password, code, rememberMe, honeypot, isSubmitting, error, canUseBiometrics, isLocked: lockoutUntil > Date.now(), countdown },
        actions: { 
            setEmail: (v: string) => handleInputChange(setEmail, v),
            setPassword: (v: string) => handleInputChange(setPassword, v),
            setCode: (v: string) => handleInputChange(setCode, v),
            setRememberMe,
            setHoneypot,
            handleLogin, handleVerify, handleSSO, handleBiometricLogin 
        }
    };
};
