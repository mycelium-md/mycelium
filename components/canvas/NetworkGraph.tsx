"use client";
import { useEffect, useRef, useCallback } from "react";
import type { NetworkGraph as NetworkGraphData, NetworkNode, NetworkEdge } from "@/lib/types";

interface Props {
  data: NetworkGraphData;
  onNodeClick?: (node: NetworkNode) => void;
  className?: string;
}

const ACCENT = "#5DCAA5";
const NODE_FILL = "#f5f5f0";
const EDGE_COLOR = "rgba(255,255,255,0.15)";
const EDGE_ACTIVE = "rgba(93,202,165,0.4)";
const BG = "#0a0a0a";

interface SimNode extends NetworkNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number;
  fy?: number;
}

function forceSimulation(nodes: SimNode[], edges: NetworkEdge[], W: number, H: number) {
  const alpha = 0.3;
  const repulsion = 4000;
  const attractionK = 0.05;
  const centerK = 0.008;

  // Center gravity
  for (const n of nodes) {
    n.vx += (W / 2 - n.x) * centerK;
    n.vy += (H / 2 - n.y) * centerK;
  }

  // Repulsion between nodes
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[j].x - nodes[i].x;
      const dy = nodes[j].y - nodes[i].y;
      const d2 = dx * dx + dy * dy + 1;
      const force = repulsion / d2;
      const fx = (dx / Math.sqrt(d2)) * force;
      const fy = (dy / Math.sqrt(d2)) * force;
      nodes[i].vx -= fx;
      nodes[i].vy -= fy;
      nodes[j].vx += fx;
      nodes[j].vy += fy;
    }
  }

  // Attraction along edges
  for (const e of edges) {
    const src = nodes.find((n) => n.id === e.source);
    const tgt = nodes.find((n) => n.id === e.target);
    if (!src || !tgt) continue;
    const dx = tgt.x - src.x;
    const dy = tgt.y - src.y;
    src.vx += dx * attractionK;
    src.vy += dy * attractionK;
    tgt.vx -= dx * attractionK;
    tgt.vy -= dy * attractionK;
  }

  // Apply velocity + damping
  for (const n of nodes) {
    if (n.fx !== undefined) { n.x = n.fx; n.vx = 0; continue; }
    n.vx *= (1 - alpha * 0.1);
    n.vy *= (1 - alpha * 0.1);
    n.x += n.vx;
    n.y += n.vy;
    // Bounds
    n.x = Math.max(30, Math.min(W - 30, n.x));
    n.y = Math.max(30, Math.min(H - 30, n.y));
  }
}

export default function NetworkGraph({ data, onNodeClick, className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simNodesRef = useRef<SimNode[]>([]);
  const animRef = useRef<number>(0);
  const hoveredRef = useRef<string | null>(null);

  // Sync sim nodes with data
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;

    const existing = new Map(simNodesRef.current.map((n) => [n.id, n]));

    simNodesRef.current = data.nodes.map((n) => {
      const e = existing.get(n.id);
      return e
        ? { ...n, x: e.x, y: e.y, vx: e.vx, vy: e.vy }
        : {
            ...n,
            x: W / 2 + (Math.random() - 0.5) * 200,
            y: H / 2 + (Math.random() - 0.5) * 200,
            vx: 0,
            vy: 0,
          };
    });
  }, [data]);

  const handleClick = useCallback(
    (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || !onNodeClick) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      for (const n of simNodesRef.current) {
        const d = Math.sqrt((n.x - mx) ** 2 + (n.y - my) ** 2);
        const r = 6 + n.taskCount * 0.5;
        if (d < r + 8) {
          onNodeClick(n);
          return;
        }
      }
    },
    [onNodeClick]
  );

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let found: string | null = null;
    for (const n of simNodesRef.current) {
      const d = Math.sqrt((n.x - mx) ** 2 + (n.y - my) ** 2);
      const r = 6 + n.taskCount * 0.5;
      if (d < r + 8) { found = n.id; break; }
    }
    hoveredRef.current = found;
    canvas.style.cursor = found ? "pointer" : "default";
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mousemove", handleMouseMove);

    const draw = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      const nodes = simNodesRef.current;
      const edges = data.edges;

      // Run simulation step
      if (nodes.length > 0) {
        forceSimulation(nodes, edges, W, H);
      }

      // Draw edges
      for (const e of edges) {
        const src = nodes.find((n) => n.id === e.source);
        const tgt = nodes.find((n) => n.id === e.target);
        if (!src || !tgt) continue;
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = e.status === "ACTIVE" ? EDGE_ACTIVE : EDGE_COLOR;
        ctx.lineWidth = e.status === "ACTIVE" ? 2 : 1;
        ctx.stroke();
      }

      // Draw nodes
      for (const n of nodes) {
        const r = Math.max(5, 6 + n.taskCount * 0.5);
        const isActive = !!n.activeCoalition;
        const isHovered = hoveredRef.current === n.id;

        if (isActive) {
          const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 3);
          grad.addColorStop(0, "rgba(93,202,165,0.2)");
          grad.addColorStop(1, "rgba(93,202,165,0)");
          ctx.beginPath();
          ctx.arc(n.x, n.y, r * 3, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? ACCENT : NODE_FILL;
        ctx.globalAlpha = isHovered ? 1 : 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;

        if (isHovered || isActive) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 4, 0, Math.PI * 2);
          ctx.strokeStyle = isActive ? ACCENT : NODE_FILL;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.5;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // Label
        ctx.font = "11px var(--font-syne, sans-serif)";
        ctx.fillStyle = isActive ? ACCENT : "rgba(245,245,240,0.6)";
        ctx.textAlign = "center";
        ctx.fillText(n.name, n.x, n.y + r + 16);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, [data, handleClick, handleMouseMove]);

  return <canvas ref={canvasRef} className={`w-full h-full ${className}`} />;
}
