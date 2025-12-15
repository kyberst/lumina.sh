
import { dbFacade } from '../dbFacade';
import { User } from '../../types';

export const getCurrentUser = async (): Promise<User | null> => {
    const userId = localStorage.getItem('dyad_session_user_id');
    if (!userId) return null;
    try { return await dbFacade.getUserById(userId); } catch (e) { return null; }
};
