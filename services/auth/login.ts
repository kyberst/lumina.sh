
import { dbFacade } from '../dbFacade';
import { User } from '../../types';
import { startSession } from './startSession';
import { t } from '../i18n';

export const login = async (email: string, password: string): Promise<{ user: User | null, require2FA: boolean }> => {
    const user = await dbFacade.getUser(email);
    if (!user) throw new Error(t('errorUserNotFound', 'auth'));
    if (user.passwordHash !== btoa(password)) throw new Error(t('errorInvalidCredentials', 'auth'));
    if (user.twoFactorEnabled) {
        sessionStorage.setItem('temp_2fa_user', user.id);
        return { user: null, require2FA: true };
    }

    await startSession(user.id);
    return { user, require2FA: false };
};
