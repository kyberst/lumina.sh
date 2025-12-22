
// --- Core Types ---

export enum AppModule {
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

// --- Project Types ---

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

export interface DependencyDetails {
  version: string;
  runtime: 'node' | 'python' | 'unknown';
}

export interface CommandLog {
    uid: string;
    command: string;
    status: 'pending' | 'approved' | 'executed' | 'skipped';
}

export interface JournalEntry {
  uid: string; // Changed from id to uid
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
  dependencies?: Record<string, string | DependencyDetails>;
  installCommand?: string;
  startCommand?: string;
  requiredEnvVars?: EnvVarRequest[];
  pendingGeneration?: boolean; 
}

// --- AI Types ---

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
  mid: string; // Changed from id to mid
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
  contextSize?: string;
  usage?: {
      inputTokens: number;
      outputTokens: number;
  };
  pending?: boolean;
  project_uid?: string; // Relation field
}

// --- Settings Types ---

export type ViewMode = 'builder' | 'projects' | 'graph' | 'chat' | 'settings';

export interface MemorySettings {
  enabled: boolean;
}

// Added AIProviderModel interface
export interface AIProviderModel {
  id: string;
  name: string;
  description?: string;
  contextWindow?: number;
  maxOutputTokens?: number;
}

// Added AIProvider interface
export interface AIProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKeyConfigKey: string;
  models: AIProviderModel[];
}

// Added MCPServer interface
export interface MCPServer {
  id: string;
  name: string;
  type: 'stdio' | 'websocket';
  command: string;
  args: string[];
}

export interface AppSettings {
  language: 'en' | 'es' | 'fr' | 'de';
  aiModel: 'flash' | 'pro';
  githubToken?: string;
  githubUsername?: string;
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
  memory: MemorySettings;
  releaseChannel: 'stable' | 'beta';
  executionEnvironment: 'local' | 'docker';
  nodePath?: string;
  telemetryEnabled: boolean;
  globalEnvVars: Record<string, string>;
  experiments: {
    nativeGit: boolean;
  };
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
