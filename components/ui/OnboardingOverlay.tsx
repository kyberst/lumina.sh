import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { t } from '../../services/i18n';

export interface Step {
    target: string; // CSS Selector
    titleKey: string;
    descKey: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

interface Props {
    steps: Step[];
    currentStep: number;
    onNext: () => void;
    onFinish: () => void;
    onSkip: () => void;
}

export const OnboardingOverlay: React.FC<Props> = ({ steps, currentStep, onNext, onFinish, onSkip }) => {
    const [rect, setRect] = useState<DOMRect | null>(null);
    const step = steps[currentStep];

    useEffect(() => {
        const updateRect = () => {
            const el = document.querySelector(step.target);
            if (el) {
                setRect(el.getBoundingClientRect());
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        };

        // Initial update with delay for transitions
        const timer = setTimeout(updateRect, 300);
        window.addEventListener('resize', updateRect);
        
        return () => {
            window.removeEventListener('resize', updateRect);
            clearTimeout(timer);
        };
    }, [step]);

    if (!rect) return null;

    // Tooltip positioning logic
    const tooltipStyle: React.CSSProperties = { position: 'absolute' };
    
    if (step.position === 'top') {
        tooltipStyle.bottom = window.innerHeight - rect.top + 20;
        tooltipStyle.left = rect.left;
    } else if (step.position === 'left') {
        tooltipStyle.top = rect.top;
        tooltipStyle.right = window.innerWidth - rect.left + 20;
    } else {
        // Default bottom
        tooltipStyle.top = rect.bottom + 20;
        tooltipStyle.left = rect.left;
    }

    // Basic viewport clamping
    if (tooltipStyle.left && (tooltipStyle.left as number) > window.innerWidth - 300) {
        tooltipStyle.left = window.innerWidth - 320;
    }

    const isLast = currentStep === steps.length - 1;

    return createPortal(
        <div className="fixed inset-0 z-[9999] overflow-hidden">
            {/* Spotlight Overlay using massive box-shadow trick */}
            <div 
                className="absolute transition-all duration-500 ease-in-out border-2 border-indigo-500 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] pointer-events-none"
                style={{
                    top: rect.top - 5,
                    left: rect.left - 5,
                    width: rect.width + 10,
                    height: rect.height + 10,
                }}
            />
            
            {/* Tooltip Card */}
            <div 
                className="absolute z-[10000] bg-white p-6 rounded-2xl shadow-2xl max-w-sm border border-indigo-100 animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={tooltipStyle}
            >
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-slate-800">{t(step.titleKey, 'onboarding')}</h3>
                    <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full">{currentStep + 1} / {steps.length}</span>
                </div>
                <p className="text-slate-600 mb-6 leading-relaxed text-sm">
                    {t(step.descKey, 'onboarding')}
                </p>
                <div className="flex justify-between items-center">
                    <button onClick={onSkip} className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-wider">
                        {t('skip', 'onboarding')}
                    </button>
                    <button 
                        onClick={isLast ? onFinish : onNext}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-indigo-200 transition-transform active:scale-95"
                    >
                        {isLast ? t('finish', 'onboarding') : t('next', 'onboarding')}
                    </button>
                </div>
                
                {/* Visual Arrow */}
                <div 
                    className="absolute w-4 h-4 bg-white transform rotate-45 border-l border-t border-indigo-50"
                    style={{
                        top: step.position === 'bottom' ? -8 : 'auto',
                        bottom: step.position === 'top' ? -8 : 'auto',
                        left: 20,
                    }}
                />
            </div>
        </div>,
        document.body
    );
};