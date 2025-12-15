
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
    id: string;
    command: string;
    status: 'pending' | 'approved' | 'executed' | 'skipped';
}

export interface Snapshot {
  id: string;
  timestamp: number;
  description: string;
  files: GeneratedFile[];
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
  dependencies?: Record<string, string | DependencyDetails>;
  installCommand?: string;
  startCommand?: string;
  requiredEnvVars?: EnvVarRequest[];
  pendingGeneration?: boolean;
  history?: Snapshot[];
}
