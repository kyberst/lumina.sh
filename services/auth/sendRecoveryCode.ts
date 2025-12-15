
import { dbFacade } from '../dbFacade';
import { toast } from '../toastService';
import { t } from '../i18n';

export const sendRecoveryCode = async (email: string): Promise<string> => {
    const user = await dbFacade.getUser(email);
    if (!user) throw new Error(t('errorEmailNotFound', 'auth'));
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    toast.info(`Recovery Code: ${code} (Simulated)`);
    return code;
};
