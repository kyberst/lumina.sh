
import { dbFacade } from './dbFacade';
import { User, Session, Transaction } from '../types';
import { toast } from './toastService';

const SESSION_KEY = 'dyad_session_user_id';
const SESSION_ID_KEY = 'dyad_session_id';

export const authService = {
    async getCurrentUser(): Promise<User | null> {
        const userId = localStorage.getItem(SESSION_KEY);
        if (!userId) return null;
        try { return await dbFacade.getUserById(userId); } catch (e) { return null; }
    },

    async register(name: string, email: string, password: string): Promise<string> {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        toast.info(`Email Verification Code: ${code} (Simulated)`);
        return code;
    },

    async completeRegistration(name: string, email: string, password: string): Promise<User> {
        const user: User = {
            id: crypto.randomUUID(),
            name, email,
            passwordHash: btoa(password),
            credits: 50,
            twoFactorEnabled: false,
            createdAt: Date.now(),
            avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}&backgroundColor=ffdfbf,c0aede,b6e3f4`
        };
        await dbFacade.createUser(user);
        
        // Record Welcome Transaction
        const bonus: Transaction = {
            id: crypto.randomUUID(), userId: user.id, amount: 0, credits: 50, 
            type: 'bonus', description: 'Welcome Bonus', timestamp: Date.now()
        };
        await dbFacade.addTransaction(bonus);

        await this.startSession(user.id);
        return user;
    },

    async login(email: string, password: string): Promise<{ user: User | null, require2FA: boolean }> {
        const user = await dbFacade.getUser(email);
        if (!user) throw new Error("User not found");
        if (user.passwordHash !== btoa(password)) throw new Error("Invalid credentials");
        if (user.twoFactorEnabled) return { user: null, require2FA: true };

        await this.startSession(user.id);
        return { user, require2FA: false };
    },

    async verify2FALogin(code: string): Promise<User> {
        if (code.length !== 6) throw new Error("Invalid Code Length");
        const tempId = sessionStorage.getItem('temp_2fa_user');
        if (!tempId) throw new Error("Session expired");
        
        const user = await dbFacade.getUserById(tempId);
        if (!user) throw new Error("User error");
        
        await this.startSession(user.id);
        sessionStorage.removeItem('temp_2fa_user');
        return user;
    },

    async startSession(userId: string) {
        localStorage.setItem(SESSION_KEY, userId);
        
        // Create DB Session
        const sessionId = crypto.randomUUID();
        const session: Session = {
            id: sessionId,
            userId,
            device: navigator.userAgent, // Simplified
            ip: '127.0.0.1', // Mocked for local-first
            lastActive: Date.now()
        };
        await dbFacade.createSession(session);
        localStorage.setItem(SESSION_ID_KEY, sessionId);
    },

    async generate2FASecret(): Promise<string> {
        return Array.from(crypto.getRandomValues(new Uint8Array(20)))
            .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase().substring(0, 16);
    },

    async sendRecoveryCode(email: string): Promise<string> {
        const user = await dbFacade.getUser(email);
        if (!user) throw new Error("Email not found");
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        toast.info(`Recovery Code: ${code} (Simulated)`);
        return code;
    },

    async resetPassword(email: string, newPass: string): Promise<void> {
        const user = await dbFacade.getUser(email);
        if (!user) throw new Error("User error");
        user.passwordHash = btoa(newPass);
        await dbFacade.updateUser(user);
    },

    async logout() {
        const sid = localStorage.getItem(SESSION_ID_KEY);
        if(sid) await dbFacade.revokeSession(sid);
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_ID_KEY);
    }
};