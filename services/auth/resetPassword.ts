
import { dbFacade } from '../dbFacade';
import { t } from '../i18n';

export const resetPassword = async (email: string, code: string, newPass: string): Promise<void> => {
    // 1. Verify OTP (Simulating Server-Side Validation)
    const storedData = sessionStorage.getItem(`lumina_otp_${email}`);
    
    if (!storedData) {
        throw new Error(t('errorInvalidCode', 'auth'));
    }

    const { code: expectedCode, expires } = JSON.parse(storedData);

    if (Date.now() > expires) {
        sessionStorage.removeItem(`lumina_otp_${email}`);
        throw new Error(t('errorSessionExpired', 'auth'));
    }

    if (code !== expectedCode) {
        throw new Error(t('errorInvalidCode', 'auth'));
    }

    // 2. Perform Password Reset
    const user = await dbFacade.getUser(email);
    if (!user) throw new Error(t('errorUserGeneric', 'auth'));
    
    user.passwordHash = btoa(newPass);
    await dbFacade.updateUser(user);

    // 3. Cleanup
    sessionStorage.removeItem(`lumina_otp_${email}`);
};
