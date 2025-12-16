
import { useState, useEffect, useRef } from 'react';
import { JournalEntry, AppSettings, Snapshot } from '../../../../types';
import { toast } from '../../../../services/toastService';
import { dialogService } from '../../../../services/dialogService';
import { t } from '../../../../services/i18n';

interface Props {
  entry: JournalEntry;
  onUpdate: (e: JournalEntry) => void;
  settings: AppSettings;
}

export const useWorkspaceInfo = ({ entry, onUpdate, settings }: Props) => {
    const [tagInput, setTagInput] = useState('');
    const [showSecrets, setShowSecrets] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const timerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || settings.developerMode) return;
        const resetTimer = () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setShowHelp(true), 30000);
        };
        const handleMouseLeave = () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            setShowHelp(false);
        };
        container.addEventListener('mousemove', resetTimer, { passive: true });
        container.addEventListener('mouseleave', handleMouseLeave);
        resetTimer();
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            container.removeEventListener('mousemove', resetTimer);
            container.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [settings.developerMode]);

    const handleRestoreSnapshot = async (snapshot: Snapshot) => {
        const confirmed = await dialogService.confirm(
            t('restoreTitle', 'workspace'),
            t('restoreDesc', 'workspace'),
            { confirmText: t('restoreConfirm', 'workspace') }
        );
        if (confirmed) {
            onUpdate({ ...entry, files: snapshot.files });
            toast.success(t('changeApplied', 'builder'));
        }
    };

    return {
        tagInput,
        setTagInput,
        showSecrets,
        setShowSecrets,
        showHelp,
        setShowHelp,
        containerRef,
        handleRestoreSnapshot
    };
};
