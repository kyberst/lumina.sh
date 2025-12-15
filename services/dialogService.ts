
import { ReactNode } from 'react';

type DialogType = 'confirm' | 'alert' | 'prompt' | 'custom';

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
}

type Listener = (dialog: DialogRequest | null) => void;

class DialogService {
  private static instance: DialogService;
  private listener: Listener | null = null;
  private currentDialogId: string | null = null;

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
      this.currentDialogId = crypto.randomUUID();
      const request: DialogRequest = {
        id: this.currentDialogId,
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

  public alert(title: string, description: ReactNode): Promise<void> {
      return new Promise((resolve) => {
        this.currentDialogId = crypto.randomUUID();
        const request: DialogRequest = {
            id: this.currentDialogId,
            type: 'alert',
            title,
            description,
            confirmLabel: 'OK',
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
  
  public custom(title: string, description: ReactNode): { close: () => void } {
    this.currentDialogId = crypto.randomUUID();
    const request: DialogRequest = {
      id: this.currentDialogId,
      type: 'custom',
      title,
      description,
      onConfirm: () => this.close(),
      onCancel: () => this.close()
    };
    if (this.listener) this.listener(request);
    
    return {
        close: () => this.close()
    };
  }

  private close() {
    if (this.listener) {
        this.listener(null);
        this.currentDialogId = null;
    }
  }
}

export const dialogService = DialogService.getInstance();