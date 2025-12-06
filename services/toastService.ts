
type ToastType = 'success' | 'error' | 'info' | 'loading';

interface ToastEvent {
  id: string;
  message: string;
  type: ToastType;
}

type Listener = (toasts: ToastEvent[]) => void;

class ToastService {
  private static instance: ToastService;
  private listeners: Listener[] = [];
  private activeToasts: ToastEvent[] = [];

  private constructor() {}

  public static getInstance(): ToastService {
    if (!ToastService.instance) {
      ToastService.instance = new ToastService();
    }
    return ToastService.instance;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    listener(this.activeToasts); // Initial state
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l([...this.activeToasts]));
  }

  public show(message: string, type: ToastType = 'info'): string {
    const id = crypto.randomUUID();
    const event: ToastEvent = { id, message, type };
    this.activeToasts.push(event);
    this.notify();

    if (type !== 'loading') {
        setTimeout(() => {
            this.dismiss(id);
        }, 4000);
    }
    return id;
  }

  public dismiss(id: string) {
      this.activeToasts = this.activeToasts.filter(t => t.id !== id);
      this.notify();
  }

  public success(message: string) { this.show(message, 'success'); }
  public error(message: string) { this.show(message, 'error'); }
  public info(message: string) { this.show(message, 'info'); }
  
  public loading(message: string): string {
      return this.show(message, 'loading');
  }
}

export const toast = ToastService.getInstance();
