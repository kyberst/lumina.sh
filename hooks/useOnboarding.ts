
import { useState, useEffect } from 'react';

interface OnboardingOptions {
    enabled?: boolean;
    delay?: number;
}

export const useOnboarding = (stageId: string, options: OnboardingOptions = {}) => {
    const { enabled = true, delay = 1000 } = options;
    const storageKey = `lumina_onboarding_${stageId}_completed`;

    const [isCompleted, setIsCompleted] = useState(() => {
        try { return localStorage.getItem(storageKey) === 'true'; } catch { return true; }
    });
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (!isCompleted && enabled) {
            const timer = setTimeout(() => setIsActive(true), delay);
            return () => clearTimeout(timer);
        }
    }, [isCompleted, enabled, delay]);

    const next = () => setCurrentStep(p => p + 1);
    
    const finish = () => {
        setIsActive(false);
        setIsCompleted(true);
        try { localStorage.setItem(storageKey, 'true'); } catch {}
    };
    
    const skip = finish;

    return { isActive, currentStep, next, finish, skip };
};