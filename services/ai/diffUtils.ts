
/**
 * Utility functions for handling Unified Diff format updates.
 */

export interface DiffLine {
    type: 'eq' | 'add' | 'del' | 'gap';
    content: string;
    lineNum?: number;
}

export interface DiffBlock {
    oldLines: DiffLine[];
    newLines: DiffLine[];
}

/**
 * Applies a Unified Diff content to the original string.
 * Returns an object indicating success or failure.
 */
export const applyDiff = (originalContent: string, diffContent: string): { success: boolean, content: string, error?: string } => {
    if (!diffContent.trim()) {
        return { success: true, content: originalContent };
    }

    const originalLines = originalContent.split('\n');
    const diffLines = diffContent.split('\n');

    let currentOriginalLine = 0;
    const resultLines = [];
    let hunkApplied = false;

    for (const line of diffLines) {
        if (line.startsWith('---') || line.startsWith('+++')) continue;
        
        if (line.startsWith('@@')) {
            const match = line.match(/@@ -(\d+)/);
            if (match) {
                const startLine = parseInt(match[1], 10) - 1;
                // Add lines from original content that are before this hunk
                while (currentOriginalLine < startLine) {
                    resultLines.push(originalLines[currentOriginalLine]);
                    currentOriginalLine++;
                }
                hunkApplied = true;
            }
            continue;
        }

        if (line.startsWith('+')) {
            resultLines.push(line.substring(1));
        } else if (line.startsWith('-')) {
            if (originalLines[currentOriginalLine] !== line.substring(1)) {
                 return { success: false, content: originalContent, error: `Patch mismatch: Expected to remove "${line.substring(1)}" but found "${originalLines[currentOriginalLine]}" at line ${currentOriginalLine + 1}.` };
            }
            currentOriginalLine++;
        } else { // Context line
            if (currentOriginalLine < originalLines.length && originalLines[currentOriginalLine] !== line.substring(1)) {
                 return { success: false, content: originalContent, error: `Patch context mismatch at line ${currentOriginalLine + 1}.` };
            }
            if (currentOriginalLine < originalLines.length) {
                resultLines.push(originalLines[currentOriginalLine]);
            }
            currentOriginalLine++;
        }
    }
    
    // Add any remaining lines from the original file
    while (currentOriginalLine < originalLines.length) {
        resultLines.push(originalLines[currentOriginalLine]);
        currentOriginalLine++;
    }

    if (!hunkApplied && diffContent.includes('@@')) {
        return { success: false, content: originalContent, error: "Could not parse any hunk from patch." };
    }

    return { success: true, content: resultLines.join('\n') };
};


/**
 * Generates a simple Unified Diff between two strings using LCS.
 * NOTE: This is a basic implementation suitable for text files.
 */
export const createPatch = (fileName: string, oldStr: string, newStr: string): string => {
    const oldLines = oldStr.split('\n');
    const newLines = newStr.split('\n');
    
    const matrix = computeLCSMatrix(oldLines, newLines);

    // Backtrack to generate diff lines
    const changes: string[] = [];
    let i = oldLines.length, j = newLines.length;
    
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
            changes.unshift(' ' + oldLines[i - 1]);
            i--; j--;
        } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
            changes.unshift('+' + newLines[j - 1]);
            j--;
        } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
            changes.unshift('-' + oldLines[i - 1]);
            i--;
        }
    }

    const hunks: string[] = [];
    hunks.push(`--- a/${fileName}`);
    hunks.push(`+++ b/${fileName}`);
    if (changes.length > 0) {
        hunks.push(`@@ -1,${Math.max(1, oldLines.length)} +1,${Math.max(1, newLines.length)} @@`);
        hunks.push(...changes);
    }
    return hunks.join('\n');
};

/**
 * Generates Side-by-Side Diff structure for UI rendering.
 * Aligns unchanged lines and marks additions/deletions.
 */
export const computeSideBySideDiff = (oldStr: string, newStr: string): DiffBlock[] => {
    const oldLines = oldStr.split('\n');
    const newLines = newStr.split('\n');
    const matrix = computeLCSMatrix(oldLines, newLines);
    
    let i = oldLines.length;
    let j = newLines.length;
    
    const resultOld: DiffLine[] = [];
    const resultNew: DiffLine[] = [];
    
    // Backtrack LCS
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldLines[i-1] === newLines[j-1]) {
            // Unchanged
            resultOld.unshift({ type: 'eq', content: oldLines[i-1], lineNum: i });
            resultNew.unshift({ type: 'eq', content: newLines[j-1], lineNum: j });
            i--; j--;
        } else if (j > 0 && (i === 0 || matrix[i][j-1] >= matrix[i-1][j])) {
            // Added in New
            resultOld.unshift({ type: 'gap', content: '' });
            resultNew.unshift({ type: 'add', content: newLines[j-1], lineNum: j });
            j--;
        } else if (i > 0 && (j === 0 || matrix[i][j-1] < matrix[i-1][j])) {
            // Deleted from Old
            resultOld.unshift({ type: 'del', content: oldLines[i-1], lineNum: i });
            resultNew.unshift({ type: 'gap', content: '' });
            i--;
        }
    }

    // Return single block for simplicity in this version
    return [{ oldLines: resultOld, newLines: resultNew }];
};

const computeLCSMatrix = (oldLines: string[], newLines: string[]): number[][] => {
    const matrix: number[][] = [];
    for (let i = 0; i <= oldLines.length; i++) matrix[i] = new Array(newLines.length + 1).fill(0);

    for (let i = 1; i <= oldLines.length; i++) {
        for (let j = 1; j <= newLines.length; j++) {
            if (oldLines[i - 1] === newLines[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1] + 1;
            } else {
                matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
            }
        }
    }
    return matrix;
}