import { AppError, AppModule } from '../../types';

export const getHeaders = (token?: string) => ({
    'Accept': 'application/vnd.github.v3+json',
    ...(token ? { 'Authorization': `token ${token}` } : {})
});

export const handleResponse = async (res: Response, errorMsg: string) => {
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new AppError(`${errorMsg}: ${err.message}`, 'GH_API_ERR', AppModule.INTEGRATION);
    }
    return res.json();
};