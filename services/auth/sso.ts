
import { dbFacade } from '../dbFacade';
import { User, Transaction } from '../../types';
import { startSession } from './startSession';
import { toast } from '../toastService';
import { t } from '../i18n';

/**
 * Simulates an OAuth 2.0 flow.
 * In a real app, this would redirect to the provider's URL and handle the callback code.
 * For this local-first builder, we simulate the identity provider response.
 */
export const loginWithSSO = async (provider: 'google' | 'github'): Promise<User> => {
    // 1. Simulate Network Latency / Redirect
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 2. Simulate Provider Response Data
    const mockProfile = {
        email: `user@${provider}.com`,
        name: provider === 'google' ? 'Google User' : 'GitHub Dev',
        avatar: provider === 'google' 
            ? 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg'
            : 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg'
    };

    // 3. Check if user exists, else create (JIT Provisioning)
    let user = await dbFacade.getUser(mockProfile.email);

    if (!user) {
        user = {
            id: crypto.randomUUID(),
            name: mockProfile.name,
            email: mockProfile.email,
            passwordHash: 'sso_managed', // No password for SSO users
            credits: 50,
            twoFactorEnabled: false,
            telemetryConsent: true,
            createdAt: Date.now(),
            avatar: mockProfile.avatar
        };
        await dbFacade.createUser(user);
        
        // Welcome Bonus
        const bonus: Transaction = {
            id: crypto.randomUUID(), userId: user.id, amount: 0, credits: 50,
            type: 'bonus', description: `Welcome via ${provider}`, timestamp: Date.now()
        };
        await dbFacade.addTransaction(bonus);
        
        toast.success(t('accountCreated', 'auth'));
    } else {
        // Update avatar if changed on provider
        if (user.avatar !== mockProfile.avatar) {
            user.avatar = mockProfile.avatar;
            await dbFacade.updateUser(user);
        }
    }

    // 4. Start Session
    await startSession(user.id);
    
    return user;
};
