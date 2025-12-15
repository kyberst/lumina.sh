
import { authStorage } from './storage';

export const getSessionId = (): string | null => {
    return authStorage.getToken();
};
