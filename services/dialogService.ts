
import { ReactNode } from 'react';

type DialogType = 'confirm' | 'alert' | 'prompt';

interface DialogRequest {
  id: string;
  type: DialogType;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (val?: string) => void;
  onCancel: () => void;
  destructive?: boolean;
  hideButtons?: boolean;
}

type Listener = (dialog: DialogRequest | null) => void;

class DialogService {
  private static instance: DialogService;
  private listener: Listener | null = null;

  private constructor() {}

  public static getInstance(): DialogService {
    if (!DialogService.instance) {
      DialogService.instance = new DialogService();
    }
    return DialogService.instance;
  }

  public subscribe(listener: Listener) {
    this.listener = listener;
    return () => { this.listener = null; };
  }

  public confirm(title: string, description: ReactNode, options?: { destructive?: boolean, confirmText?: string }): Promise<boolean> {
    return new Promise((resolve) => {
      const request: DialogRequest = {
        id: crypto.randomUUID(),
        type: 'confirm',
        title,
        description,
        destructive: options?.destructive,
        confirmLabel: options?.confirmText || 'Continue',
        onConfirm: () => {
          this.close();
          resolve(true);
        },
        onCancel: () => {
          this.close();
          resolve(false);
        }
      };
      if (this.listener) this.listener(request);
    });
  }

  public alert(title: string, description: ReactNode, options?: { hideButtons?: boolean }): Promise<void> {
      return new Promise((resolve) => {
        const request: DialogRequest = {
            id: crypto.randomUUID(),
            type: 'alert',
            title,
            description,
            confirmLabel: 'OK',
            hideButtons: options?.hideButtons,
            onConfirm: () => {
                this.close();
                resolve();
            },
            onCancel: () => {
                this.close();
                resolve();
            }
        };
        if (this.listener) this.listener(request);
      });
  }
  
  public close() {
    if (this.listener) this.listener(null);
  }
}

export const dialogService = DialogService.getInstance();
