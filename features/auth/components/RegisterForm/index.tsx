
import React from 'react';
import { User } from '../../../../types';
import { useRegisterForm } from './useRegisterForm.hook';
import { RegisterFormView } from './RegisterForm.view';

interface Props {
    onSuccess: (u: User) => void;
    onLoginClick: () => void;
    onEditEmail?: () => void;
    isLoading: boolean;
    initialEmail?: string;
}

export const RegisterForm: React.FC<Props> = ({ onSuccess, onLoginClick, onEditEmail, isLoading, initialEmail }) => {
    const { state, actions } = useRegisterForm(onSuccess, initialEmail);

    return (
        <RegisterFormView
            state={state}
            actions={actions}
            onLoginClick={onLoginClick}
            onEditEmail={onEditEmail}
            isLoading={isLoading}
        />
    );
};
