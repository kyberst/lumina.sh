
import React from 'react';
import { useDialogContainer } from './useDialogContainer.hook';
import { DialogContainerView } from './DialogContainer.view';

export const DialogContainer: React.FC = () => {
    const { dialog } = useDialogContainer();

    if (!dialog) return null;

    return <DialogContainerView dialog={dialog} />;
};
