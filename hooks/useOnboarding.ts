import { useState, useEffect } from 'react';

export const useOnboarding = () => {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        // Check if user has completed onboarding before
        const completed = localStorage.getItem('lumina_onboarding_completed');
        if (!completed) {
            // Small delay to ensure UI is mounted and layout is stable
            const timer = setTimeout(() => setIsActive(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const next = () => setCurrentStep(p => p + 1);
    
    const finish = () => {
        setIsActive(false);
        localStorage.setItem('lumina_onboarding_completed', 'true');
    };
    
    const skip = finish;

    return { isActive, currentStep, next, finish, skip };
};