
import { dbFacade } from '../dbFacade';
import { User, AppError, AppModule } from '../../types';
import { startSession } from './startSession';
import { t } from '../i18n';

// Constants for Mock Server Security Policies
const MAX_ATTEMPTS_PER_ACCOUNT = 5;
const ACCOUNT_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export const login = async (email: string, password: string, rememberMe: boolean = true, honeypot?: string): Promise<{ user: User | null, require2FA: boolean }> => {
    // --- 0. PASSIVE BOT PROTECTION (Honeypot) ---
    if (honeypot) {
        // If the hidden field has a value, it's likely a bot.
        // Simulate a delay (Tarapit) to slow them down, then reject.
        console.warn(`[Auth] Bot detected via honeypot. Value: ${honeypot}`);
        await new Promise(r => setTimeout(r, 1500));
        throw new AppError(t('botDetected', 'auth'), 'BOT_DETECTED', AppModule.AUTH);
    }

    // --- 1. MOCK SERVER THROTTLING CHECK ---
    const lockKey = `mock_server_lock_${email}`;
    const attemptsKey = `mock_server_attempts_${email}`;
    
    const lockUntil = parseInt(localStorage.getItem(lockKey) || '0', 10);
    if (lockUntil > Date.now()) {
        throw new AppError(
            t('error.locked', 'auth'),
            'AUTH_LOCKED',
            AppModule.AUTH,
            { 'X-Account-Locked-Until': lockUntil.toString() }
        );
    }

    const user = await dbFacade.getUser(email);
    
    // --- 2. CREDENTIAL VERIFICATION ---
    if (!user || user.passwordHash !== btoa(password)) {
        // Increment Failure Count
        const currentAttempts = parseInt(localStorage.getItem(attemptsKey) || '0', 10) + 1;
        localStorage.setItem(attemptsKey, currentAttempts.toString());

        const attemptsLeft = Math.max(0, MAX_ATTEMPTS_PER_ACCOUNT - currentAttempts);
        const headers: Record<string, string> = {
            'X-Login-Attempts-Left': attemptsLeft.toString()
        };

        if (currentAttempts >= MAX_ATTEMPTS_PER_ACCOUNT) {
            // Trigger Lockout
            const newLockUntil = Date.now() + ACCOUNT_LOCKOUT_MS;
            localStorage.setItem(lockKey, newLockUntil.toString());
            // Reset attempts after locking
            localStorage.removeItem(attemptsKey);
            
            headers['X-Account-Locked-Until'] = newLockUntil.toString();
            
            throw new AppError(
                t('error.locked', 'auth'),
                'AUTH_LOCKED',
                AppModule.AUTH,
                headers
            );
        }

        throw new AppError(
            t('error.invalidCredentials', 'auth'),
            'AUTH_FAIL',
            AppModule.AUTH,
            headers
        );
    }

    // --- 3. SUCCESSFUL LOGIN ---
    localStorage.removeItem(attemptsKey);
    localStorage.removeItem(lockKey);

    if (user.twoFactorEnabled) {
        sessionStorage.setItem('temp_2fa_user', user.id);
        sessionStorage.setItem('temp_2fa_remember', String(rememberMe)); // Pass preference to next step
        return { user: null, require2FA: true };
    }

    await startSession(user.id, rememberMe);
    return { user, require2FA: false };
};
