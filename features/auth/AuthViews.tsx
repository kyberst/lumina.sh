import React, { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { authService } from '../../services/authService';
import { User } from '../../types';
import { toast } from '../../services/toastService';
import { t } from '../../services/i18n';

interface AuthProps {
    onLogin: (user: User) => void;
}

export const AuthViews: React.FC<AuthProps> = ({ onLogin }) => {
    const [view, setView] = useState<'login' | 'register' | 'recover'>('login');
    const [step, setStep] = useState(1); // 1: Form, 2: Verify Code
    
    // Form Data
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    
    // Verification State
    const [expectedCode, setExpectedCode] = useState('');
    const [is2FALogin, setIs2FALogin] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) return toast.error("Please fill fields");
        try {
            const res = await authService.login(email, password);
            if (res.require2FA) {
                setIs2FALogin(true);
                setStep(2);
            } else if (res.user) {
                onLogin(res.user);
            }
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleVerifyLogin = async () => {
        try {
            const user = await authService.verify2FALogin(code);
            onLogin(user);
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleRegisterStep1 = async () => {
        if (!firstName || !lastName || !email || !password) return toast.error("Fill all fields");
        try {
            const fullName = `${firstName.trim()} ${lastName.trim()}`;
            const sentCode = await authService.register(fullName, email, password);
            setExpectedCode(sentCode);
            setStep(2);
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleRegisterVerify = async () => {
        if (code !== expectedCode) return toast.error("Invalid Code");
        try {
            const fullName = `${firstName.trim()} ${lastName.trim()}`;
            const user = await authService.completeRegistration(fullName, email, password);
            toast.success("Welcome!");
            onLogin(user);
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleRecover = async () => {
        if (!email) return toast.error("Email required");
        try {
            const c = await authService.sendRecoveryCode(email);
            setExpectedCode(c);
            setStep(2);
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleResetPass = async () => {
        if (code !== expectedCode) return toast.error("Invalid Code");
        if (!password) return toast.error("Enter new password");
        try {
            await authService.resetPassword(email, password);
            toast.success("Password Changed");
            setView('login');
            setStep(1);
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return (
        <AuthLayout>
            <div className="bg-card text-card-foreground rounded-xl p-8 md:p-10 shadow-lg border">
                
                {/* Header */}
                <div className="mb-8 text-center space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">
                        {view === 'login' && (step === 1 ? t('welcomeBack', 'auth') : (is2FALogin ? '2FA Security Check' : 'Email Verification'))}
                        {view === 'register' && (step === 1 ? t('createAccount', 'auth') : t('verifyEmail', 'auth'))}
                        {view === 'recover' && (step === 1 ? t('recoverPass', 'auth') : t('setNewPass', 'auth'))}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {view === 'login' && step === 1 && t('enterDetails', 'auth')}
                        {step === 2 && is2FALogin && "Enter the code from your Authenticator App."}
                        {step === 2 && !is2FALogin && "Please enter the code sent to your email."}
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Names (Register only) */}
                    {view === 'register' && step === 1 && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium leading-none">{t('firstName', 'auth')}</label>
                                <input 
                                    value={firstName} onChange={e => setFirstName(e.target.value)}
                                    className="shadcn-input"
                                    placeholder="Jane"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium leading-none">{t('lastName', 'auth')}</label>
                                <input 
                                    value={lastName} onChange={e => setLastName(e.target.value)}
                                    className="shadcn-input"
                                    placeholder="Doe"
                                />
                            </div>
                        </div>
                    )}

                    {/* Email Field */}
                    {step === 1 && (
                        <div className="space-y-1">
                            <label className="text-sm font-medium leading-none">{t('email', 'auth')}</label>
                            <input 
                                type="email" value={email} onChange={e => setEmail(e.target.value)}
                                className="shadcn-input"
                                placeholder="you@example.com"
                            />
                        </div>
                    )}

                    {/* Password Field */}
                    {(step === 1 && view !== 'recover') || (view === 'recover' && step === 2) ? (
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium leading-none">{view === 'recover' ? t('newPassword', 'auth') : t('password', 'auth')}</label>
                                {view === 'login' && <button onClick={() => { setView('recover'); setStep(1); }} className="text-sm font-medium text-primary hover:underline">{t('forgotPass', 'auth')}</button>}
                            </div>
                            <input 
                                type="password" value={password} onChange={e => setPassword(e.target.value)}
                                className="shadcn-input"
                                placeholder="••••••••"
                            />
                        </div>
                    ) : null}

                    {/* Code Field (Step 2) */}
                    {step === 2 && (
                        <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2">
                            <label className="text-sm font-medium leading-none">{t('verificationCode', 'auth')}</label>
                            <input 
                                value={code} onChange={e => setCode(e.target.value)}
                                className="shadcn-input text-center text-xl font-mono tracking-widest h-12"
                                placeholder="000000"
                                maxLength={6}
                                autoFocus
                            />
                        </div>
                    )}

                    {/* Action Button */}
                    <button 
                        onClick={() => {
                            if (view === 'login') step === 1 ? handleLogin() : handleVerifyLogin();
                            if (view === 'register') step === 1 ? handleRegisterStep1() : handleRegisterVerify();
                            if (view === 'recover') step === 1 ? handleRecover() : handleResetPass();
                        }}
                        className="shadcn-btn shadcn-btn-primary w-full h-11"
                    >
                        {step === 1 ? (view === 'login' ? t('signIn', 'auth') : view === 'register' ? t('signUp', 'auth') : t('sendCode', 'auth')) : t('verify', 'auth')}
                    </button>
                </div>

                {/* Footer Switch */}
                <div className="mt-8 text-center pt-6 border-t">
                    <p className="text-muted-foreground text-sm">
                        {view === 'login' ? "Don't have an account?" : "Already have an account?"}
                        <button 
                            onClick={() => { setView(view === 'login' ? 'register' : 'login'); setStep(1); setCode(''); setPassword(''); setEmail(''); setFirstName(''); setLastName(''); setIs2FALogin(false); }}
                            className="text-primary font-semibold ml-1 hover:underline"
                        >
                            {view === 'login' ? t('createOne', 'auth') : t('signIn', 'auth')}
                        </button>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
};