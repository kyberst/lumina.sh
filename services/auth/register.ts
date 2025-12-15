
import { toast } from '../toastService';

export const register = async (name: string, email: string, password: string): Promise<string> => {
    // This is a simulation
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    toast.info(`Email Verification Code: ${code} (Simulated)`);
    return code;
};
