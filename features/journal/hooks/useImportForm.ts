
import React, { useState, useRef, useEffect } from 'react';
import { AppSettings, GitHubRepo, JournalEntry } from '../../../types';
import { getUserRepos, importRepository, importPublicRepository } from '../../../services/githubService';
import { readDirectoryFiles } from '../../../services/fileService';

export const useImportForm = (settings: AppSettings, onImport: (e: JournalEntry) => void, setError: (v: string | null) => void, setIsProcessing: (v: boolean) => void) => {
  const [importType, setImportType] = useState<'folder' | 'repos' | 'url'>('folder');
  const [userRepos, setUserRepos] = useState<GitHubRepo[]>([]);
  const [urlInput, setUrlInput] = useState('');
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
            onImport({ id: crypto.randomUUID(), prompt: 'Imported from Folder', timestamp: Date.now(), files, tags: ['Local'], mood: 50, project: 'Imported Project' });
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

  const handleUrlImport = async () => {
      if (!urlInput) return;
      setIsProcessing(true);
      try {
          // Extract owner/repo from URL
          // Supports: https://github.com/owner/repo or https://github.com/owner/repo/tree/branch
          const match = urlInput.match(/github\.com\/([^\/]+)\/([^\/]+)/);
          if (!match) throw new Error("Invalid GitHub URL");
          
          const repoFullName = `${match[1]}/${match[2]}`;
          const files = await importPublicRepository(repoFullName);
          
          onImport({ 
              id: crypto.randomUUID(), 
              prompt: `Imported from ${urlInput}`, 
              timestamp: Date.now(), 
              files, 
              tags: ['GitHub', 'Public'], 
              mood: 50, 
              project: match[2] 
          });
          setUrlInput('');
      } catch (err: any) {
          setError(err.message);
      } finally {
          setIsProcessing(false);
      }
  };

  return { 
      importType, setImportType, 
      userRepos, fileInputRef, 
      urlInput, setUrlInput,
      handleFolderImport, handleRepoImport, handleUrlImport 
  };
};
