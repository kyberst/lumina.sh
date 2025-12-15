
import { getCurrentUser } from './getCurrentUser';
import { register } from './register';
import { completeRegistration } from './completeRegistration';
import { login } from './login';
import { verify2FALogin } from './verify2FALogin';
import { startSession } from './startSession';
import { generate2FASecret } from './generate2FASecret';
import { sendRecoveryCode } from './sendRecoveryCode';
import { resetPassword } from './resetPassword';
import { changePassword } from './changePassword';
import { logout } from './logout';
import { getSessionId } from './getSessionId';
import { generateMFASecret, verifyAndActivateMFA, disableMFA } from './mfa';
import { loginWithSSO } from './sso';
import { isWebAuthnAvailable, registerDevice, loginWithDevice } from './webauthn';
import { checkEmailExists } from './checkEmail';
import { validateSession } from './validateSession';

export const authService = {
    getCurrentUser,
    register,
    completeRegistration,
    login,
    verify2FALogin,
    startSession,
    generate2FASecret,
    sendRecoveryCode,
    resetPassword,
    changePassword,
    logout,
    getSessionId,
    generateMFASecret,
    verifyAndActivateMFA,
    disableMFA,
    loginWithSSO,
    isWebAuthnAvailable,
    registerDevice,
    loginWithDevice,
    checkEmailExists,
    validateSession
};
