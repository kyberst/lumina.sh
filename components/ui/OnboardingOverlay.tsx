
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
                el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            }
        };

        const timer = setTimeout(updateRect, 300);
        window.addEventListener('resize', updateRect);
        
        return () => {
            window.removeEventListener('resize', updateRect);
            clearTimeout(timer);
        };
    }, [step]);

    if (!rect) return null;

    const tooltipStyle: React.CSSProperties = { position: 'absolute' };
    const margin = 16;
    const tooltipHeightEstimate = 250; 

    let left = rect.left + rect.width / 2;
    let top = rect.bottom + margin;
    let transform = 'translateX(-50%)';
    let isAbove = false;

    if (top + tooltipHeightEstimate > window.innerHeight) {
        top = rect.top - margin;
        transform = 'translate(-50%, -100%)';
        isAbove = true;
    }

    tooltipStyle.top = top;
    tooltipStyle.left = left;
    tooltipStyle.transform = transform;
    
    const isLast = currentStep === steps.length - 1;

    return createPortal(
        <div className="fixed inset-0 z-[9999]">
            <div 
                className="absolute transition-all duration-500 ease-in-out border-2 border-indigo-500 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] pointer-events-none"
                style={{
                    top: rect.top - 5,
                    left: rect.left - 5,
                    width: rect.width + 10,
                    height: rect.height + 10,
                }}
            />
            
            <div 
                className="absolute z-[10000] bg-white p-6 rounded-2xl shadow-2xl w-[calc(100%-2rem)] max-w-sm border border-indigo-100 animate-in fade-in slide-in-from-bottom-4 duration-500"
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
                
                <div 
                    className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white transform rotate-45"
                    style={{
                        top: isAbove ? 'auto' : -8,
                        bottom: isAbove ? -8 : 'auto',
                    }}
                />
            </div>
        </div>,
        document.body
    );
};
