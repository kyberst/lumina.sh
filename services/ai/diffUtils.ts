/**
 * Utility functions for handling Unified Diff format updates.
 * Used by the Stream Parser to apply AI-generated patches to code files.
 */

/**
 * Applies a Unified Diff content to the original string.
 * It is robust against incorrect line numbers in the diff header (@@ ... @@)
 * by relying on context lines for fuzzy matching.
 * 
 * @param originalContent The current file content
 * @param diffContent The unified diff string provided by the AI
 * @returns The new file content
 */
export const applyDiff = (originalContent: string, diffContent: string): string => {
    const lines = originalContent.split('\n');
    let result = [...lines];
    
    // Normalize newlines in diff
    const diffLines = diffContent.split('\n');
    
    let i = 0;
    while (i < diffLines.length) {
        // Find start of a hunk
        if (!diffLines[i].startsWith('@@')) {
            i++;
            continue;
        }

        i++; // Skip the @@ header line (we ignore line numbers as LLMs are bad at counting)
        
        const searchBlock: string[] = [];
        const replaceBlock: string[] = [];
        
        // Collect lines for this hunk until next @@ or end
        while (i < diffLines.length && !diffLines[i].startsWith('@@')) {
            const line = diffLines[i];
            const char = line.charAt(0);
            const text = line.substring(1); 

            if (char === ' ') {
                searchBlock.push(text);
                replaceBlock.push(text);
            } else if (char === '-') {
                searchBlock.push(text);
            } else if (char === '+') {
                replaceBlock.push(text);
            }
            i++;
        }

        if (searchBlock.length === 0 && replaceBlock.length === 0) continue;

        // Strategy 1: Exact string replace (Fast & Accurate if LLM is perfect)
        const searchString = searchBlock.join('\n');
        const replaceString = replaceBlock.join('\n');
        
        const exactResult = result.join('\n').replace(searchString, replaceString);
        if (exactResult !== result.join('\n')) {
            result = exactResult.split('\n');
            continue;
        }

        // Strategy 2: Line-by-line Fuzzy Matching (ignores whitespace diffs)
        // Useful when LLM hallucinating indentation
        let bestMatchIndex = -1;
        const norm = (s: string) => s.trim();

        for (let l = 0; l <= result.length - searchBlock.length; l++) {
            let match = true;
            for (let s = 0; s < searchBlock.length; s++) {
                if (norm(result[l + s]) !== norm(searchBlock[s])) {
                    match = false;
                    break;
                }
            }
            if (match) {
                bestMatchIndex = l;
                break; 
            }
        }

        if (bestMatchIndex !== -1) {
            const before = result.slice(0, bestMatchIndex);
            const after = result.slice(bestMatchIndex + searchBlock.length);
            result = [...before, ...replaceBlock, ...after];
        } else {
            console.warn("Could not apply hunk:", searchBlock.join('\n'));
        }
    }

    return result.join('\n');
};
