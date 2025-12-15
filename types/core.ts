
export enum AppModule {
  AUTH = 'auth',
  BUILDER = 'builder',
  INSIGHT = 'insight',
  SETTINGS = 'settings',
  CORE = 'core',
  GRAPH = 'graph',
  INTEGRATION = 'integration'
}

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export class AppError extends Error {
  public readonly code: string;
  public readonly module: AppModule;
  public readonly timestamp: number;
  public readonly meta?: Record<string, any>;

  constructor(message: string, code: string, module: AppModule, meta?: Record<string, any>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.module = module;
    this.timestamp = Date.now();
    this.meta = meta;
  }
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  module: AppModule;
  timestamp: number;
  meta?: any;
}

export interface ValidationSchema {
  type: 'string' | 'number' | 'object' | 'array';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  required?: string[];
  properties?: Record<string, ValidationSchema>;
}
