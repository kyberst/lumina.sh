import { AIProvider, MCPServer } from './ai';

export type ViewMode = 'builder' | 'projects' | 'graph' | 'chat' | 'settings';

export interface MemorySettings {
  enabled: boolean;
}

export interface AppSettings {
  language: 'en' | 'es';
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