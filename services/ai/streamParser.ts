import { GeneratedFile } from '../../types';
import { StreamState } from './stream/types';
import { parseStreamChunk } from './stream/chunkParser';

export * from './stream/types';
export * from './stream/chunkParser';

export const createInitialStreamState = (initialFiles: GeneratedFile[]): StreamState => ({
  buffer: '',
  mode: 'TEXT',
  currentFileName: '',
  reasoningBuffer: '',
  textBuffer: '',
  fileStatuses: {},
  workingFiles: [...initialFiles],
  commands: [],
  dependencies: {},
  annotations: [],
  aiPlan: undefined
});

export const finalizeStream = (state: StreamState): StreamState => ({ ...state, buffer: '', mode: 'TEXT' });

export { parseStreamChunk };