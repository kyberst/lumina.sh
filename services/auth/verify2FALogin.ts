
import { dbFacade } from '../dbFacade';
import { User } from '../../types';
import { startSession } from './startSession';
import { t } from '../i18n';

export const verify2FALogin = async (code: string): Promise<User> => {
    if (code.length !== 6) throw new Error(t('errorInvalidCodeLength', 'auth'));
    const tempId = sessionStorage.getItem('temp_2fa_user');
    if (!tempId) throw new Error(t('errorSessionExpired', 'auth'));

    const user = await dbFacade.getUserById(tempId);
    if (!user) throw new Error(t('errorUserGeneric', 'auth'));

    await startSession(user.id);
    sessionStorage.removeItem('temp_2fa_user');
    return user;
};
