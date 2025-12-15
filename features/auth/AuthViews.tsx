
import React, { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { User } from '../../types';
import { toast } from '../../services/toastService';
import { IdentityForm } from './components/IdentityForm/index';
import { LoginForm } from './components/LoginForm/index';
import { RegisterForm } from './components/RegisterForm/index';
import { RecoverForm } from './components/RecoverForm/index';
import { t } from '../../services/i18n';

interface AuthProps {
    onLogin: (user: User) => void;
    loading?: boolean;
}

type AuthStep = 'identity' | 'login' | 'register' | 'recover';

export const AuthViews: React.FC<AuthProps> = ({ onLogin, loading = false }) => {
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

    return (
        <AuthLayout>
            <div className="bg-card text-card-foreground rounded-xl p-8 md:p-10 shadow-lg border">
                
                {step === 'identity' && (
                    <IdentityForm 
                        onResult={handleIdentityResult} 
                        onSSOSuccess={handleLoginSuccess}
                    />
                )}

                {step === 'login' && (
                    <LoginForm 
                        initialEmail={currentEmail}
                        onEditEmail={handleEditEmail}
                        onSuccess={handleLoginSuccess}
                        onForgotPassword={() => setStep('recover')}
                        onRegisterClick={() => setStep('register')} // Fallback in case state drift
                        isLoading={loading}
                    />
                )}

                {step === 'register' && (
                    <RegisterForm 
                        initialEmail={currentEmail}
                        onEditEmail={handleEditEmail}
                        onSuccess={handleLoginSuccess}
                        onLoginClick={() => setStep('login')} // Fallback
                        isLoading={loading}
                    />
                )}

                {step === 'recover' && (
                    <RecoverForm 
                        onSuccess={() => setStep('login')}
                        onCancel={() => setStep('login')}
                        isLoading={loading}
                    />
                )}

            </div>
        </AuthLayout>
    );
};
