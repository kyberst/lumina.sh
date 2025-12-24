
import { GeneratedFile } from '../../../types';

/**
 * Creates a checksum-like manifest of the current file system state.
 * Used by the AI to reconcile its mental model with reality.
 */
export const generateFSManifest = (files: GeneratedFile[]): string => {
    if (!files || files.length === 0) return "[WORKSPACE_EMPTY]";
    
    const manifest = files.map(f => {
        return `- ${f.name} (${f.content.length} bytes)`;
    }).join('\n');

    return `
[FILE_SYSTEM_SYNC_MANIFEST]
Current valid files in workspace:
${manifest}
[END_SYNC_MANIFEST]
`.trim();
};
