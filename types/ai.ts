import { GeneratedFile, EnvVarRequest, CommandLog } from './project';

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
  contextSize?: string;
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

export interface AIProviderModel {
    id: string;
    name: string;
    description?: string;
    contextWindow?: number;
    maxOutputTokens?: number;
}

export interface AIProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKeyConfigKey: string; 
  models: AIProviderModel[];
}