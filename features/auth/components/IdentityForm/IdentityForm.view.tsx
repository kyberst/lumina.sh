
import React from 'react';
import { t } from '../../../../services/i18n';

interface IdentityFormViewProps {
    email: string;
    setEmail: (v: string) => void;
    isSubmitting: boolean;
    onContinue: () => void;
    onSSO: (p: 'google' | 'github') => void;
}

export const IdentityFormView: React.FC<IdentityFormViewProps> = ({ 
    email, setEmail, isSubmitting, onContinue, onSSO 
}) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    {t('welcome', 'auth')}
                </h2>
                <p className="text-slate-500 text-sm mt-2">
                    {t('enterEmailToContinue', 'auth')}
                </p>
            </div>

            {/* SSO Buttons - Priority */}
            <div className="space-y-3">
                <button 
                    type="button" 
                    onClick={() => onSSO('google')} 
                    disabled={isSubmitting} 
                    className="shadcn-btn w-full h-12 flex items-center justify-center gap-3 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm font-bold text-sm"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    {t('continueWithGoogle', 'auth')}
                </button>
                <button 
                    type="button" 
                    onClick={() => onSSO('github')} 
                    disabled={isSubmitting} 
                    className="shadcn-btn w-full h-12 flex items-center justify-center gap-3 bg-[#24292F] text-white hover:bg-[#24292F]/90 transition-all shadow-sm font-bold text-sm"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    {t('continueWithGithub', 'auth')}
                </button>
            </div>

            <p className="text-[10px] text-slate-400 text-center leading-tight px-4">
                {t('ssoDisclaimer', 'auth')}
            </p>

            {/* Separator */}
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-medium">{t('orLoginWithEmail', 'auth')}</span></div>
            </div>

            {/* Email Form (Secondary) */}
            <form onSubmit={(e) => { e.preventDefault(); onContinue(); }} className="space-y-4">
                <div className="space-y-1">
                    <label htmlFor="email" className="sr-only">{t('email', 'auth')}</label>
                    <input 
                        id="email"
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        className="shadcn-input h-11 text-base bg-slate-50 focus:bg-white transition-colors"
                        placeholder={t('emailPlaceholder', 'auth')} 
                        disabled={isSubmitting}
                    />
                </div>

                <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="shadcn-btn w-full h-11 text-sm font-bold bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-800 shadow-sm"
                >
                    {isSubmitting ? (
                        <svg className="animate-spin h-5 w-5 text-slate-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : t('continue', 'auth')}
                </button>
            </form>
        </div>
    );
};
