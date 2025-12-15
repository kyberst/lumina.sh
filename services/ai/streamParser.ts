
import { GeneratedFile } from '../../types';
import { StreamState } from './stream/types';
import { parseStreamChunk } from './stream/chunkParser';

export * from './stream/types';
export * from './stream/chunkParser';

export const createInitialStreamState = (initialFiles: GeneratedFile[]): StreamState => ({
  buffer: '',
  mode: 'TEXT',
  currentFileName: '',
  currentCommandType: undefined,
  reasoningBuffer: '',
  textBuffer: '',
  fileStatuses: {},
  workingFiles: [...initialFiles],
  commands: [],
  dependencies: {},
  annotations: [],
  aiPlan: undefined,
  patches: {},
  patchError: undefined,
  requiredEnvVars: []
});

export const finalizeStream = (state: StreamState): StreamState => ({ ...state, buffer: '', mode: 'TEXT', currentCommandType: undefined });

export { parseStreamChunk };