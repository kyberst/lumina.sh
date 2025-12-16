
import { dbFacade } from '../dbFacade';
import { startSession } from './startSession';
import { toast } from '../toastService';
import { t } from '../i18n';

// Helpers for Buffer conversion (WebAuthn uses ArrayBuffers, JSON uses Base64)
const bufferToBase64 = (buffer: ArrayBuffer): string => {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
};

const base64ToBuffer = (base64: string): ArrayBuffer => {
    const binStr = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    const len = binStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binStr.charCodeAt(i);
    return bytes.buffer;
};

/**
 * Checks if the platform supports WebAuthn (Biometrics/Keys).
 */
export const isWebAuthnAvailable = async (): Promise<boolean> => {
    if (!window.PublicKeyCredential) return false;
    // Check for platform authenticator (TouchID/FaceID/Windows Hello)
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
};

/**
 * SIMULATED: Registers a new Passkey for the current user.
 * In a real app, the 'challenge' comes from the server.
 */
export const registerDevice = async (userId: string, email: string) => {
    if (!userId) throw new Error(t('error.userGeneric', 'auth'));

    // 1. Mock Server Challenge options
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const publicKey: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: { name: "Lumina Studio", id: window.location.hostname },
        user: {
            id: Uint8Array.from(userId, c => c.charCodeAt(0)),
            name: email,
            displayName: email,
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
        timeout: 60000,
        attestation: "none"
    };

    try {
        // 2. Trigger Browser Native Dialog
        const credential = await navigator.credentials.create({ publicKey }) as PublicKeyCredential;
        
        // 3. Simulate saving public key to DB
        // In reality, we'd send `credential.response` to backend for verification and storage.
        console.log('[WebAuthn] Registered:', credential);
        
        // Store a flag in local DB to know this user has a passkey
        // This is strictly for the mock simulation to allow login later
        await dbFacade.setConfig(`passkey_${userId}`, 'true');
        
        return true;
    } catch (e: any) {
        console.error('[WebAuthn] Registration failed', e);
        throw new Error(t('passkey.registerFail', 'auth'));
    }
};

/**
 * SIMULATED: Logs in using a Passkey.
 */
export const loginWithDevice = async () => {
    // 1. Mock Server Challenge
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const publicKey: PublicKeyCredentialRequestOptions = {
        challenge,
        rpId: window.location.hostname,
        userVerification: "required",
        timeout: 60000,
    };

    try {
        // 2. Trigger Browser Native Dialog
        // This will ask for FaceID/TouchID
        const assertion = await navigator.credentials.get({ publicKey }) as PublicKeyCredential;
        
        // 3. Simulate Backend Verification
        // In a real app, we send `assertion` to backend. Backend looks up the Credential ID,
        // verifies the signature using the stored Public Key.
        
        // For this mock, we assume success if the browser returns a valid assertion.
        // However, we need to know *who* logged in.
        // In a real scenario, the `assertion.id` maps to a user.
        // Here, we'll try to find the last active user or simulate a specific user lookup.
        
        // Hack for simulation: Check local storage for the last user ID or prompt
        // Since we can't reverse map the ID easily in a mock without an index:
        // We will assume it's the user from the last session if available, or fail safely.
        
        const lastUserId = localStorage.getItem('lumina_user_id');
        if (!lastUserId) {
            // If completely new device/cleared cache, we can't mock-lookup the user easily
            // without a real backend index of CredentialID -> UserID.
            // For demo purposes, we reject if we don't have a hint.
            throw new Error(t('passkey.deviceNotRecognized', 'auth'));
        }

        // Verify "backend" check
        const hasPasskey = await dbFacade.getConfig(`passkey_${lastUserId}`);
        if (!hasPasskey) {
             throw new Error(t('passkey.notRegistered', 'auth'));
        }

        // 4. Start Session
        await startSession(lastUserId);
        
        return true;
    } catch (e: any) {
        console.error('[WebAuthn] Login failed', e);
        throw new Error(t('passkey.loginFail', 'auth'));
    }
};
