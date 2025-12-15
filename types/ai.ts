import { GeneratedFile, EnvVarRequest, CommandLog } from './project';

// FIX: Define and export AIProvider, MCPServer, and CodeSymbol types.
export interface AIProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKeyConfigKey?: string;
  models: { id: string; name: string }[];
}

export interface MCPServer {
  id: string;
  name: string;
  type: 'stdio' | 'websocket';
  command: string;
  args: string[];
}

export interface CodeSymbol {
  name: string;
  type: string;
  doc: string;
  signature: string;
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

export interface AIAudit {
  tokenUsage: { input: number; output: number; };
  model: string;
  provider: string;
  thinkingBudget?: 'low' | 'medium' | 'high';
  contextSize?: 'economy' | 'default' | 'plus' | 'high' | 'max';
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
  patches?: Record<string, string>;
  simplifiedText?: string;
  audit?: AIAudit;
  applied?: boolean;
  checkpointName?: string;
  
  // For Intelligent Interceptors
  suggestions?: Array<{ label: string; action: string; payload?: any; }>;
  propInputs?: Array<{ name: string; type: string; isOptional: boolean; value?: string; }>;
  isAwaitingInput?: boolean;
  bypassInterceptors?: boolean; // If true, skips reuse/prop suggestions
}