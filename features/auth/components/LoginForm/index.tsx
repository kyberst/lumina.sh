
import React from 'react';
import { User } from '../../../../types';
import { useLoginForm } from './useLoginForm.hook';
import { LoginFormView } from './LoginForm.view';

interface Props {
    onSuccess: (u: User) => void;
    onForgotPassword: () => void;
    onRegisterClick: () => void;
    onEditEmail?: () => void;
    isLoading: boolean;
    initialEmail?: string;
}

export const LoginForm: React.FC<Props> = ({ onSuccess, onForgotPassword, onRegisterClick, onEditEmail, isLoading, initialEmail }) => {
    const { state, actions } = useLoginForm(onSuccess, initialEmail);

    return (
        <LoginFormView 
            state={state}
            actions={actions}
            onForgotPassword={onForgotPassword}
            onRegisterClick={onRegisterClick}
            onEditEmail={onEditEmail}
            isLoading={isLoading}
        />
    );
};
