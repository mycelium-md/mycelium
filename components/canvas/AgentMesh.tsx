"use client";
import { useEffect, useRef, useCallback } from "react";

interface MeshNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  isAccent: boolean;
  pulsePhase: number;
  opacity: number;
}

interface MeshEdge {
  from: number;
  to: number;
  dim: boolean;
}

const ACCENT = "#9B5FE3";          // violet-purple
const ACCENT_GLOW = "#B066FF";     // purple bloom
const NODE_COLOR = "#e8ccff";      // soft lavender white
const EDGE_COLOR = "rgba(155,95,227,0.25)"; // purple-tinted edge

// The exact logo geometry, scaled to canvas coordinates
function buildLogoNodes(cx: number, cy: number, scale: number): MeshNode[] {
  const raw = [
    { rx: -40, ry: -22, isAccent: false },  // 60,72 → left-top
    { rx: 40,  ry: -22, isAccent: false },  // 140,72 → right-top
    { rx: 0,   ry: 0,   isAccent: true  },  // 100,94 → center/accent
    { rx: -40, ry: 34,  isAccent: false },  // 60,128 → left-bottom
    { rx: 40,  ry: 34,  isAccent: false },  // 140,128 → right-bottom
    { rx: -16, ry: 20,  isAccent: false },  // 84,114 → mid-left
    { rx: 16,  ry: 20,  isAccent: false },  // 116,114 → mid-right
  ];

  return raw.map((n, i) => ({
    x: cx + n.rx * scale,
    y: cy + n.ry * scale,
    vx: (Math.random() - 0.5) * 0.2,
    vy: (Math.random() - 0.5) * 0.2,
    r: n.isAccent ? 11 * scale * 0.5 : i < 4 ? 8 * scale * 0.5 : 6 * scale * 0.5,
    isAccent: n.isAccent,
    pulsePhase: Math.random() * Math.PI * 2,
    opacity: i >= 5 ? 0.7 : 1.0,
  }));
}

function buildLogoEdges(): MeshEdge[] {
  return [
    { from: 0, to: 2, dim: false }, // left-top → center
    { from: 2, to: 1, dim: false }, // center → right-top
    { from: 0, to: 3, dim: false }, // left-top → left-bottom
    { from: 1, to: 4, dim: false }, // right-top → right-bottom
    { from: 0, to: 6, dim: true  }, // left-top → mid-right (cross)
    { from: 1, to: 5, dim: true  }, // right-top → mid-left (cross)
    { from: 5, to: 3, dim: true  }, // mid-left → left-bottom
    { from: 6, to: 4, dim: true  }, // mid-right → right-bottom
    { from: 5, to: 6, dim: false }, // mid-left → mid-right
  ];
}

interface Props {
  className?: string;
  animated?: boolean;
}

export default function AgentMesh({ className = "", animated = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<MeshNode[]>([]);
  const edgesRef = useRef<MeshEdge[]>([]);
  const timeRef = useRef(0);

  const init = useCallback((canvas: HTMLCanvasElement) => {
    const { width, height } = canvas;
    const cx = width * 0.5;
    const cy = height * 0.5;
    const scale = Math.min(width, height) / 200;
    nodesRef.current = buildLogoNodes(cx, cy, scale);
    edgesRef.current = buildLogoEdges();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      init(canvas);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (ts: number) => {
      timeRef.current = ts;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const t = ts / 1000;

      if (animated) {
        // Gently float nodes
        for (const n of nodes) {
          n.x += n.vx;
          n.y += n.vy;
          n.vx *= 0.99;
          n.vy *= 0.99;
          // Random impulse
          if (Math.random() < 0.005) {
            n.vx += (Math.random() - 0.5) * 0.3;
            n.vy += (Math.random() - 0.5) * 0.3;
          }
        }
      }

      // Draw edges
      for (const e of edges) {
        const a = nodes[e.from];
        const b = nodes[e.to];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = e.dim ? "rgba(155,95,227,0.08)" : EDGE_COLOR;
        ctx.lineWidth = e.dim ? 1 : 1.5;
        ctx.stroke();
      }

      // Draw nodes
      for (const n of nodes) {
        const pulse = n.isAccent
          ? 1 + 0.15 * Math.sin(t * (Math.PI * 2 / 3) + n.pulsePhase) // 3s period
          : 1 + 0.04 * Math.sin(t * 0.8 + n.pulsePhase);

        const drawR = n.r * pulse;

        if (n.isAccent) {
          // Glow halo
          const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, drawR * 3);
          grad.addColorStop(0, "rgba(176,102,255,0.45)");
          grad.addColorStop(0.5, "rgba(155,95,227,0.15)");
          grad.addColorStop(1, "rgba(106,31,168,0)");
          ctx.beginPath();
          ctx.arc(n.x, n.y, drawR * 3, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, drawR, 0, Math.PI * 2);
        ctx.fillStyle = n.isAccent ? ACCENT : NODE_COLOR;
        ctx.globalAlpha = n.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [animated, init]);

  return <canvas ref={canvasRef} className={`w-full h-full ${className}`} />;
}
