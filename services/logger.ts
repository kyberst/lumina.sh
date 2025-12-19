

import { AppModule, LogEntry, LogLevel } from '../types';
import { taskService } from './taskService';

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
    // in a controlled manner if strictly necessary.
    if (entry.level === LogLevel.ERROR) {
      console.error(`[${entry.module.toUpperCase()}] ${entry.message}`, entry.meta);
      this.persistErrorLog(entry);
    } else if (entry.message.includes('Perf') || entry.message.includes('Telemetry')) {
      // Allow specific info logs to show in console for debugging performance
      console.info(`[${entry.module.toUpperCase()}] ${entry.message}`, entry.meta);
    }
  }

  /**
   * Persists error logs to SurrealDB using the TaskService for sequential execution.
   * Uses dynamic import for dbCore to avoid circular dependencies (DB -> Logger -> DB).
   */
  private persistErrorLog(entry: LogEntry) {
      // Prevent infinite recursion if the DB itself logs an error while logging
      if (entry.module === AppModule.CORE && (entry.message.includes('Log') || entry.message.includes('Query'))) {
          return;
      }

      taskService.addTask('Persist Log', async () => {
          try {
              // Dynamic import to break circular dependency
              const { dbCore } = await import('./db/dbCore');
              
              if (dbCore.isReady) {
                  // Save to 'logs' table in SurrealDB
                  await dbCore.query(`CREATE logs CONTENT $entry`, { entry });
              }
          } catch (e) {
              console.warn("Failed to persist error log to local DB", e);
          }
      }, true); // Silent mode: true (No UI Toast)
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
