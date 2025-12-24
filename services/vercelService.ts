
import { GeneratedFile, AppError, AppModule } from '../types';
import { logger } from './logger';

const VERCEL_API = 'https://api.vercel.com';

export const deployToVercel = async (
    files: GeneratedFile[], 
    projectName: string, 
    token: string
): Promise<{ url: string; dashboardUrl: string }> => {
    if (!token) throw new AppError('Vercel Token Missing', 'NO_TOKEN', AppModule.INTEGRATION);

    try {
        // 1. Prepare Files for Vercel API
        const deployFiles = files.map(f => ({
            file: f.name,
            data: f.content
        }));

        // 2. Create Deployment
        const res = await fetch(`${VERCEL_API}/v13/deployments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: projectName,
                files: deployFiles,
                projectSettings: {
                    framework: null // Let Vercel auto-detect or use Build Output API if needed
                }
            })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error?.message || res.statusText);
        }

        const data = await res.json();
        
        return {
            url: `https://${data.url}`,
            dashboardUrl: data.inspectorUrl || `https://vercel.com/${data.ownerId}/${data.name}/${data.id}`
        };

    } catch (e: any) {
        logger.error(AppModule.INTEGRATION, 'Vercel Deployment Failed', e);
        throw new AppError(e.message, 'VERCEL_DEPLOY_FAIL', AppModule.INTEGRATION);
    }
};

export const verifyVercelToken = async (token: string): Promise<boolean> => {
    try {
        const res = await fetch(`${VERCEL_API}/v2/user`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.ok;
    } catch (e) {
        return false;
    }
};
