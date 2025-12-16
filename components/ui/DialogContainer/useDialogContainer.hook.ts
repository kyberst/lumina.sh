
import { useState, useEffect } from 'react';
import { dialogService } from '../../../services/dialogService';

export const useDialogContainer = () => {
    const [dialog, setDialog] = useState<any | null>(null);

    useEffect(() => {
        return dialogService.subscribe(setDialog);
    }, []);

    return { dialog };
};
