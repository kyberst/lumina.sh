import { AppError, AppModule, GitHubRepo, GeneratedFile } from '../../types';
import { logger } from '../logger';
import { getHeaders, handleResponse } from './api';

export const getUserRepos = async (token: string): Promise<GitHubRepo[]> => {
    if (!token) return [];
    try {
        const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=20', { headers: getHeaders(token) });
        return handleResponse(res, "Failed to fetch repos");
    } catch (e) {
        logger.error(AppModule.INTEGRATION, 'Failed to fetch user repos', e);
        return [];
    }
};

export const importRepository = async (repoName: string, token: string): Promise<GeneratedFile[]> => {
    if (!token) throw new AppError("GitHub Token missing", "GH_NO_TOKEN", AppModule.INTEGRATION);
    const headers = getHeaders(token);

    try {
        const repoJson = await fetch(`https://api.github.com/repos/${repoName}`, { headers }).then(r => handleResponse(r, "Repo not found"));
        const treeJson = await fetch(`https://api.github.com/repos/${repoName}/git/trees/${repoJson.default_branch}?recursive=1`, { headers }).then(r => handleResponse(r, "Failed to fetch tree"));

        const codeFiles = treeJson.tree.filter((node: any) => 
            node.type === 'blob' && node.size < 100000 && 
            ['js', 'ts', 'tsx', 'jsx', 'html', 'css', 'json', 'md'].some(ext => node.path.endsWith('.' + ext))
        ).slice(0, 15);

        const files: GeneratedFile[] = [];
        for(const node of codeFiles) {
            const contentJson = await fetch(node.url, { headers }).then(r => r.json());
            const decoded = atob(contentJson.content.replace(/\n/g, ''));
            
            let lang: any = 'javascript';
            if (node.path.endsWith('html')) lang = 'html';
            else if (node.path.endsWith('css')) lang = 'css';
            else if (node.path.endsWith('ts')) lang = 'typescript';

            files.push({ name: node.path, content: decoded, language: lang });
        }
        return files;
    } catch (error: any) {
        logger.error(AppModule.INTEGRATION, 'Repo import failed', error);
        throw new AppError(error.message, 'GH_IMPORT_FAIL', AppModule.INTEGRATION);
    }
};