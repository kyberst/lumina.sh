
import { t } from '../i18n';

export interface PasswordStrengthResult {
    score: number; // 0-4
    label: string;
    color: string;
    isSafe: boolean;
}

/**
 * Lightweight entropy estimator inspired by zxcvbn logic.
 * Calculates score based on length, complexity, and patterns.
 */
export const checkPasswordStrength = (password: string): PasswordStrengthResult => {
    let score = 0;
    if (!password) return { score: 0, label: '', color: 'bg-slate-200', isSafe: false };

    // 1. Length Points
    const len = password.length;
    if (len > 4) score += 1;
    if (len > 7) score += 1;
    if (len > 11) score += 1;
    if (len > 15) score += 1;

    // 2. Complexity Bonus
    let varietyCount = 0;
    if (/[A-Z]/.test(password)) varietyCount++;
    if (/[a-z]/.test(password)) varietyCount++;
    if (/[0-9]/.test(password)) varietyCount++;
    if (/[^A-Za-z0-9]/.test(password)) varietyCount++;

    if (varietyCount < 2) score = Math.min(score, 1); // Cap score if low variety
    if (varietyCount >= 3 && len >= 8) score += 1;

    // 3. Penalty for Repetition / Simple Patterns
    if (/(.)\1{2,}/.test(password)) score -= 1; // "aaa"
    if (/^[0-9]+$/.test(password)) score -= 2; // Only numbers
    if (/^[a-z]+$/.test(password)) score -= 1; // Only lowercase

    // Clamp Score 0-4
    score = Math.max(0, Math.min(4, score));

    // Map to UI properties
    switch (score) {
        case 0:
        case 1:
            return { score, label: t('strength.weak', 'auth'), color: 'bg-red-500', isSafe: false };
        case 2:
            return { score, label: t('strength.fair', 'auth'), color: 'bg-amber-400', isSafe: false }; // Still unsafe by Lumina standards
        case 3:
            return { score, label: t('strength.good', 'auth'), color: 'bg-emerald-400', isSafe: true };
        case 4:
            return { score, label: t('strength.strong', 'auth'), color: 'bg-emerald-600', isSafe: true };
        default:
            return { score: 0, label: '', color: 'bg-slate-200', isSafe: false };
    }
};
