
import React from 'react';
import { t } from '../../../../services/i18n';
import { PasswordStrengthResult } from '../../../../services/auth/passwordStrength';
import { PasswordStrengthMeter } from '../../../../components/ui/PasswordStrengthMeter';

interface RegisterFormViewProps {
    state: {
        step: number;
        firstName: string;
        lastName: string;
        email: string;
        password: string;
        passwordStrength: PasswordStrengthResult;
        telemetryConsent: boolean;
        code: string;
        isSubmitting: boolean;
    };
    actions: {
        setFirstName: (v: string) => void;
        setLastName: (v: string) => void;
        setEmail: (v: string) => void;
        setPassword: (v: string) => void;
        setTelemetryConsent: (v: boolean) => void;
        setCode: (v: string) => void;
        handleRegister: () => void;
        handleVerify: () => void;
    };
    onLoginClick: () => void;
    onEditEmail?: () => void;
    isLoading: boolean;
}

export const RegisterFormView: React.FC<RegisterFormViewProps> = ({ state, actions, onLoginClick, onEditEmail, isLoading }) => {
    const isProcessing = isLoading || state.isSubmitting;
    
    // Explicitly disable button if password is weak during step 1
    const isNextDisabled = isProcessing || (state.step === 1 && !state.passwordStrength.isSafe && state.password.length > 0);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold tracking-tight">
                    {state.step === 1 ? t('register.title', 'auth') : t('register.verify', 'auth')}
                </h2>
                <p className="text-muted-foreground text-sm mt-2">
                    {state.step === 1 ? t('register.subtitle', 'auth') : t('register.checkEmail', 'auth')}
                </p>
            </div>

            {state.step === 1 ? (
                <>  
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center mb-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('email', 'auth')}</span>
                            <span className="text-sm font-semibold text-slate-700">{state.email}</span>
                        </div>
                        {onEditEmail && (
                            <button type="button" onClick={onEditEmail} className="text-xs font-bold text-indigo-600 hover:underline">
                                {t('edit', 'common')}
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">{t('firstName', 'auth')}</label>
                            <input value={state.firstName} onChange={e => actions.setFirstName(e.target.value)} className="shadcn-input" placeholder={t('firstNamePlaceholder', 'auth')} disabled={isProcessing} autoFocus />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">{t('lastName', 'auth')}</label>
                            <input value={state.lastName} onChange={e => actions.setLastName(e.target.value)} className="shadcn-input" placeholder={t('lastNamePlaceholder', 'auth')} disabled={isProcessing} />
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t('password', 'auth')}</label>
                        <input 
                            type="password" 
                            value={state.password} 
                            onChange={e => actions.setPassword(e.target.value)} 
                            className="shadcn-input" 
                            placeholder="Min 8 chars, 1 number" 
                            disabled={isProcessing} 
                        />
                        {/* Visual Password Strength Indicator */}
                        <PasswordStrengthMeter result={state.passwordStrength} />
                    </div>
                    
                    <div className="flex items-start gap-2 pt-2">
                        <div className="flex h-5 items-center">
                            <input
                                id="telemetry"
                                type="checkbox"
                                checked={state.telemetryConsent}
                                onChange={(e) => actions.setTelemetryConsent(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                                disabled={isProcessing}
                            />
                        </div>
                        <div className="text-xs text-slate-500 leading-tight">
                            <label htmlFor="telemetry" className="font-medium text-slate-700 cursor-pointer select-none">
                                {t('telemetryConsent', 'auth')}
                            </label>
                            <p className="text-[10px] text-slate-400">{t('telemetryConsentDesc', 'auth')}</p>
                        </div>
                    </div>
                </>
            ) : (
                <div className="space-y-1">
                    <label className="text-sm font-medium">{t('verificationCode', 'auth')}</label>
                    <input 
                        value={state.code} 
                        onChange={e => actions.setCode(e.target.value)} 
                        className="shadcn-input text-center text-xl tracking-widest font-mono" 
                        maxLength={6} 
                        autoFocus 
                        disabled={isProcessing}
                    />
                </div>
            )}

            <button 
                onClick={state.step === 1 ? actions.handleRegister : actions.handleVerify} 
                disabled={isNextDisabled}
                className={`shadcn-btn w-full h-11 flex items-center justify-center gap-2 ${isNextDisabled ? 'opacity-50 cursor-not-allowed bg-slate-300 text-slate-500' : 'shadcn-btn-primary'}`}
            >
                {isProcessing && <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                {state.step === 1 ? t('register.action', 'auth') : t('login.action.verify', 'auth')}
            </button>
        </div>
    );
};
