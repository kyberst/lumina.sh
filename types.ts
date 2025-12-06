

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

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string; // In a real app, use bcrypt. Here we simulate.
  avatar?: string; // URL or identifier
  credits: number;
  twoFactorEnabled: boolean;
  createdAt: number;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number; // Cost in USD
  credits: number; // Credits added
  type: 'purchase' | 'usage' | 'bonus';
  description: string;
  timestamp: number;
}

export interface GeneratedFile {
  name: string;
  content: string;
  language: 'javascript' | 'typescript' | 'html' | 'css' | 'json' | 'markdown';
}

export interface EnvVarRequest {
  key: string;
  description: string;
  type?: 'text' | 'password' | 'select';
  options?: string[]; // Used if type is 'select'
  defaultValue?: string;
}

export interface CommandLog {
    id: string;
    command: string;
    status: 'pending' | 'approved' | 'executed' | 'skipped';
}

export interface JournalEntry {
  id: string;
  prompt: string; // The user's idea
  timestamp: number;
  description?: string; // AI generated summary
  files: GeneratedFile[]; // The generated code files
  tags: string[]; 
  mood: number; // Retained for graph physics (Complexity/Creativity)
  sentimentScore?: number;
  project?: string;
  previewUrl?: string; // If we supported deployment
  contextSource?: string;
  envVars?: Record<string, string>; // Environment variables
  installCommand?: string;
  startCommand?: string;
  requiredEnvVars?: EnvVarRequest[]; // AI requests for env vars
  pendingGeneration?: boolean; // Flag to trigger live generation in Workspace
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  snapshot?: GeneratedFile[]; // For version control / restoration points
  reasoning?: string; // The internal thought process/technical plan
  modifiedFiles?: string[]; // List of files modified in this turn
  pendingFile?: string; // File currently being streamed/generated
  commands?: CommandLog[]; // Terminal commands generated
  attachments?: { name: string; type: string; data: string }[]; // Base64 data
  requiredEnvVars?: EnvVarRequest[]; // AI requests for env vars
  envVarsSaved?: boolean; // UI state to show if they were saved
  isStreaming?: boolean; // UI state for active stream
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
  apiKeyConfigKey: string; // The key used in sqlite app_config to store the actual secret
  models: AIModel[];
}

export interface AppSettings {
  language: 'en' | 'es';
  aiModel: 'flash' | 'pro';
  githubToken?: string;
  githubUsername?: string;
  theme: 'dark' | 'matrix';
  
  // Appearance
  zoomLevel: number; // 0.8 to 1.2 default 1.0

  // Automation
  compilerDir?: string;
  autoApprove: boolean;
  autoFix: boolean;

  // AI Config
  thinkingBudget: 'low' | 'medium' | 'high';
  contextSize: 'economy' | 'default' | 'plus' | 'high' | 'max';
  
  // Custom AI
  customProviders: AIProvider[];
  activeProviderId?: string; // 'gemini' or custom ID
  activeModelId?: string;

  // MCP
  mcpServers: MCPServer[];

  // Telemetry
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
  reasoning: string; // Technical plan or thought process
  commentary: string; // User facing explanation
  files: GeneratedFile[];
  modifiedFileNames: string[]; // List of files that were actually changed
  requiredEnvVars?: EnvVarRequest[]; // Variables needed by the code
}