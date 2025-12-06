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

/** Represents a transaction or usage history. */
export interface Transaction {
  id: string;
  userId: string;
  amount: number; 
  credits: number; 
  type: 'purchase' | 'usage' | 'bonus';
  description: string;
  timestamp: number;
}

/** A single code file in the virtual file system. */
export interface GeneratedFile {
  name: string;
  content: string;
  language: 'javascript' | 'typescript' | 'html' | 'css' | 'json' | 'markdown';
}

/** Request from AI for runtime environment variables. */
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

/** 
 * Main Project entity. 
 * Represents a "Memory" or "App" in the system. 
 */
export interface JournalEntry {
  id: string;
  prompt: string;
  timestamp: number;
  description?: string;
  files: GeneratedFile[]; 
  tags: string[]; 
  mood: number; // Used for Graph Visualization (Physics size)
  sentimentScore?: number; // Used for Graph Color
  project?: string;
  previewUrl?: string; 
  contextSource?: string;
  envVars?: Record<string, string>;
  dependencies?: Record<string, string>; // ImportMap dependencies
  installCommand?: string;
  startCommand?: string;
  requiredEnvVars?: EnvVarRequest[];
  pendingGeneration?: boolean; 
}

/** Chat history for the Refactor/Workspace view. */
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  snapshot?: GeneratedFile[]; // Snapshot of files before this turn (for rollback)
  reasoning?: string; // <lumina-reasoning> content
  modifiedFiles?: string[]; 
  pendingFile?: string; 
  commands?: CommandLog[]; 
  attachments?: { name: string; type: string; data: string }[];
  requiredEnvVars?: EnvVarRequest[];
  envVarsSaved?: boolean; 
  isStreaming?: boolean;
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

export interface AIModel {
  id: string;
  name: string;
  contextWindow?: number;
  maxOutput?: number;
  description?: string;
}

export interface AIProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKeyConfigKey: string; 
  models: AIModel[];
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

export interface GitHubEvent {
  type: string;
  repo: { name: string };
  created_at: string;
  payload?: any;
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

export interface RefineAppResult {
  reasoning: string; 
  commentary: string; 
  files: GeneratedFile[];
  modifiedFileNames: string[];
  requiredEnvVars?: EnvVarRequest[];
}
