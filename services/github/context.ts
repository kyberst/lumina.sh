
import { AppError, AppModule } from '../../types';
import { getHeaders, handleResponse } from './api';
import { logger } from '../logger';

export const verifyGitHubToken = async (token: string): Promise<string> => {
  if (!token) return "Guest";
  try {
    const res = await fetch('https://api.github.com/user', { headers: getHeaders(token) });
    const user = await handleResponse(res, "Invalid Token");
    return user.login;
  } catch (e) {
    logger.warn(AppModule.INTEGRATION, "Token validation failed", e);
    return "Guest";
  }
};

export const fetchGitHubContext = async (repoUrl: string, token?: string): Promise<string> => {
    // Placeholder implementation for retrieving context from a repo
    return "";
};
