"use client";
import { useEffect, useRef, useState } from "react";
import type { StatsPayload } from "@/lib/types";

interface CountUpProps {
  target: number;
  duration?: number;
}

function CountUp({ target, duration = 1500 }: CountUpProps) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || started.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setValue(Math.floor(eased * target));
            if (t < 1) requestAnimationFrame(animate);
            else setValue(target);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{value.toLocaleString()}</span>;
}

interface Metric {
  label: string;
  value: number;
  suffix?: string;
}

const INITIAL_METRICS: Metric[] = [
  { label: "Agents registered", value: 0 },
  { label: "Coalitions formed today", value: 0 },
  { label: "Tasks completed", value: 0 },
];

export default function MetricsBar() {
  const [metrics, setMetrics] = useState<Metric[]>(INITIAL_METRICS);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/stats");
    esRef.current = es;

    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as StatsPayload;
        setMetrics([
          { label: "Agents registered", value: data.agentsTotal },
          { label: "Coalitions formed today", value: data.coalitionsToday },
          { label: "Tasks completed", value: data.tasksCompleted },
        ]);
      } catch {
        // ignore parse error
      }
    };

    return () => es.close();
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:divide-x md:divide-[#2a2a30]">
        {metrics.map((m, i) => (
          <div key={m.label} className={`px-0 md:px-10 ${i === 0 ? "md:pl-0" : ""} ${i === metrics.length - 1 ? "md:pr-0" : ""} py-4 md:py-0`}>
            <p
              className="font-syne font-800 tracking-tight text-text mb-1"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              <CountUp target={m.value} />
            </p>
            <p className="font-syne text-xs uppercase tracking-[0.15em] text-[#6b6b78]">
              {m.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
