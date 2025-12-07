import { AIProvider, MCPServer } from './ai';

export type ViewMode = 'builder' | 'projects' | 'graph' | 'chat' | 'settings' | 'profile';

export interface MemorySettings {
  enabled: boolean;
  qdrantUrl: string;
  qdrantKey?: string;
  neo4jUrl: string; // HTTP endpoint, e.g. http://localhost:7474/db/neo4j/tx/commit
  neo4jUser?: string;
  neo4jPass?: string;
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
  memory: MemorySettings;
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