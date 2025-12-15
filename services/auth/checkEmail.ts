
import { dbFacade } from '../dbFacade';

export const checkEmailExists = async (email: string): Promise<boolean> => {
    // Simulate network delay for "Magic" feeling
    await new Promise(r => setTimeout(r, 600));
    
    const user = await dbFacade.getUser(email);
    return !!user;
};
