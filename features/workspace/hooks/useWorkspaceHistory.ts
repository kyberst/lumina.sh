import { useEffect } from 'react';
import { dbFacade } from '../../../services/dbFacade';
import { toast } from '../../../services/toastService';

export const useWorkspaceHistory = (entry: any, onUpdate: any, setHistory: any, setIsHistoryLoading: any, setIsIntegrityChecking: any) => {
  useEffect(() => {
    let isMounted = true;
    const checkIntegrity = async () => {
      if (!entry.projects_id) return;
      setIsHistoryLoading(true);
      setIsIntegrityChecking(true);
      try {
        const msgs = await dbFacade.getRefactorHistory(entry.projects_id);
        if (!isMounted) return;
        if (msgs.length === 0 && entry.prompt) {
          setHistory([{ refactor_history_id: 'init-local', role: 'user', text: entry.prompt, timestamp: entry.timestamp, snapshot: entry.files }]);
        } else {
          setHistory(msgs);
        }
        const lastCode = [...msgs].reverse().find(m => m.role === 'model' && m.snapshot?.length);
        if (lastCode?.snapshot && JSON.stringify(lastCode.snapshot) !== JSON.stringify(entry.files)) {
          await onUpdate({ ...entry, files: lastCode.snapshot });
        }
      } catch (e) {
        toast.error("Integrity check failed. Retrying...");
      } finally {
        if (isMounted) {
          setIsHistoryLoading(false);
          setIsIntegrityChecking(false);
        }
      }
    };
    checkIntegrity();
    return () => { isMounted = false; };
  }, [entry.projects_id]);
};