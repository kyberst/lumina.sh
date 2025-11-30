type ToastType = 'success' | 'error' | 'info';

interface ToastEvent {
  id: string;
  message: string;
  type: ToastType;
}

type Listener = (toast: ToastEvent) => void;

class ToastService {
  private static instance: ToastService;
  private listeners: Listener[] = [];

  private constructor() {}

  public static getInstance(): ToastService {
    if (!ToastService.instance) {
      ToastService.instance = new ToastService();
    }
    return ToastService.instance;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public show(message: string, type: ToastType = 'info') {
    const event: ToastEvent = {
      id: crypto.randomUUID(),
      message,
      type
    };
    this.listeners.forEach(l => l(event));
  }

  public success(message: string) {
    this.show(message, 'success');
  }

  public error(message: string) {
    this.show(message, 'error');
  }

  public info(message: string) {
    this.show(message, 'info');
  }
}

export const toast = ToastService.getInstance();