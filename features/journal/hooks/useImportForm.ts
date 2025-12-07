
import React, { useState, useRef, useEffect } from 'react';
import { AppSettings, GitHubRepo, JournalEntry } from '../../../types';
import { getUserRepos, importRepository } from '../../../services/githubService';
import { readDirectoryFiles } from '../../../services/fileService';

export const useImportForm = (settings: AppSettings, onImport: (e: JournalEntry) => void, setError: (v: string | null) => void, setIsProcessing: (v: boolean) => void) => {
  const [importType, setImportType] = useState<'folder' | 'repos' | 'url'>('folder');
  const [userRepos, setUserRepos] = useState<GitHubRepo[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (importType === 'repos' && settings.githubToken) {
        getUserRepos(settings.githubToken).then(setUserRepos).catch(() => setError("Failed to fetch repositories."));
    }
  }, [importType, settings.githubToken, setError]);

  const handleFolderImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
        setIsProcessing(true);
        try {
            const files = await readDirectoryFiles(e.target.files);
            onImport({ id: crypto.randomUUID(), prompt: 'Imported', timestamp: Date.now(), files, tags: ['Local'], mood: 50, project: 'Imported' });
        } catch (err: any) { setError(err.message); } finally { setIsProcessing(false); }
    }
  };

  const handleRepoImport = async (repoName: string) => {
     if (!settings.githubToken) return;
     setIsProcessing(true);
     try {
         const files = await importRepository(repoName, settings.githubToken);
         onImport({ id: crypto.randomUUID(), prompt: `Imported from ${repoName}`, timestamp: Date.now(), files, tags: ['GitHub'], mood: 50, project: repoName.split('/')[1] });
     } catch (err: any) { setError(err.message); } finally { setIsProcessing(false); }
  };

  return { importType, setImportType, userRepos, fileInputRef, handleFolderImport, handleRepoImport };
};
