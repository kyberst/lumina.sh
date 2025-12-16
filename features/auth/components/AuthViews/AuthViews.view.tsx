
import React from 'react';
import { AuthLayout } from '../../AuthLayout';
import { User } from '../../../../types';
import { IdentityForm } from '../IdentityForm/index';
import { LoginForm } from '../LoginForm/index';
import { RegisterForm } from '../RegisterForm/index';
import { RecoverForm } from '../RecoverForm/index';
import { AuthStep } from './useAuthViews.hook';

interface Props {
    step: AuthStep;
    currentEmail: string;
    loading: boolean;
    onLogin: (user: User) => void;
    handleIdentityResult: (email: string, exists: boolean) => void;
    handleEditEmail: () => void;
    setStep: (step: AuthStep) => void;
}

export const AuthViewsView: React.FC<Props> = ({
    step, currentEmail, loading, onLogin, handleIdentityResult, handleEditEmail, setStep
}) => {

    const handleLoginSuccess = (user: User) => {
        // The hook handles the toast, this just forwards the user object.
        onLogin(user);
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
                        onRegisterClick={() => setStep('register')}
                        isLoading={loading}
                    />
                )}

                {step === 'register' && (
                    <RegisterForm 
                        initialEmail={currentEmail}
                        onEditEmail={handleEditEmail}
                        onSuccess={handleLoginSuccess}
                        onLoginClick={() => setStep('login')}
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
