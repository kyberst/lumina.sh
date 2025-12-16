
import { dbFacade } from '../dbFacade';
import { t } from '../i18n';

/**
 * Securely changes the user's password.
 * Verifies the current password hash before applying the new one.
 */
export const changePassword = async (userId: string, currentPass: string, newPass: string): Promise<void> => {
    const user = await dbFacade.getUserById(userId);
    if (!user) throw new Error(t('error.userGeneric', 'auth'));

    // Verify Current Password (using the project's simple btoa hashing convention)
    const currentHash = btoa(currentPass);
    if (user.passwordHash !== currentHash) {
        throw new Error(t('errorCurrentPasswordIncorrect', 'profile'));
    }

    // Apply New Password
    user.passwordHash = btoa(newPass);
    await dbFacade.updateUser(user);
};
