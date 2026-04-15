"use client";
import { useEffect, useRef, useState } from "react";

const STEPS = [
  {
    num: "01",
    title: "Agents register their capabilities.",
    body: "Each agent publishes a capability manifest to the mesh. No central registry. The manifest is a JSON-LD document describing what the agent can do, what protocols it speaks, and how to reach it. Any node in the network can read it.",
    animation: "register",
  },
  {
    num: "02",
    title: "A task broadcasts to the network.",
    body: "A task description enters the mesh as a broadcast message. No routing table. No orchestrator decides who handles it. Every agent that can process the message evaluates its own capabilities against the task requirements.",
    animation: "broadcast",
  },
  {
    num: "03",
    title: "A coalition forms. The task is done. It disbands.",
    body: "Agents that can collectively satisfy the task requirements form a temporary coalition using the Contract Net Protocol. They coordinate directly, execute the task, and dissolve. The mesh returns to its resting state. Nothing persists that doesn't need to.",
    animation: "dissolve",
  },
];

interface StepCanvasProps {
  type: "register" | "broadcast" | "dissolve";
  active: boolean;
}

function StepCanvas({ type, active }: StepCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    const cx = W / 2;
    const cy = H / 2;
    let t = 0;

    // Node positions for a small mesh
    const nodes = [
      { x: cx, y: cy - 50, active: false },
      { x: cx - 55, y: cy + 20, active: false },
      { x: cx + 55, y: cy + 20, active: false },
      { x: cx, y: cy + 70, active: false },
      { x: cx - 90, y: cy - 30, active: false },
    ];

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.02;

      if (type === "register") {
        // New node joining
        const joinProgress = active ? Math.min(1, (Math.sin(t * 0.5) + 1) / 2) : 0;
        const newNode = { x: cx + 90, y: cy - 50 };

        // Draw existing nodes and edges
        for (let i = 0; i < nodes.length - 1; i++) {
          for (let j = i + 1; j < nodes.length - 1; j++) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = "rgba(255,255,255,0.08)";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        for (let i = 0; i < nodes.length - 1; i++) {
          ctx.beginPath();
          ctx.arc(nodes[i].x, nodes[i].y, 5, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,255,255,0.7)";
          ctx.fill();
        }

        if (active && joinProgress > 0) {
          // Connecting line to new node
          const targetNode = nodes[0];
          ctx.beginPath();
          ctx.moveTo(targetNode.x, targetNode.y);
          ctx.lineTo(
            targetNode.x + (newNode.x - targetNode.x) * joinProgress,
            targetNode.y + (newNode.y - targetNode.y) * joinProgress
          );
          ctx.strokeStyle = `rgba(93,202,165,${joinProgress * 0.6})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // New node
          const pulse = 1 + 0.2 * Math.sin(t * 3);
          ctx.beginPath();
          ctx.arc(newNode.x, newNode.y, 7 * pulse * joinProgress, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(93,202,165,${joinProgress})`;
          ctx.fill();
        }
      } else if (type === "broadcast") {
        // Pulse wave from center
        const waveRadius = active ? (((t * 40) % 120) + 20) : 0;
        const waveAlpha = active ? Math.max(0, 0.4 - waveRadius / 120) : 0;

        // Draw nodes
        for (const n of nodes) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,255,255,0.7)";
          ctx.fill();
        }

        if (active) {
          // Wave rings
          for (let r = 0; r < 3; r++) {
            const rOffset = (r * 40) % 120;
            const currentR = (waveRadius + rOffset) % 120;
            const alpha = Math.max(0, 0.3 - currentR / 120);
            ctx.beginPath();
            ctx.arc(cx, cy, currentR, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(93,202,165,${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }

          // Center accent node
          const pulse = 1 + 0.15 * Math.sin(t * 4);
          ctx.beginPath();
          ctx.arc(cx, cy - 50, 8 * pulse, 0, Math.PI * 2);
          ctx.fillStyle = "#5DCAA5";
          ctx.fill();
        }
      } else {
        // Coalition form / dissolve
        const coalition = [nodes[0], nodes[1], nodes[2]];
        const progress = active ? (Math.sin(t * 0.7) + 1) / 2 : 0;

        // Draw all edges dimly
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = "rgba(255,255,255,0.05)";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // Coalition edges (bright)
        if (active) {
          for (let i = 0; i < coalition.length; i++) {
            for (let j = i + 1; j < coalition.length; j++) {
              ctx.beginPath();
              ctx.moveTo(coalition[i].x, coalition[i].y);
              ctx.lineTo(coalition[j].x, coalition[j].y);
              ctx.strokeStyle = `rgba(93,202,165,${progress * 0.5})`;
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          }
        }

        // Draw all nodes
        for (let i = 0; i < nodes.length; i++) {
          const isCoalition = coalition.includes(nodes[i]);
          const pulse = isCoalition && active ? 1 + 0.15 * Math.sin(t * 3 + i) : 1;
          ctx.beginPath();
          ctx.arc(nodes[i].x, nodes[i].y, 5 * pulse, 0, Math.PI * 2);
          ctx.fillStyle = isCoalition && active
            ? `rgba(93,202,165,${0.5 + progress * 0.5})`
            : "rgba(255,255,255,0.4)";
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [type, active]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

export default function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers = stepRefs.current.map((el, i) => {
      if (!el) return null;
      const obs = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) setActiveStep(i);
        },
        { threshold: 0.6 }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  return (
    <section ref={sectionRef} className="max-w-7xl mx-auto px-6 py-section">
      <p className="font-syne text-xs font-600 uppercase tracking-[0.2em] text-[#6b6b78] mb-16">
        02 — How It Works
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Steps */}
        <div className="flex flex-col gap-0">
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              ref={(el) => { stepRefs.current[i] = el; }}
              className={`border-l-2 pl-8 py-10 transition-all duration-500 ${
                activeStep === i ? "border-accent" : "border-[#2a2a30]"
              }`}
            >
              <p
                className={`font-syne text-xs font-600 uppercase tracking-[0.2em] mb-3 transition-colors ${
                  activeStep === i ? "text-accent" : "text-[#6b6b78]"
                }`}
              >
                {step.num}
              </p>
              <h3
                className={`font-syne font-700 text-xl mb-4 transition-colors ${
                  activeStep === i ? "text-text" : "text-text/50"
                }`}
              >
                {step.title}
              </h3>
              <p
                className={`font-syne text-sm leading-relaxed transition-colors ${
                  activeStep === i ? "text-[#9999aa]" : "text-[#9999aa]/40"
                }`}
              >
                {step.body}
              </p>
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div className="lg:sticky lg:top-24 h-[340px] lg:h-auto">
          <div className="w-full h-full border border-[#1a1a1f] bg-[#0d0d0d]">
            <StepCanvas
              type={STEPS[activeStep].animation as "register" | "broadcast" | "dissolve"}
              active
            />
          </div>
        </div>
      </div>
    </section>
  );
}
