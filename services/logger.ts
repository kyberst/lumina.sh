
import { AppModule, LogEntry, LogLevel } from '../types';
import { taskService } from './taskService';
import { toast } from './toastService';
import { getLanguage } from './i18n';

const FRIENDLY_ERRORS_EN: Record<string, string> = {
    "API_KEY": "AI configuration is missing. Please check your settings.",
    "QUOTA": "The AI is a bit tired (limit reached). Please wait a moment.",
    "NETWORK": "There seems to be an issue with your internet connection.",
    "DEFAULT": "An unexpected error occurred. We are working to fix it."
};

const FRIENDLY_ERRORS_ES: Record<string, string> = {
    "API_KEY": "Falta la configuración de la IA. Por favor, revisa tus ajustes.",
    "QUOTA": "La IA está un poco cansada (límite alcanzado). Por favor, espera un momento.",
    "NETWORK": "Parece que hay un problema con tu conexión a internet.",
    "DEFAULT": "Ha ocurrido un error inesperado. Estamos trabajando para solucionarlo."
};

class LoggerService {
  private logs: LogEntry[] = [];
  private static instance: LoggerService;

  private constructor() {}

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  private getFriendlyMessage(msg: string): string {
      const lang = getLanguage();
      const map = lang === 'es' ? FRIENDLY_ERRORS_ES : FRIENDLY_ERRORS_EN;
      
      const upperMsg = msg.toUpperCase();
      if (upperMsg.includes('API_KEY')) return map.API_KEY;
      if (upperMsg.includes('429') || upperMsg.includes('QUOTA') || upperMsg.includes('EXHAUSTED')) return map.QUOTA;
      if (upperMsg.includes('FETCH') || upperMsg.includes('NETWORK') || upperMsg.includes('FAILED TO FETCH')) return map.NETWORK;
      
      return map.DEFAULT;
  }

  private pushLog(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > 1000) {
      this.logs.shift(); // Rotate logs
    }
    
    if (entry.level === LogLevel.ERROR) {
      console.error(`[${entry.module.toUpperCase()}] ${entry.message}`, entry.meta);
      
      // UI Toast for user feedback
      const friendlyMsg = this.getFriendlyMessage(entry.message);
      toast.error(friendlyMsg);
      
      this.persistErrorLog(entry);
    } else if (entry.message.includes('Perf') || entry.message.includes('Telemetry')) {
      console.info(`[${entry.module.toUpperCase()}] ${entry.message}`, entry.meta);
    }
  }

  private persistErrorLog(entry: LogEntry) {
      if (entry.module === AppModule.CORE && (entry.message.includes('Log') || entry.message.includes('Query'))) {
          return;
      }

      taskService.addTask('Persist Log', async () => {
          try {
              const { dbCore } = await import('./db/dbCore');
              if (dbCore.isReady) {
                  await dbCore.query(`CREATE logs CONTENT $entry`, { entry });
              }
          } catch (e) {
              console.warn("Failed to persist error log to local DB", e);
          }
      }, true); 
  }

  public info(module: AppModule, message: string, meta?: any) {
    this.pushLog({ level: LogLevel.INFO, module, message, timestamp: Date.now(), meta });
  }

  public warn(module: AppModule, message: string, meta?: any) {
    this.pushLog({ level: LogLevel.WARN, module, message, timestamp: Date.now(), meta });
  }

  public error(module: AppModule, message: string, meta?: any) {
    this.pushLog({ level: LogLevel.ERROR, module, message, timestamp: Date.now(), meta });
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }
}

export const logger = LoggerService.getInstance();
