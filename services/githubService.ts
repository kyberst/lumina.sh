import { AppError, AppModule, GitHubEvent, JournalEntry, GeneratedFile, GitHubRepo } from '../types';
import { logger } from './logger';

export const fetchGitHubContext = async (username: string, token?: string): Promise<string> => {
  if (!username) throw new AppError('GitHub username required', 'GH_NO_USER', AppModule.INTEGRATION);

  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json'
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    logger.info(AppModule.INTEGRATION, `Fetching events for ${username}`);
    const response = await fetch(`https://api.github.com/users/${username}/events/public?per_page=5`, { headers });

    if (!response.ok) {
      throw new AppError(`GitHub API Error: ${response.status}`, 'GH_API_ERR', AppModule.INTEGRATION);
    }

    const events: GitHubEvent[] = await response.json();
    
    // Summarize events into a context string for the AI
    const summary = events.map(e => {
      const date = new Date(e.created_at).toLocaleDateString();
      let details = '';
      
      if (e.type === 'PushEvent') {
        const commits = e.payload?.commits?.map((c: any) => c.message).join(', ') || 'code updates';
        details = `Pushed commits: "${commits}"`;
      } else if (e.type === 'CreateEvent') {
        details = `Created ${e.payload?.ref_type || 'repository'}`;
      } else {
        details = `Action: ${e.type}`;
      }

      return `[GitHub ${date}] Repo: ${e.repo.name} -> ${details}`;
    }).join('\n');

    return summary;

  } catch (error: any) {
    logger.error(AppModule.INTEGRATION, 'GitHub fetch failed', error);
    throw new AppError('Failed to sync with GitHub', 'GH_SYNC_FAIL', AppModule.INTEGRATION);
  }
};

export const verifyGitHubToken = async (token: string): Promise<string> => {
    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) throw new Error("Invalid Token");
        const data = await response.json();
        return data.login; // Return username
    } catch (e: any) {
        throw new Error("Failed to verify GitHub connection: " + e.message);
    }
};

export const getUserRepos = async (token: string): Promise<GitHubRepo[]> => {
    if (!token) return [];
    
    try {
        const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=20', {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) throw new Error("Failed to fetch repos");
        return await response.json();
    } catch (e) {
        logger.error(AppModule.INTEGRATION, 'Failed to fetch user repos', e);
        return [];
    }
};

export const importRepository = async (repoName: string, token: string): Promise<GeneratedFile[]> => {
    if (!token) throw new AppError("GitHub Token missing", "GH_NO_TOKEN", AppModule.INTEGRATION);
    
    // NOTE: For a browser app, getting a full repo recursively is complex due to API limits.
    // We will fetch the root tree and 1 level deep for this demo implementation.
    
    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    };

    try {
        // Get default branch reference
        const repoRes = await fetch(`https://api.github.com/repos/${repoName}`, { headers });
        if(!repoRes.ok) throw new Error("Repo not found");
        const repoJson = await repoRes.json();
        const branch = repoJson.default_branch;

        // Get Tree
        const treeRes = await fetch(`https://api.github.com/repos/${repoName}/git/trees/${branch}?recursive=1`, { headers });
        if(!treeRes.ok) throw new Error("Failed to fetch file tree");
        const treeJson = await treeRes.json();
        
        // Filter for files (blobs) that are code
        const codeFiles = treeJson.tree.filter((node: any) => 
            node.type === 'blob' && 
            node.size < 100000 && // < 100KB
            ['js', 'ts', 'tsx', 'jsx', 'html', 'css', 'json', 'md'].some(ext => node.path.endsWith('.' + ext))
        ).slice(0, 15); // Limit to 15 files for demo performance

        const files: GeneratedFile[] = [];

        for(const node of codeFiles) {
            const contentRes = await fetch(node.url, { headers }); // node.url is the blob API url
            const contentJson = await contentRes.json();
            // contentJson.content is base64 encoded
            const decoded = atob(contentJson.content.replace(/\n/g, ''));
            
            let lang: any = 'javascript';
            if (node.path.endsWith('html')) lang = 'html';
            if (node.path.endsWith('css')) lang = 'css';
            if (node.path.endsWith('ts')) lang = 'typescript';

            files.push({
                name: node.path,
                content: decoded,
                language: lang
            });
        }
        
        return files;

    } catch (error: any) {
        logger.error(AppModule.INTEGRATION, 'Repo import failed', error);
        throw new AppError(error.message, 'GH_IMPORT_FAIL', AppModule.INTEGRATION);
    }
};

export const publishToGitHub = async (
  entry: JournalEntry, 
  repoName: string, 
  token: string, 
  isPrivate: boolean,
  createRepo: boolean = true,
  branch: string = 'main'
): Promise<string> => {
  if (!token) throw new AppError("GitHub Token missing", "GH_NO_TOKEN", AppModule.INTEGRATION);

  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  };

  try {
    let owner = '';
    let htmlUrl = '';

    if (createRepo) {
      // 1. Create Repository
      logger.info(AppModule.INTEGRATION, `Creating repo: ${repoName}`);
      const createRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: repoName,
          private: isPrivate,
          description: entry.description || 'Generated by Dyad Builder',
          auto_init: true // Initialize to make sure branch exists
        })
      });

      if (!createRes.ok) {
         const err = await createRes.json();
         throw new Error(err.message || 'Repo creation failed');
      }

      const repoData = await createRes.json();
      owner = repoData.owner.login;
      htmlUrl = repoData.html_url;
    } else {
      // For existing repos, we need the owner. Assuming user's own repo or extracted from name.
      // If repoName contains slash 'owner/repo', extract it
      if (repoName.includes('/')) {
        [owner] = repoName.split('/');
        // repoName includes owner in variable usually, but API needs separate owner sometimes or just full path
        // For API call `repos/owner/repo`, we need split
        const parts = repoName.split('/');
        owner = parts[0];
        repoName = parts[1]; // Adjust local var for URL construction
      } else {
         // Fetch user to get login
         const userRes = await fetch('https://api.github.com/user', { headers });
         const userData = await userRes.json();
         owner = userData.login;
      }
      htmlUrl = `https://github.com/${owner}/${repoName}`;
    }

    // 2. Upload Files
    logger.info(AppModule.INTEGRATION, `Uploading ${entry.files.length} files to ${owner}/${repoName}...`);

    for (const file of entry.files) {
       // Check if file exists to get SHA (needed for update)
       let sha = undefined;
       try {
         const checkRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${file.name}?ref=${branch}`, { headers });
         if (checkRes.ok) {
           const data = await checkRes.json();
           sha = data.sha;
         }
       } catch (e) {}

       await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${file.name}`, {
         method: 'PUT',
         headers,
         body: JSON.stringify({
           message: `Update ${file.name} via Dyad`,
           content: btoa(file.content), // Base64 encode
           branch: branch,
           sha: sha
         })
       });
    }

    return htmlUrl;

  } catch (error: any) {
    logger.error(AppModule.INTEGRATION, 'GitHub Publish Failed', error);
    throw new AppError(error.message, 'GH_PUBLISH_FAIL', AppModule.INTEGRATION);
  }
};