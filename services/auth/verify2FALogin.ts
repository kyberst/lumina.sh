
import { dbFacade } from '../dbFacade';
import { User } from '../../types';
import { startSession } from './startSession';
import { t } from '../i18n';

export const verify2FALogin = async (code: string): Promise<User> => {
    if (code.length !== 6) throw new Error(t('error.invalidCodeLength', 'auth'));
    const tempId = sessionStorage.getItem('temp_2fa_user');
    if (!tempId) throw new Error(t('error.sessionExpired', 'auth'));

    const user = await dbFacade.getUserById(tempId);
    if (!user) throw new Error(t('error.userGeneric', 'auth'));

    // Retrieve the persistence preference set during the initial login step
    const rememberMe = sessionStorage.getItem('temp_2fa_remember') !== 'false'; // Default true if missing

    await startSession(user.id, rememberMe);
    
    // Cleanup temporary auth state
    sessionStorage.removeItem('temp_2fa_user');
    sessionStorage.removeItem('temp_2fa_remember');
    
    return user;
};
