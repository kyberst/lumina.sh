import { AppModule, LogEntry, LogLevel } from '../types';

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

  private pushLog(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > 1000) {
      this.logs.shift(); // Rotate logs
    }
    
    // In a real production app, this would send to a server.
    // We suppress raw console.log as requested, but map to console.info/error for dev visibility
    // in a controlled manner if strictly necessary, but sticking to request to omit generic console.log
    if (entry.level === LogLevel.ERROR) {
      console.error(`[${entry.module.toUpperCase()}] ${entry.message}`, entry.meta);
    }
  }

  public info(module: AppModule, message: string, meta?: any) {
    this.pushLog({
      level: LogLevel.INFO,
      module,
      message,
      timestamp: Date.now(),
      meta
    });
  }

  public warn(module: AppModule, message: string, meta?: any) {
    this.pushLog({
      level: LogLevel.WARN,
      module,
      message,
      timestamp: Date.now(),
      meta
    });
  }

  public error(module: AppModule, message: string, meta?: any) {
    this.pushLog({
      level: LogLevel.ERROR,
      module,
      message,
      timestamp: Date.now(),
      meta
    });
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }
}

export const logger = LoggerService.getInstance();