
import { describe, it, expect } from 'vitest';
import { calculateReverseDiff, applyReverseSnapshotDiff } from '../diffService';
import { GeneratedFile } from '../../types';

describe('DiffService (Unit)', () => {
  const fileA: GeneratedFile = { name: 'index.ts', content: 'console.log("Hello");', language: 'typescript' };
  const fileB: GeneratedFile = { name: 'utils.ts', content: 'export const add = (a,b) => a+b;', language: 'typescript' };
  
  it('should generate a reverse diff that reverts a modification', () => {
    const oldFiles = [fileA];
    const newFiles = [{ ...fileA, content: 'console.log("Hello World");' }];

    // Calculate how to go from New -> Old
    const diff = calculateReverseDiff(oldFiles, newFiles);
    
    expect(diff.modified['index.ts']).toBeDefined();
    
    // Apply reverse diff to New
    const restored = applyReverseSnapshotDiff(newFiles, diff);
    expect(restored[0].content).toBe(fileA.content);
  });

  it('should generate a reverse diff that deletes an added file', () => {
    const oldFiles = [fileA];
    const newFiles = [fileA, fileB]; // fileB was added

    // To go back to oldFiles, we must delete fileB
    const diff = calculateReverseDiff(oldFiles, newFiles);
    
    expect(diff.deleted).toContain('utils.ts');
    
    const restored = applyReverseSnapshotDiff(newFiles, diff);
    expect(restored.length).toBe(1);
    expect(restored[0].name).toBe('index.ts');
  });

  it('should generate a reverse diff that adds back a deleted file', () => {
    const oldFiles = [fileA, fileB];
    const newFiles = [fileA]; // fileB was deleted

    // To go back, we must add fileB back
    const diff = calculateReverseDiff(oldFiles, newFiles);
    
    expect(diff.added.length).toBe(1);
    expect(diff.added[0].name).toBe('utils.ts');

    const restored = applyReverseSnapshotDiff(newFiles, diff);
    expect(restored.length).toBe(2);
    expect(restored.find(f => f.name === 'utils.ts')).toBeDefined();
  });
});
