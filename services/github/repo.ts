
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

const fetchRepoContent = async (repoName: string, headers: any, branch?: string): Promise<GeneratedFile[]> => {
    try {
        // Get Default Branch if not provided
        let targetBranch = branch;
        if (!targetBranch) {
             const repoJson = await fetch(`https://api.github.com/repos/${repoName}`, { headers }).then(r => handleResponse(r, "Repo not found"));
             targetBranch = repoJson.default_branch;
        }

        const treeJson = await fetch(`https://api.github.com/repos/${repoName}/git/trees/${targetBranch}?recursive=1`, { headers }).then(r => handleResponse(r, "Failed to fetch tree"));

        if (!treeJson.tree || !Array.isArray(treeJson.tree)) {
            throw new AppError("Invalid repo tree structure", "GH_TREE_INVALID", AppModule.INTEGRATION);
        }

        // Heuristic: Limit file count and size
        const codeFiles = treeJson.tree.filter((node: any) => 
            node.type === 'blob' && node.size < 150000 && 
            ['js', 'ts', 'tsx', 'jsx', 'html', 'css', 'json', 'md', 'py', 'go', 'rs', 'java'].some(ext => node.path.endsWith('.' + ext))
        ).slice(0, 30); // Hard limit to prevent context overflow

        const files: GeneratedFile[] = [];
        
        // Parallel fetch for speed
        const fetchPromises = codeFiles.map(async (node: any) => {
            // Use raw.githubusercontent.com or API blob. API blob is safer with rate limits if authenticated.
            // Using API blob content
            const blobRes = await fetch(node.url, { headers }).then(r => r.json());
            const decoded = atob(blobRes.content.replace(/\n/g, ''));
            
            let lang: any = 'javascript';
            if (node.path.endsWith('html')) lang = 'html';
            else if (node.path.endsWith('css')) lang = 'css';
            else if (node.path.endsWith('ts') || node.path.endsWith('tsx')) lang = 'typescript';
            else if (node.path.endsWith('json')) lang = 'json';
            else if (node.path.endsWith('md')) lang = 'markdown';

            return { name: node.path, content: decoded, language: lang };
        });

        return await Promise.all(fetchPromises);

    } catch (error: any) {
        logger.error(AppModule.INTEGRATION, 'Repo import failed', error);
        throw new AppError(error.message, 'GH_IMPORT_FAIL', AppModule.INTEGRATION);
    }
};

export const importRepository = async (repoName: string, token: string): Promise<GeneratedFile[]> => {
    if (!token) throw new AppError("GitHub Token missing", "GH_NO_TOKEN", AppModule.INTEGRATION);
    return fetchRepoContent(repoName, getHeaders(token));
};

export const importPublicRepository = async (repoName: string): Promise<GeneratedFile[]> => {
    // Public fetch uses generic Accept header without Authorization to avoid 401 on expired tokens
    const headers = { 'Accept': 'application/vnd.github.v3+json' };
    return fetchRepoContent(repoName, headers);
};
