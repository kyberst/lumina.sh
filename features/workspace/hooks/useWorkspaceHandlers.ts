import { toast } from '../../../services/toastService';
import { dbFacade } from '../../../services/dbFacade';
import { dialogService } from '../../../services/dialogService';
import { t } from '../../../services/i18n';
import { publishToGitHub } from '../../../services/githubService';

export const useWorkspaceHandlers = (entry: any, onUpdate: any, layout: any, editor: any, stream: any, history: any, setHistory: any, setEditorPanel: any, isMobile: boolean) => {
  return {
    handleStop: () => {
      stream.cancelStream();
      if (entry.pendingGeneration) onUpdate({ ...entry, pendingGeneration: false });
    },
    handleRevert: async (id: string) => {
      if (await dialogService.confirm(t('dialog.revertTitle', 'builder'), t('dialog.revertDesc', 'builder'), { destructive: true })) {
        const idx = history.findIndex((m: any) => m.refactor_history_id === id);
        if (idx > 0) {
          await dbFacade.revertToSnapshot(entry.projects_id, history[idx - 1].snapshot, history[idx - 1].timestamp);
          const updated = await dbFacade.getProjectById(entry.projects_id);
          if (updated) {
            await onUpdate(updated);
            setHistory(await dbFacade.getRefactorHistory(entry.projects_id));
            layout.refreshPreview();
          }
        }
      }
    },
    handlePublish: async (settings: any) => {
      if (!settings.githubToken) return toast.error("Token missing");
      const name = prompt(t('repoName', 'builder'), entry.project);
      if (name) {
        const tid = toast.loading("Publishing...");
        try {
          const url = await publishToGitHub(entry, name, settings.githubToken, true);
          toast.success(`Done: ${url}`);
        } catch (e: any) {
          toast.error(e.message || "Failed");
        } finally {
          toast.dismiss(tid);
        }
      }
    },
    handleDownload: async () => {
      const JSZip = (window as any).JSZip;
      if (!JSZip) return toast.error("ZIP library not loaded");
      const zip = new JSZip();
      (entry.files ?? []).forEach((f: any) => zip.file(f.name, f.content));
      const tid = toast.loading(t('dialog.downloading', 'builder'));
      try {
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${entry.project || 'project'}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Project exported");
      } catch (e) {
        toast.error("Export failed");
      } finally {
        toast.dismiss(tid);
      }
    },
    handleApplyDirectStyle: async (selector: string, styles: any) => {
      const styleStr = Object.entries(styles).map(([k, v]) => `  ${k}: ${v} !important;`).join('\n');
      const rule = `\n/* Manual Edit */\n${selector} {\n${styleStr}\n}\n`;
      let files = [...(entry.files ?? [])];
      const idxFile = files.find(f => f.name === 'index.html');
      if (!idxFile) return toast.error("index.html not found");

      let content = idxFile.content;
      const tagId = 'lumina-manual-styles';
      const tagRegex = new RegExp(`<style id="${tagId}">([\\s\\S]*?)</style>`);
      const match = content.match(tagRegex);

      if (match) {
        content = content.replace(tagRegex, `<style id="${tagId}">${match[1]}${rule}</style>`);
      } else {
        const newTag = `\n<style id="${tagId}">${rule}</style>\n</head>`;
        content = content.includes('</head>') ? content.replace('</head>', newTag) : `<style id="${tagId}">${rule}</style>\n` + content;
      }

      files = files.map(f => f.name === 'index.html' ? { ...f, content } : f);
      await onUpdate({ ...entry, files });
      setEditorPanel({ isOpen: false, selector: null });
      layout.refreshPreview();
      toast.success("Styles applied");
    }
  };
};