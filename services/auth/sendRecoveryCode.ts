
import { dbFacade } from '../dbFacade';
import { toast } from '../toastService';
import { t } from '../i18n';

export const sendRecoveryCode = async (email: string): Promise<void> => {
    const user = await dbFacade.getUser(email);
    if (!user) throw new Error(t('errorEmailNotFound', 'auth'));
    
    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Simulate Server-Side Storage (Redis/Cache) using SessionStorage
    // Valid for 5 minutes
    const payload = {
        code,
        expires: Date.now() + 5 * 60 * 1000 
    };
    sessionStorage.setItem(`lumina_otp_${email}`, JSON.stringify(payload));

    // Simulate sending email via Toast (In production this would happen on server)
    console.info(`[Auth] OTP for ${email}: ${code}`);
    toast.info(`Recovery Code: ${code} (Valid for 5 mins)`);
    
    return; // Don't return code to UI, keep it "secure"
};
