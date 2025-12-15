
import React from 'react';
import { GitHubRepo } from '../../../../types';
import { t } from '../../../../services/i18n';

interface Props {
  repos: GitHubRepo[];
  onImport: (fullName: string) => void;
  disabled: boolean;
  hasToken: boolean;
}

export const RepoImport: React.FC<Props> = ({ repos, onImport, disabled, hasToken }) => {
    if (!hasToken) return <div className="text-center text-slate-500 mt-10">{t('configureGithub', 'import')}</div>;
    
    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 h-64">
             {repos.map(repo => (
                 <div key={repo.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors shadow-sm">
                     <div>
                         <div className="text-sm font-bold text-slate-800">{repo.name}</div>
                         <div className="text-[10px] text-slate-500">{repo.full_name} • {repo.private ? 'Private' : 'Public'}</div>
                     </div>
                     <button onClick={() => onImport(repo.full_name)} disabled={disabled} className="shadcn-btn shadcn-btn-outline h-8 text-xs">{t('importButton', 'import')}</button>
                 </div>
             ))}
        </div>
    );
};
