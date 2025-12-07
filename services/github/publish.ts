import { AppError, AppModule, JournalEntry } from '../../types';
import { logger } from '../logger';
import { getHeaders } from './api';

export const publishToGitHub = async (
  entry: JournalEntry, repoName: string, token: string, isPrivate: boolean, createRepo: boolean = true, branch: string = 'main'
): Promise<string> => {
  if (!token) throw new AppError("GitHub Token missing", "GH_NO_TOKEN", AppModule.INTEGRATION);
  const headers = { ...getHeaders(token), 'Content-Type': 'application/json' };

  try {
    let owner = '', htmlUrl = '';
    if (createRepo) {
      logger.info(AppModule.INTEGRATION, `Creating repo: ${repoName}`);
      const res = await fetch('https://api.github.com/user/repos', {
        method: 'POST', headers,
        body: JSON.stringify({ name: repoName, private: isPrivate, description: entry.description, auto_init: true })
      });
      const data = await res.json();
      owner = data.owner.login;
      htmlUrl = data.html_url;
    } else {
      const userRes = await fetch('https://api.github.com/user', { headers });
      const userData = await userRes.json();
      owner = userData.login;
      if (repoName.includes('/')) { const parts = repoName.split('/'); owner = parts[0]; repoName = parts[1]; }
      htmlUrl = `https://github.com/${owner}/${repoName}`;
    }

    logger.info(AppModule.INTEGRATION, `Uploading ${entry.files.length} files...`);
    for (const file of entry.files) {
       let sha;
       try {
         const r = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${file.name}?ref=${branch}`, { headers });
         if (r.ok) sha = (await r.json()).sha;
       } catch (e) {}

       await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${file.name}`, {
         method: 'PUT', headers,
         body: JSON.stringify({ message: `Update ${file.name}`, content: btoa(file.content), branch, sha })
       });
    }
    return htmlUrl;
  } catch (error: any) {
    logger.error(AppModule.INTEGRATION, 'GitHub Publish Failed', error);
    throw new AppError(error.message, 'GH_PUBLISH_FAIL', AppModule.INTEGRATION);
  }
};