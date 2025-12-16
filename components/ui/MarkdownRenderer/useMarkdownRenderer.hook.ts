
import { useMemo } from 'react';

export const useMarkdownRenderer = (content: string) => {
    const parts = useMemo(() => {
        if (!content) return [];
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        const result = [];
        let lastIndex = 0;
        let match;

        while ((match = codeBlockRegex.exec(content)) !== null) {
            if (match.index > lastIndex) {
                result.push({ type: 'text', content: content.slice(lastIndex, match.index) });
            }
            result.push({ type: 'code', language: match[1] || 'text', content: match[2].trim() });
            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < content.length) {
            result.push({ type: 'text', content: content.slice(lastIndex) });
        }
        return result;
    }, [content]);

    return { parts };
};
