
import { useState, useCallback } from 'react';

export type PanelType = 'preview' | 'code' | 'info' | 'history' | null;
export type MobileView = 'chat' | 'panel';

export const useWorkspaceLayout = () => {
  const [rightTab, setRightTab] = useState<PanelType>('preview');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [chatPanelWidth, setChatPanelWidth] = useState(420);
  const [lastChatPanelWidth, setLastChatPanelWidth] = useState(420);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [mobileView, setMobileView] = useState<MobileView>('chat');

  const refreshPreview = useCallback(() => setIframeKey(k => k + 1), []);

  const toggleChatCollapse = useCallback(() => {
    setIsChatCollapsed(prev => {
        if (!prev) { // If collapsing
            setLastChatPanelWidth(chatPanelWidth > 48 ? chatPanelWidth : 420);
            setChatPanelWidth(48);
        } else { // If expanding
            setChatPanelWidth(lastChatPanelWidth);
        }
        return !prev;
    });
  }, [chatPanelWidth, lastChatPanelWidth]);


  const handleSetRightTab = useCallback((tab: PanelType) => {
      setRightTab(currentTab => {
          const newTab = currentTab === tab ? null : tab;
          
          if (newTab) {
            setMobileView('panel'); // Switch to panel view on mobile when a tab is selected
          } else {
            setMobileView('chat'); // On mobile, if panel is closed, go back to chat
            setIsChatCollapsed(false); // Un-collapse chat when right panel closes
          }

          if (newTab !== null && currentTab === null && !isChatCollapsed) {
              setChatPanelWidth(prevWidth => {
                  const minRightPanelWidth = 320;
                  const maxChatWidth = window.innerWidth - minRightPanelWidth;
                  return Math.max(320, Math.min(prevWidth, maxChatWidth));
              });
          }
          return newTab;
      });
  }, [isChatCollapsed]);

  return {
    rightTab,
    setRightTab: handleSetRightTab,
    deviceMode,
    setDeviceMode,
    chatPanelWidth,
    setChatPanelWidth,
    iframeKey,
    setIframeKey,
    refreshPreview,
    isChatCollapsed,
    toggleChatCollapse,
    mobileView,
    setMobileView
  };
};
