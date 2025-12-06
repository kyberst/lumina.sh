
/**
 * Global TypeScript definitions for Lumina Studio.
 * Organized by functional module.
 */

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

export type ViewMode = 'builder' | 'projects' | 'graph' | 'chat' | 'settings' | 'profile';

/** Represents an authenticated user in the local system. */
export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string; // Simulated auth
  avatar?: string; 
  credits: number;
  twoFactorEnabled: boolean;
  createdAt: number;
}

/** Represents a active login session. */
export interface Session {
  id: string;
  userId: string;
  device: string; // User Agent or simplified name
  ip: string;
  lastActive: number;
  isCurrent?: boolean; // UI helper, not DB
}

/** Represents a transaction or usage history. */
export interface Transaction {
  id: string;
  userId: string;
  amount: number; // Currency amount (0 for bonus)
  credits: number; // Credits added/deducted
  type: 'purchase' | 'usage' | 'bonus' | 'refund';
  description: string;
  timestamp: number;
}

/** 
 * A single code file in the virtual file system. 
 * STRICTLY IMMUTABLE to prevent state mutation bugs during AI patching.
 */
export interface GeneratedFile {
  readonly name: string;
  readonly content: string;
  readonly language: 'javascript' | 'typescript' | 'html' | 'css' | 'json' | 'markdown';
}

export interface EnvVarRequest {
  key: string;
  description: string;
  type?: 'text' | 'password' | 'select';
  options?: string[]; 
  defaultValue?: string;
}

export interface CommandLog {
    id: string;
    command: string;
    status: 'pending' | 'approved' | 'executed' | 'skipped';
}

export interface JournalEntry {
  id: string;
  prompt: string;
  timestamp: number;
  description?: string;
  files: GeneratedFile[]; 
  tags: string[]; 
  mood: number;
  sentimentScore?: number;
  project?: string;
  previewUrl?: string; 
  contextSource?: string;
  envVars?: Record<string, string>;
  dependencies?: Record<string, string>;
  installCommand?: string;
  startCommand?: string;
  requiredEnvVars?: EnvVarRequest[];
  pendingGeneration?: boolean; 
}

export interface EditorContext {
  activeFile: string;
  cursorLine: number;
  selectedCode?: string;
}

export interface CodeAnnotation {
  file: string;
  line: number;
  type: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

export interface AIPlan {
  currentStep: number;
  totalSteps: number;
  currentTask: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  snapshot?: GeneratedFile[];
  reasoning?: string;
  plan?: AIPlan;
  modifiedFiles?: string[]; 
  pendingFile?: string; 
  commands?: CommandLog[]; 
  attachments?: { name: string; type: string; data: string }[];
  requiredEnvVars?: EnvVarRequest[];
  envVarsSaved?: boolean; 
  isStreaming?: boolean;
  editorContext?: EditorContext;
  annotations?: CodeAnnotation[];
  usage?: {
      inputTokens: number;
      outputTokens: number;
  };
}

export interface MCPServer {
  id: string;
  name: string;
  type: 'stdio' | 'websocket';
  command: string;
  args: string[];
  url?: string;
}

export interface AIProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKeyConfigKey: string; 
  models: { id: string, name: string }[];
}

export interface AppSettings {
  language: 'en' | 'es';
  aiModel: 'flash' | 'pro';
  githubToken?: string;
  githubUsername?: string;
  theme: 'dark' | 'matrix';
  zoomLevel: number; 
  compilerDir?: string;
  autoApprove: boolean;
  autoFix: boolean;
  thinkingBudget: 'low' | 'medium' | 'high';
  contextSize: 'economy' | 'default' | 'plus' | 'high' | 'max';
  customProviders: AIProvider[];
  activeProviderId?: string;
  activeModelId?: string;
  mcpServers: MCPServer[];
  telemetryId: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string;
  updated_at: string;
}

export interface GitHubEvent {
  type: string;
  repo: { name: string };
  created_at: string;
  payload?: any;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly module: AppModule;
  public readonly timestamp: number;

  constructor(message: string, code: string, module: AppModule) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.module = module;
    this.timestamp = Date.now();
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
