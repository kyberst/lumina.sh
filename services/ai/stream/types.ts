
import { GeneratedFile, CodeAnnotation, AIPlan, DependencyDetails } from '../../../types';

export type StreamMode = 'TEXT' | 'REASONING' | 'SUMMARY' | 'FILE' | 'PATCH' | 'COMMAND';

export interface StreamState {
  buffer: string;             // Raw text buffer from stream
  mode: StreamMode;           // Current parsing mode
  currentFileName: string;    // Active file being written/patched
  currentCommandType?: string; // Type of the command being parsed
  reasoningBuffer: string;    // Accumulator for <lumina-reasoning>
  textBuffer: string;         // Accumulator for <lumina-summary>
  fileStatuses: Record<string, 'pending' | 'success' | 'error'>;
  workingFiles: GeneratedFile[];
  commands: string[];
  dependencies: Record<string, DependencyDetails>;
  annotations: CodeAnnotation[]; // Visual feedback/errors from AI
  aiPlan?: AIPlan; // Structured plan progress
}