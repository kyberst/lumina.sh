
import { dbFacade } from '../dbFacade';
import { t } from '../i18n';

export const resetPassword = async (email: string, newPass: string): Promise<void> => {
    const user = await dbFacade.getUser(email);
    if (!user) throw new Error(t('errorUserGeneric', 'auth'));
    user.passwordHash = btoa(newPass);
    await dbFacade.updateUser(user);
};
