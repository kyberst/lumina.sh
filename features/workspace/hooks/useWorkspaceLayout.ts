import { useState } from 'react';

export const useWorkspaceLayout = () => {
  const [rightTab, setRightTab] = useState<'preview' | 'code' | 'info'>('preview');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const refreshPreview = () => setIframeKey(k => k + 1);

  return {
    rightTab,
    setRightTab,
    deviceMode,
    setDeviceMode,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    iframeKey,
    setIframeKey,
    refreshPreview
  };
};