
import { useState, useEffect } from 'react';
import { toast } from '../../../services/toastService';

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'loading';
}

export const useToastContainer = () => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    useEffect(() => {
        const unsubscribe = toast.subscribe(setToasts);
        return () => unsubscribe();
    }, []);

    return { toasts };
};
