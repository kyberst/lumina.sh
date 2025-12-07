
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryOrchestrator } from '../index';
import { dbCore } from '../../db/dbCore';
import { AppSettings } from '../../../types';

vi.mock('../../db/dbCore', () => ({
  dbCore: {
    query: vi.fn()
  }
}));

// Mock GoogleGenAI to avoid API keys in tests
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      embedContent: vi.fn().mockResolvedValue({
        embeddings: [{ values: [0.1, 0.2, 0.3] }]
      })
    }
  }))
}));

describe('MemoryOrchestrator (Unit)', () => {
  let memory: MemoryOrchestrator;
  const mockSettings: AppSettings = {
    language: 'en',
    aiModel: 'flash',
    theme: 'dark',
    zoomLevel: 1,
    thinkingBudget: 'medium',
    contextSize: 'default',
    autoApprove: false,
    autoFix: false,
    mcpServers: [],
    customProviders: [],
    telemetryId: 'test',
    memory: { enabled: true }
  };

  beforeEach(() => {
    memory = new MemoryOrchestrator(mockSettings);
    vi.clearAllMocks();
  });

  it('should sync codebase by extracting imports and creating graph edges', async () => {
    const files = [{
      name: 'App.tsx',
      content: 'import React from "react";\nimport { Button } from "./components/Button";',
      language: 'typescript' as const
    }];

    await memory.syncCodebase(files);

    // Expect node update
    expect(dbCore.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE type::thing('files', $name)"), 
        expect.objectContaining({ name: 'App.tsx' })
    );

    // Expect edge creation (RELATE)
    expect(dbCore.query).toHaveBeenCalledWith(
        expect.stringContaining("RELATE type::thing('files', $src)->imports->type::thing('files', $target)"),
        expect.objectContaining({ src: 'App.tsx', target: 'components/Button.tsx' }) // .tsx appended by heuristic
    );
  });

  it('should construct a retrieval query using vector similarity', async () => {
    vi.mocked(dbCore.query).mockResolvedValue([
        { 
            content: "Old memory", 
            score: 0.9, 
            related_code: [{ name: 'App.tsx', imports: ['components/Button.tsx'] }] 
        }
    ]);

    const context = await memory.retrieveContext("How does the app start?");
    
    expect(context).toContain('[Architectural Context (RAG)]');
    expect(context).toContain('App.tsx');
    expect(context).toContain('Imports: [components/Button.tsx]');
  });
});
