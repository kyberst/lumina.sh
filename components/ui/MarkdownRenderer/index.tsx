
import React from 'react';
import { useMarkdownRenderer } from './useMarkdownRenderer.hook';
import { MarkdownRendererView } from './MarkdownRenderer.view';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const { parts } = useMarkdownRenderer(content);

  if (!content) return null;

  return <MarkdownRendererView parts={parts} className={className} />;
};
