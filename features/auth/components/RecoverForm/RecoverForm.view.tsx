
import React from 'react';
import { t } from '../../../../services/i18n';
import { PasswordStrengthResult } from '../../../../services/auth/passwordStrength';
import { PasswordStrengthMeter } from '../../../../components/ui/PasswordStrengthMeter';

interface RecoverFormViewProps {
    state: {
        step: number;
        email: string;
        code: string;
        password: string;
        passwordStrength: PasswordStrengthResult;
        confirmPassword: string;
        isSubmitting: boolean;
        resendCountdown: number;
    };
    actions: {
        setEmail: (v: string) => void;
        setCode: (v: string) => void;
        setPassword: (v: string) => void;
        setConfirmPassword: (v: string) => void;
        handleSendCode: () => void;
        handleReset: () => void;
        handleResend: () => void;
    };
    onCancel: () => void;
    isLoading: boolean;
}

export const RecoverFormView: React.FC<RecoverFormViewProps> = ({ state, actions, onCancel, isLoading }) => {
    const isProcessing = isLoading || state.isSubmitting;
    const isActionDisabled = isProcessing || (state.step === 2 && !state.passwordStrength.isSafe && state.password.length > 0);

    return (
        <div className="space-y-4 animate-in zoom-in-95">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold tracking-tight">
                    {state.step === 1 ? t('recover.title', 'auth') : t('recover.setNewPassTitle', 'auth')}
                </h2>
                <p className="text-muted-foreground text-sm mt-2">
                    {state.step === 1 ? t('recover.subtitle', 'auth') : t('recover.setNewPassDesc', 'auth')}
                </p>
            </div>

            {state.step === 1 ? (
                <div className="space-y-1">
                    <label className="text-sm font-medium">{t('email', 'auth')}</label>
                    <input 
                        type="email" 
                        value={state.email} 
                        onChange={e => actions.setEmail(e.target.value)} 
                        className="shadcn-input" 
                        placeholder={t('emailPlaceholder', 'auth')}
                        disabled={isProcessing} 
                        inputMode="email"
                        autoComplete="email"
                        onKeyDown={e => e.key === 'Enter' && actions.handleSendCode()}
                    />
                </div>
            ) : (
                <>
                    <div className="space-y-1">
                        <div className="flex justify-between items-baseline">
                            <label className="text-sm font-medium">{t('verificationCode', 'auth')}</label>
                            <button
                                type="button"
                                onClick={actions.handleResend}
                                disabled={state.resendCountdown > 0 || isProcessing}
                                className={`text-xs font-medium transition-colors ${state.resendCountdown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-800 hover:underline'}`}
                            >
                                {state.resendCountdown > 0 
                                    ? t('resendIn', 'auth').replace('{seconds}', state.resendCountdown.toString()) 
                                    : t('resendCode', 'auth')}
                            </button>
                        </div>
                        <input 
                            value={state.code} 
                            onChange={e => actions.setCode(e.target.value.replace(/\D/g, ''))} 
                            className="shadcn-input text-center text-xl tracking-widest font-mono" 
                            maxLength={6} 
                            placeholder={t('recover.codePlaceholder', 'auth')}
                            disabled={isProcessing}
                            inputMode="numeric"
                            autoComplete="one-time-code"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t('recover.newPassword', 'auth')}</label>
                        <input 
                            type="password" 
                            value={state.password} 
                            onChange={e => actions.setPassword(e.target.value)} 
                            className="shadcn-input" 
                            placeholder={t('passwordPlaceholder', 'profile')}
                            disabled={isProcessing} 
                            autoComplete="new-password"
                        />
                        <PasswordStrengthMeter result={state.passwordStrength} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">{t('confirmNewPassword', 'profile')}</label>
                        <input 
                            type="password" 
                            value={state.confirmPassword} 
                            onChange={e => actions.setConfirmPassword(e.target.value)} 
                            className="shadcn-input" 
                            placeholder={t('recover.confirm', 'auth')}
                            disabled={isProcessing} 
                            autoComplete="new-password"
                            onKeyDown={e => e.key === 'Enter' && actions.handleReset()}
                        />
                    </div>
                </>
            )}

            <button 
                onClick={state.step === 1 ? actions.handleSendCode : actions.handleReset} 
                disabled={isActionDisabled} 
                className={`shadcn-btn w-full h-11 font-bold ${isActionDisabled ? 'opacity-50 cursor-not-allowed bg-slate-300 text-slate-500' : 'shadcn-btn-primary'}`}
            >
                {isProcessing ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        {t('processing', 'common')}
                    </span>
                ) : (state.step === 1 ? t('recover.sendCode', 'auth') : t('recover.resetPassword', 'auth'))}
            </button>

            <button onClick={onCancel} disabled={isProcessing} className="shadcn-btn shadcn-btn-ghost w-full h-11">
                {t('cancel', 'common')}
            </button>
        </div>
    );
};
