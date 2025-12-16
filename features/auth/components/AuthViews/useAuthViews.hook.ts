
import { useState } from 'react';
import { User } from '../../../../types';
import { toast } from '../../../../services/toastService';
import { t } from '../../../../services/i18n';

export type AuthStep = 'identity' | 'login' | 'register' | 'recover';

export const useAuthViews = (onLogin: (user: User) => void) => {
    const [step, setStep] = useState<AuthStep>('identity');
    const [currentEmail, setCurrentEmail] = useState('');

    const handleLoginSuccess = (user: User) => {
        toast.success(t('welcomeBackToast', 'auth'));
        onLogin(user);
    };

    const handleIdentityResult = (email: string, exists: boolean) => {
        setCurrentEmail(email);
        setStep(exists ? 'login' : 'register');
    };

    const handleEditEmail = () => {
        setStep('identity');
        // keep currentEmail populated so they can fix a typo
    };

    return {
        step,
        setStep,
        currentEmail,
        handleLoginSuccess,
        handleIdentityResult,
        handleEditEmail
    };
};
