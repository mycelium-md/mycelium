"use client";
import Link from "next/link";
import dynamic from "next/dynamic";

const AgentMesh = dynamic(() => import("@/components/canvas/AgentMesh"), { ssr: false });

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-14 overflow-hidden">
      {/* Background canvas — fullscreen on mobile (lower opacity), right 60% on desktop */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Mobile: full canvas, lower opacity */}
        <div className="absolute inset-0 opacity-20 md:hidden">
          <AgentMesh animated />
        </div>
        {/* Desktop: right 60% */}
        <div className="absolute right-0 top-0 w-[60%] h-full opacity-60 hidden md:block">
          <AgentMesh animated />
        </div>
        {/* Fade overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/90 to-transparent md:via-bg/80" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 w-full">
        <div className="max-w-[640px]">
          {/* Pre-label */}
          <p className="font-syne text-xs font-600 uppercase tracking-[0.2em] text-accent mb-6 md:mb-8">
            Decentralized Agent Substrate — v0.1 Alpha
          </p>

          {/* Main headline */}
          <h1
            className="font-syne font-800 leading-[0.93] tracking-[-0.03em] text-text mb-6 md:mb-8"
            style={{ fontSize: "clamp(2.8rem, 8vw, 5.5rem)" }}
          >
            The substrate<br />AI agents<br />run on.
          </h1>

          {/* Subhead */}
          <p
            className="font-serif italic text-[#f0eeff]/80 mb-10 md:mb-12"
            style={{ fontSize: "clamp(1rem, 2.5vw, 1.5rem)" }}
          >
            No orchestrator. No conductor.<br />No single point of failure.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              href="/docs"
              className="font-syne text-sm font-600 uppercase tracking-[0.15em] border border-text text-text px-8 py-3 hover:bg-text hover:text-bg transition-colors duration-200 text-center min-h-[44px] flex items-center justify-center"
            >
              Read the docs
            </Link>
            <Link
              href="/playground"
              className="font-syne text-sm font-600 uppercase tracking-[0.15em] border border-accent text-accent px-8 py-3 hover:bg-accent hover:text-bg transition-colors duration-200 text-center min-h-[44px] flex items-center justify-center"
            >
              Launch playground
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 md:bottom-12 left-4 md:left-6 flex items-center gap-3">
        <div className="w-px h-8 bg-[#2a1a4a]" />
        <span className="font-syne text-[10px] uppercase tracking-[0.2em] text-[#8866aa]">
          Scroll
        </span>
      </div>
    </section>
  );
}
