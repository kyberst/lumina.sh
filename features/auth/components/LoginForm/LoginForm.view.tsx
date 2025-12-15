
import React from 'react';
import { t } from '../../../../services/i18n';

interface LoginFormViewProps {
    state: {
        step: number;
        email: string;
        password: string;
        code: string;
        rememberMe: boolean;
        honeypot: string;
        isSubmitting: boolean;
        error: string | null;
        canUseBiometrics: boolean;
        isLocked: boolean;
        countdown: number;
    };
    actions: {
        setEmail: (v: string) => void;
        setPassword: (v: string) => void;
        setCode: (v: string) => void;
        setRememberMe: (v: boolean) => void;
        setHoneypot: (v: string) => void;
        handleLogin: () => void;
        handleVerify: () => void;
        handleSSO: (p: 'google' | 'github') => void;
        handleBiometricLogin: () => void;
    };
    onForgotPassword: () => void;
    onRegisterClick: () => void;
    onEditEmail?: () => void;
    isLoading: boolean;
}

export const LoginFormView: React.FC<LoginFormViewProps> = ({ 
    state, actions, onForgotPassword, onRegisterClick, onEditEmail, isLoading 
}) => {
    const isProcessing = isLoading || state.isSubmitting || state.isLocked;

    const onFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isProcessing) return;
        if (state.step === 1) actions.handleLogin();
        else actions.handleVerify();
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    {state.step === 1 ? t('login.title', 'auth') : t('login.2fa.title', 'auth')}
                </h2>
                <p className="text-slate-500 text-sm mt-2">
                    {state.step === 1 ? t('login.subtitle', 'auth') : t('login.2fa.subtitle', 'auth')}
                </p>
            </div>

            {/* Error Feedback Area */}
            <div className={`transition-all duration-300 overflow-hidden ${state.error || state.isLocked ? 'max-h-24 opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'}`}>
                <div className={`rounded-lg p-3 flex items-start gap-3 border ${state.isLocked ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className={`mt-0.5 ${state.isLocked ? 'text-red-500' : 'text-amber-600'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    </div>
                    <div>
                        <h4 className={`text-xs font-bold uppercase ${state.isLocked ? 'text-red-800' : 'text-amber-800'}`}>
                            {state.isLocked ? t('error.locked', 'auth') : 'Attention'}
                        </h4>
                        <p className={`text-xs mt-1 ${state.isLocked ? 'text-red-600' : 'text-amber-700'}`}>
                            {state.isLocked ? t('error.wait', 'auth').replace('{seconds}', state.countdown.toString()) : state.error}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={onFormSubmit} className="space-y-4">
                {/* Honeypot Field - Hidden from humans, visible to bots */}
                <input 
                    type="text" 
                    name="website_validate" 
                    style={{ display: 'none' }} 
                    value={state.honeypot} 
                    onChange={e => actions.setHoneypot(e.target.value)} 
                    autoComplete="off"
                    tabIndex={-1}
                />

                {state.step === 1 ? (
                    <>
                        {/* Read-Only Email Display */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('login.input.email', 'auth')}</span>
                                <span className="text-sm font-semibold text-slate-700">{state.email}</span>
                            </div>
                            {onEditEmail && (
                                <button type="button" onClick={onEditEmail} className="text-xs font-bold text-indigo-600 hover:underline">
                                    {t('edit', 'common')}
                                </button>
                            )}
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <label htmlFor="password" className="text-sm font-medium text-slate-700">{t('login.input.password', 'auth')}</label>
                                <button type="button" onClick={onForgotPassword} disabled={isProcessing} className="text-sm font-medium text-indigo-600 hover:underline">{t('login.action.forgotPass', 'auth')}</button>
                            </div>
                            <input 
                                id="password"
                                type="password" 
                                value={state.password} 
                                onChange={e => actions.setPassword(e.target.value)} 
                                className={`shadcn-input transition-colors ${state.error ? 'border-amber-300 focus:ring-amber-200' : ''}`} 
                                placeholder={t('login.input.passwordPlaceholder', 'auth')} 
                                disabled={isProcessing}
                                autoComplete="current-password"
                                autoFocus
                            />
                        </div>

                        {/* Remember Me Checkbox */}
                        <div className="flex items-center gap-2">
                            <input 
                                id="remember" 
                                type="checkbox" 
                                checked={state.rememberMe}
                                onChange={e => actions.setRememberMe(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                                disabled={isProcessing}
                            />
                            <label htmlFor="remember" className="text-xs text-slate-600 font-medium cursor-pointer select-none">
                                {t('login.input.rememberMe', 'auth')}
                            </label>
                        </div>
                    </>
                ) : (
                    <div className="space-y-1">
                        <label htmlFor="code" className="text-sm font-medium text-slate-700">{t('login.input.code', 'auth')}</label>
                        <input 
                            id="code"
                            value={state.code} 
                            onChange={e => actions.setCode(e.target.value)} 
                            className="shadcn-input text-center text-xl tracking-widest font-mono" 
                            maxLength={6} 
                            autoFocus 
                            disabled={isProcessing}
                            autoComplete="one-time-code"
                        />
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={isProcessing}
                    className={`shadcn-btn w-full h-11 flex items-center justify-center gap-2 ${state.isLocked ? 'bg-slate-300 text-slate-500 cursor-not-allowed hover:bg-slate-300' : 'shadcn-btn-primary'}`}
                >
                    {isProcessing && !state.isLocked ? (
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : null}
                    {state.isLocked ? `Wait ${state.countdown}s` : (state.step === 1 ? t('login.action.submit', 'auth') : t('login.action.verify', 'auth'))}
                </button>
            </form>

            {state.step === 1 && state.canUseBiometrics && (
                <button
                    type="button"
                    onClick={actions.handleBiometricLogin}
                    disabled={isProcessing}
                    className="shadcn-btn w-full h-11 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-indigo-300 transition-all shadow-sm mt-4"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M9 6.8a6 6 0 0 1 9 5.2c0 .47 0 1.17-.02 2"/></svg>
                    {t('login.action.passkey', 'auth')}
                </button>
            )}
        </div>
    );
};
