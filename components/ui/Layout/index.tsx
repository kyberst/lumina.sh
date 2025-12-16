
import React from 'react';
import { useLayout } from './useLayout.hook';
import { LayoutView } from './Layout.view';
import { ViewMode, User } from '../../../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: ViewMode) => void;
  language?: 'en' | 'es';
  onLanguageChange?: (lang: 'en' | 'es') => void;
  user?: User | null;
  onLogout?: () => void;
}

export const Layout: React.FC<LayoutProps> = (props) => {
  const hook = useLayout();

  return (
    <LayoutView 
      {...props}
      showProfileMenu={hook.showProfileMenu}
      setShowProfileMenu={hook.setShowProfileMenu}
      menuRef={hook.menuRef}
    />
  );
};
