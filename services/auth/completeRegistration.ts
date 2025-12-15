
import { dbFacade } from '../dbFacade';
import { User, Transaction } from '../../types';
import { startSession } from './startSession';

export const completeRegistration = async (name: string, email: string, password: string, telemetryConsent: boolean): Promise<User> => {
    const user: User = {
        id: crypto.randomUUID(),
        name, email,
        passwordHash: btoa(password),
        credits: 50,
        twoFactorEnabled: false,
        telemetryConsent,
        createdAt: Date.now(),
        avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}&backgroundColor=ffdfbf,c0aede,b6e3f4`
    };
    await dbFacade.createUser(user);

    const bonus: Transaction = {
        id: crypto.randomUUID(), userId: user.id, amount: 0, credits: 50,
        type: 'bonus', description: 'Welcome Bonus', timestamp: Date.now()
    };
    await dbFacade.addTransaction(bonus);

    await startSession(user.id);
    return user;
};
