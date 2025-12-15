
import React from 'react';
import { t } from '../../../../services/i18n';

type PublishStatus = 'saving' | 'packaging' | 'published' | 'error';

interface Props {
  status: PublishStatus;
  message: string;
  url?: string;
  onClose: () => void;
}

export const PublishStatusCard: React.FC<Props> = ({ status, message, url, onClose }) => {

  const getIcon = () => {
    switch (status) {
      case 'saving':
      case 'packaging':
        return <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>;
      case 'published':
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
      case 'error':
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
    }
  };

  const getBgColor = () => {
    switch (status) {
      case 'published': return 'bg-emerald-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-slate-800';
    }
  }

  return (
    <div className={`fixed bottom-4 right-4 w-80 p-4 rounded-xl shadow-2xl text-white flex flex-col gap-3 z-50 animate-in slide-in-from-bottom-5 ${getBgColor()}`}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-sm">{t('publishStatus.title', 'builder')}</h4>
          <p className="text-xs opacity-80 mt-1">{message}</p>
        </div>
        <div className="shrink-0 ml-4">
          {getIcon()}
        </div>
      </div>
      
      {status === 'published' && url && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold py-2 px-3 rounded-lg text-center truncate">
          {t('viewPublishedApp', 'workspace')}
        </a>
      )}

      {(status === 'published' || status === 'error') && (
        <button onClick={onClose} className="w-full text-center text-xs font-bold opacity-70 hover:opacity-100 mt-2">
          {t('close', 'common')}
        </button>
      )}
    </div>
  );
};
