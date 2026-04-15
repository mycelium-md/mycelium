"use client";
import { useEffect, useRef, useState } from "react";

const STEPS = [
  {
    num: "01",
    title: "Agents register their capabilities.",
    body: "Each agent publishes a capability manifest to the mesh. No central registry. The manifest is a JSON-LD document describing what the agent can do, what protocols it speaks, and how to reach it. Any node in the network can read it.",
  },
  {
    num: "02",
    title: "A task broadcasts to the network.",
    body: "A task description enters the mesh as a broadcast message. No routing table. No orchestrator decides who handles it. Every agent that can process the message evaluates its own capabilities against the task requirements.",
  },
  {
    num: "03",
    title: "A coalition forms. The task is done. It disbands.",
    body: "Agents that can collectively satisfy the task requirements form a temporary coalition using the Contract Net Protocol. They coordinate directly, execute the task, and dissolve. The mesh returns to its resting state. Nothing persists that doesn't need to.",
  },
];

export default function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
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
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-section">
      <p className="font-syne text-xs font-600 uppercase tracking-[0.2em] text-[#8866aa] mb-10 md:mb-16">
        02 — How It Works
      </p>

      <div className="max-w-2xl flex flex-col gap-0">
        {STEPS.map((step, i) => (
          <div
            key={step.num}
            ref={(el) => { stepRefs.current[i] = el; }}
            className={`border-l-2 pl-6 md:pl-8 py-8 md:py-10 transition-all duration-500 ${
              activeStep === i ? "border-accent" : "border-[#2a1a4a]"
            }`}
          >
            <p
              className={`font-syne text-xs font-600 uppercase tracking-[0.2em] mb-3 transition-colors ${
                activeStep === i ? "text-accent" : "text-[#8866aa]"
              }`}
            >
              {step.num}
            </p>
            <h3
              className={`font-syne font-700 text-lg md:text-xl mb-3 md:mb-4 transition-colors ${
                activeStep === i ? "text-text" : "text-text/50"
              }`}
            >
              {step.title}
            </h3>
            <p
              className={`font-syne text-sm leading-relaxed transition-colors ${
                activeStep === i ? "text-[#9988bb]" : "text-[#9988bb]/40"
              }`}
            >
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
