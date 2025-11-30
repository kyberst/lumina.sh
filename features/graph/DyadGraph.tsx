import React, { useEffect, useRef } from 'react';
import { JournalEntry, AppModule } from '../../types';
import { t } from '../../services/i18n';
import { logger } from '../../services/logger';

interface DyadGraphProps {
  entries: JournalEntry[];
}

interface Node {
  x: number;
  y: number;
  r: number;
  entry: JournalEntry;
  vx: number;
  vy: number;
}

export const DyadGraph: React.FC<DyadGraphProps> = ({ entries }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    logger.info(AppModule.GRAPH, 'Rendering Neural Graph');

    // Resize canvas
    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = canvas.parentElement?.clientHeight || 600;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize Nodes
    const nodes: Node[] = entries.map((entry, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.max(3, (entry.mood / 100) * 8 + 2),
      entry,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
    }));

    let animationId: number;

    const draw = () => {
      if (!ctx) return;
      
      // Trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 0.5;

      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];

        // 1. Time Connection (Chronological)
        if (i < nodes.length - 1) {
          const nodeB = nodes[i + 1];
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'; 
          ctx.beginPath();
          ctx.moveTo(nodeA.x, nodeA.y);
          ctx.lineTo(nodeB.x, nodeB.y);
          ctx.stroke();
        }

        // 2. Semantic Connection (Shared Tags)
        // This is the "Dyad" feature: finding patterns across time
        for (let j = i + 1; j < nodes.length; j++) {
           const nodeB = nodes[j];
           
           // Calculate distance
           const dx = nodeA.x - nodeB.x;
           const dy = nodeA.y - nodeB.y;
           const dist = Math.sqrt(dx*dx + dy*dy);

           // Check for shared tags
           const sharedTags = nodeA.entry.tags.filter(tag => nodeB.entry.tags.includes(tag));
           
           if (sharedTags.length > 0) {
             // Attraction force
             if (dist > 100) {
                nodeA.vx -= dx * 0.0001;
                nodeA.vy -= dy * 0.0001;
                nodeB.vx += dx * 0.0001;
                nodeB.vy += dy * 0.0001;
             }

             // Draw Semantic Link
             if (dist < 300) {
               ctx.strokeStyle = `rgba(16, 185, 129, ${0.15 * sharedTags.length})`; // Emerald based on strength
               ctx.beginPath();
               ctx.moveTo(nodeA.x, nodeA.y);
               ctx.lineTo(nodeB.x, nodeB.y);
               ctx.stroke();
             }
           }
        }
      }

      // Update and Draw Nodes
      nodes.forEach(node => {
        // Physics
        node.x += node.vx;
        node.y += node.vy;

        // Boundaries
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // Draw Node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        
        // Color based on sentiment
        const sentiment = node.entry.sentimentScore || 0;
        if (sentiment > 0.2) ctx.fillStyle = `rgba(16, 185, 129, ${0.5 + sentiment/2})`; // Green
        else if (sentiment < -0.2) ctx.fillStyle = `rgba(225, 29, 72, ${0.5 + Math.abs(sentiment)/2})`; // Red
        else ctx.fillStyle = `rgba(59, 130, 246, 0.6)`; // Blue neutral

        ctx.fill();
        
        // Active Node Glow
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.stroke();
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [entries]);

  return (
    <div className="w-full h-[60vh] relative border border-white/10 bg-black overflow-hidden group">
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h3 className="text-xs text-emerald-500 uppercase tracking-[0.2em]">{t('nodes', 'graph')}</h3>
        <p className="text-[10px] text-slate-600 mt-1">{entries.length} {t('pattern', 'graph')}</p>
        <p className="text-[9px] text-slate-700 mt-0.5">SEMANTIC LAYERING ACTIVE</p>
      </div>
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
    </div>
  );
};