"use client";
import Link from "next/link";
import dynamic from "next/dynamic";

const AgentMesh = dynamic(() => import("@/components/canvas/AgentMesh"), { ssr: false });

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-14 overflow-hidden">
      {/* Background canvas — right 60% */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute right-0 top-0 w-[60%] h-full opacity-60">
          <AgentMesh animated />
        </div>
        {/* Fade overlay on left */}
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/80 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="max-w-[640px]">
          {/* Pre-label */}
          <p className="font-syne text-xs font-600 uppercase tracking-[0.2em] text-accent mb-8">
            Decentralized Agent Substrate — v0.1 Alpha
          </p>

          {/* Main headline */}
          <h1
            className="font-syne font-800 leading-[0.93] tracking-[-0.03em] text-text mb-8"
            style={{ fontSize: "clamp(3.5rem, 8vw, 5.5rem)" }}
          >
            The substrate<br />AI agents<br />run on.
          </h1>

          {/* Subhead */}
          <p
            className="font-serif italic text-[#f5f5f0]/80 mb-12"
            style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)" }}
          >
            No orchestrator. No conductor.<br />No single point of failure.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <Link
              href="/docs"
              className="font-syne text-sm font-600 uppercase tracking-[0.15em] border border-text text-text px-8 py-3 hover:bg-text hover:text-bg transition-colors duration-200"
            >
              Read the docs
            </Link>
            <Link
              href="/playground"
              className="font-syne text-sm font-600 uppercase tracking-[0.15em] border border-accent text-accent px-8 py-3 hover:bg-accent hover:text-bg transition-colors duration-200"
            >
              Launch playground
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-12 left-6 flex items-center gap-3">
        <div className="w-px h-8 bg-[#2a2a30]" />
        <span className="font-syne text-[10px] uppercase tracking-[0.2em] text-[#6b6b78]">
          Scroll
        </span>
      </div>
    </section>
  );
}
