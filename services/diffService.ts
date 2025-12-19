
import { GeneratedFile } from '../types';
import { createPatch, applyDiff } from './ai/diffUtils';

export interface SnapshotDiff {
    // Files changed: Map<Filename, UnifiedDiff>
    // Applying this diff to the NEW file reverts it to the OLD content.
    modified: Record<string, string>; 
    
    // Files to DELETE to revert state (Files added in the future)
    deleted: string[]; 

    // Files to ADD to revert state (Files deleted in the future)
    added: GeneratedFile[];
}

/**
 * Calculates a Reverse Diff (Undo Instructions).
 * Generates instructions to transition from NewFiles (T+1) -> OldFiles (T).
 */
export const calculateReverseDiff = (oldFiles: GeneratedFile[], newFiles: GeneratedFile[]): SnapshotDiff => {
    const diff: SnapshotDiff = {
        modified: {},
        added: [],
        deleted: []
    };

    const oldMap = new Map(oldFiles.map(f => [f.name, f]));
    const newMap = new Map(newFiles.map(f => [f.name, f]));

    // 1. Check for files present in OLD but missing in NEW (Deleted by user/AI)
    // To Undo: We must ADD them back.
    for (const oldFile of oldFiles) {
        if (!newMap.has(oldFile.name)) {
            diff.added.push(oldFile);
        } else {
            // File exists in both. Check if content changed.
            const newFile = newMap.get(oldFile.name)!;
            if (newFile.content !== oldFile.content) {
                // Modified. Create a patch that transforms NEW -> OLD.
                // We pass (new, old) order because we want to apply patch to NEW to get OLD.
                diff.modified[oldFile.name] = createPatch(oldFile.name, newFile.content, oldFile.content);
            }
        }
    }

    // 2. Check for files present in NEW but missing in OLD (Added by user/AI)
    // To Undo: We must DELETE them.
    for (const newFile of newFiles) {
        if (!oldMap.has(newFile.name)) {
            diff.deleted.push(newFile.name);
        }
    }

    return diff;
};

/**
 * Applies a Reverse Diff to the Current Files to reconstruct Previous State.
 */
export const applyReverseSnapshotDiff = (currentFiles: GeneratedFile[], diff: SnapshotDiff): GeneratedFile[] => {
    let result = [...currentFiles];

    // 1. Handle Deletions (Files that were added in the future)
    // We remove them from current set.
    if (diff.deleted && diff.deleted.length > 0) {
        result = result.filter(f => !diff.deleted.includes(f.name));
    }

    // 2. Handle Additions (Files that were deleted in the future)
    // We add them back to current set.
    if (diff.added && diff.added.length > 0) {
        // Filter out if already exists to prevent duplication
        const existingNames = new Set(result.map(f => f.name));
        for (const file of diff.added) {
            if (!existingNames.has(file.name)) {
                result.push(file);
            }
        }
    }

    // 3. Handle Modifications (Apply Patch)
    // We update content using the stored diff.
    if (diff.modified) {
        result = result.map(f => {
            if (diff.modified[f.name]) {
                const revertedContent = applyDiff(f.content, diff.modified[f.name]);
                return { ...f, content: revertedContent };
            }
            return f;
        });
    }

    return result;
};
