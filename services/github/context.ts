
import { AppError, AppModule } from '../../types';
import { getHeaders, handleResponse } from './api';
import { logger } from '../logger';

export const verifyGitHubToken = async (token: string): Promise<{ login: string, avatar_url: string }> => {
  if (!token) throw new Error("No token provided");
  try {
    const res = await fetch('https://api.github.com/user', { headers: getHeaders(token) });
    const user = await handleResponse(res, "Invalid Token");
    return { login: user.login, avatar_url: user.avatar_url };
  } catch (e) {
    logger.warn(AppModule.INTEGRATION, "Token validation failed", e);
    throw e;
  }
};

export const fetchGitHubContext = async (repoUrl: string, token?: string): Promise<string> => {
    // Placeholder implementation for retrieving context from a repo
    return "";
};
