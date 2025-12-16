
import React from 'react';
import { User } from '../../../../types';
import { useAuthViews } from './useAuthViews.hook';
import { AuthViewsView } from './AuthViews.view';

interface AuthProps {
    onLogin: (user: User) => void;
    loading?: boolean;
}

export const AuthViews: React.FC<AuthProps> = ({ onLogin, loading = false }) => {
    const hook = useAuthViews(onLogin);

    return (
        <AuthViewsView
            step={hook.step}
            currentEmail={hook.currentEmail}
            loading={loading}
            onLogin={onLogin}
            handleIdentityResult={hook.handleIdentityResult}
            handleEditEmail={hook.handleEditEmail}
            setStep={hook.setStep}
        />
    );
};
