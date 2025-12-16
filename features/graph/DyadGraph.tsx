
import React, { useEffect, useRef, useState } from 'react';
import { JournalEntry, AppModule } from '../../types';
import { t } from '../../services/i18n';
import { logger } from '../../services/logger';

interface DyadGraphProps { entries: JournalEntry[]; }
interface Node { x: number; y: number; r: number; entry: JournalEntry; vx: number; vy: number; }
interface Link { source: number; target: number; strength: number; }

export const DyadGraph: React.FC<DyadGraphProps> = ({ entries }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(t('initializing', 'graph'));
  const sim = useRef<{ nodes: Node[], links: Link[] }>({ nodes: [], links: [] });

  useEffect(() => {
    const init = async () => {
        setLoading(true);
        
        setStatus(t('indexingNodes', 'graph').replace('{count}', entries.length.toString()));
        await new Promise(r => setTimeout(r, 600));

        const nodes: Node[] = entries.map((entry) => ({
            x: Math.random() * 800, y: Math.random() * 600,
            r: Math.max(3, (entry.mood / 100) * 8 + 2),
            entry, vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
        }));

        setStatus(t('analyzingTopology', 'graph'));
        await new Promise(r => setTimeout(r, 800));

        const links: Link[] = [];
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const tagsA = nodes[i].entry.tags || [], tagsB = nodes[j].entry.tags || [];
                const shared = tagsA.filter(t => tagsB.includes(t));
                if (shared.length > 0) {
                    links.push({ source: i, target: j, strength: Math.min(0.8, 0.15 * shared.length) });
                }
            }
        }

        setStatus(t('mappedDependencies', 'graph').replace('{count}', links.length.toString()));
        await new Promise(r => setTimeout(r, 600));
        
        sim.current = { nodes, links };
        setLoading(false);
    };
    init();
  }, [entries]);

  useEffect(() => {
    if (loading || !canvasRef.current) return;
    const canvas = canvasRef.current, ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    logger.info(AppModule.GRAPH, 'Rendering Graph Frame');
    const resize = () => { canvas.width = canvas.parentElement?.clientWidth||800; canvas.height = canvas.parentElement?.clientHeight||600; };
    resize(); window.addEventListener('resize', resize);

    let frameId: number;
    const { nodes, links } = sim.current;

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 0.5;

      // Draw Pre-calc Links
      links.forEach(link => {
          const nA = nodes[link.source], nB = nodes[link.target];
          const dx = nA.x - nB.x, dy = nA.y - nB.y, dist = Math.sqrt(dx*dx + dy*dy);
          if (dist > 100) { // Attraction
             const fx = dx * 0.0001, fy = dy * 0.0001;
             nA.vx -= fx; nA.vy -= fy; nB.vx += fx; nB.vy += fy;
          }
          if (dist < 300) {
              ctx.strokeStyle = `rgba(16, 185, 129, ${link.strength})`;
              ctx.beginPath(); ctx.moveTo(nA.x, nA.y); ctx.lineTo(nB.x, nB.y); ctx.stroke();
          }
      });

      // Draw Nodes
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
        
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        const s = n.entry.sentimentScore || 0;
        ctx.fillStyle = s > 0.2 ? `rgba(16,185,129,${0.5+s/2})` : s < -0.2 ? `rgba(225,29,72,${0.5+Math.abs(s)/2})` : `rgba(59,130,246,0.6)`;
        ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.stroke();
      });
      frameId = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(frameId); };
  }, [loading]);

  return (
    <div className="w-full h-[60vh] relative border border-white/10 bg-black overflow-hidden group font-mono">
      {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-20 gap-4">
              <div className="w-12 h-12 border-4 border-indigo-900 border-t-indigo-500 rounded-full animate-spin"></div>
              <div className="text-xs text-indigo-400 uppercase tracking-[0.2em] animate-pulse">{status}</div>
          </div>
      ) : (
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <h3 className="text-xs text-emerald-500 uppercase tracking-[0.2em]">{t('nodes', 'graph')}</h3>
            <p className="text-[10px] text-slate-600 mt-1">{entries.length} {t('pattern', 'graph')}</p>
        </div>
      )}
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
    </div>
  );
};
