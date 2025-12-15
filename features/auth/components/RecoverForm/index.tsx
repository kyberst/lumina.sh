
import React from 'react';
import { useRecoverForm } from './useRecoverForm.hook';
import { RecoverFormView } from './RecoverForm.view';

interface Props {
    onSuccess: () => void;
    onCancel: () => void;
    isLoading: boolean;
}

export const RecoverForm: React.FC<Props> = ({ onSuccess, onCancel, isLoading }) => {
    const { state, actions } = useRecoverForm(onSuccess);

    return (
        <RecoverFormView
            state={state}
            actions={actions}
            onCancel={onCancel}
            isLoading={isLoading}
        />
    );
};
