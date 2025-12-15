
import { dbFacade } from '../dbFacade';
import { User } from '../../types';
import { t } from '../i18n';

export const generateMFASecret = async (userId: string) => {
    // Simulate generating a TOTP secret
    const secret = Array.from(crypto.getRandomValues(new Uint8Array(20)))
        .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase().substring(0, 16);
        
    const user = await dbFacade.getUserById(userId);
    const issuer = "Lumina Studio";
    const account = user?.email || "user";
    
    // OTP Auth URL format: otpauth://totp/Issuer:Account?secret=SECRET&issuer=Issuer
    const otpAuthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
    
    // Using a public API to generate QR code for the demo
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}`;

    return { secret, qrCodeUrl };
};

export const verifyAndActivateMFA = async (userId: string, code: string): Promise<void> => {
    // In a real app, this would verify the TOTP code against the secret using a library like 'otplib'
    // For this simulation/scaffolding, we accept a specific 'magic' code or just assume success if it looks like a code.
    if (!/^\d{6}$/.test(code)) {
        throw new Error(t('errorInvalidCodeLength', 'auth'));
    }

    // Update user state
    const user = await dbFacade.getUserById(userId);
    if (!user) throw new Error("User not found");

    user.twoFactorEnabled = true;
    await dbFacade.updateUser(user);
};

export const disableMFA = async (userId: string): Promise<void> => {
    const user = await dbFacade.getUserById(userId);
    if (!user) throw new Error("User not found");

    user.twoFactorEnabled = false;
    await dbFacade.updateUser(user);
};
