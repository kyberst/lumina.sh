import { useState, useEffect, useCallback } from 'react';
import { dbFacade } from '../services/dbFacade';
import { logger } from '../services/logger';
import { AppModule } from '../types';
import { eventBus } from '../services/eventBus';

export const useOnboarding = () => {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const start = useCallback(() => {
        setIsActive(true);
        setCurrentStep(0);
    }, []);

    useEffect(() => {
        const loadOnboardingStatus = async () => {
            try {
                const completed = await dbFacade.getConfig('onboarding_completed');
                if (!completed) {
                    const timer = setTimeout(() => start(), 1500);
                    return () => clearTimeout(timer);
                }
            } catch (e) {
                logger.error(AppModule.CORE, "Failed to load onboarding status from DB", e);
            }
        };
        loadOnboardingStatus();
    }, []);

    useEffect(() => {
        eventBus.on('start-tutorial', start);
        return () => {
            eventBus.off('start-tutorial', start);
        };
    }, []);

    const next = () => setCurrentStep(p => p + 1);
    
    const finish = async () => {
        // UI Priority: Close first
        setIsActive(false);
        setCurrentStep(0);
        
        try {
            await dbFacade.setConfig('onboarding_completed', 'true');
        } catch (e) {
            // This error will now be visible thanks to the ToastContainer z-index fix
            logger.error(AppModule.CORE, "Failed to save onboarding completed status", e);
        }
    };
    
    const skip = finish;

    return { isActive, currentStep, next, finish, skip };
};