
import { useState } from 'react';
import { authService } from '../../../../services/auth';
import { toast } from '../../../../services/toastService';
import { t } from '../../../../services/i18n';

export const useIdentityForm = (onResult: (email: string, exists: boolean) => void) => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleContinue = async () => {
        if (!email.trim()) {
            toast.error(t('errorEmailRequired', 'auth'));
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast.error("Invalid email format");
            return;
        }

        setIsSubmitting(true);
        try {
            const exists = await authService.checkEmailExists(email);
            onResult(email, exists);
        } catch (e: any) {
            toast.error(e.message || t('errorGeneric', 'common'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSSO = async (provider: 'google' | 'github', onSuccess: (u: any) => void) => {
        setIsSubmitting(true);
        try {
            const user = await authService.loginWithSSO(provider);
            onSuccess(user);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        email, setEmail, isSubmitting, handleContinue, handleSSO
    };
};
