
import React from 'react';
import { User } from '../../../../types';
import { useIdentityForm } from './useIdentityForm.hook';
import { IdentityFormView } from './IdentityForm.view';

interface Props {
    onResult: (email: string, exists: boolean) => void;
    onSSOSuccess: (u: User) => void;
}

export const IdentityForm: React.FC<Props> = ({ onResult, onSSOSuccess }) => {
    const { email, setEmail, isSubmitting, handleContinue, handleSSO } = useIdentityForm(onResult);

    return (
        <IdentityFormView
            email={email}
            setEmail={setEmail}
            isSubmitting={isSubmitting}
            onContinue={handleContinue}
            onSSO={(p) => handleSSO(p, onSSOSuccess)}
        />
    );
};
