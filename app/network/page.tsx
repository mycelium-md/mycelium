"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import type { NetworkGraph as NetworkGraphData, NetworkNode } from "@/lib/types";

const NetworkGraph = dynamic(() => import("@/components/canvas/NetworkGraph"), { ssr: false });

export default function NetworkPage() {
  const [data, setData] = useState<NetworkGraphData>({ nodes: [], edges: [] });
  const [selected, setSelected] = useState<NetworkNode | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNetwork = useCallback(async () => {
    try {
      const res = await fetch("/api/network");
      const json = (await res.json()) as { data?: NetworkGraphData };
      if (json.data) setData(json.data);
    } catch {
      // retry on next poll
    }
  }, []);

  useEffect(() => {
    void fetchNetwork();
    // Poll every 2s
    pollRef.current = setInterval(fetchNetwork, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (esRef.current) esRef.current.close();
    };
  }, [fetchNetwork]);

  return (
    <div className="pt-14 h-screen flex flex-col">
      {/* Top bar */}
      <div className="border-b border-[#1a1a3a] px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 md:gap-6">
          <h1 className="font-syne font-600 text-sm text-text">Network</h1>
          <span className="font-syne text-xs text-[#8866aa]">
            {data.nodes.length} nodes
          </span>
          <span className="font-syne text-xs text-[#8866aa] hidden sm:inline">
            {data.edges.length} active edges
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="font-syne text-[10px] text-[#8866aa] uppercase tracking-wider">
            Live
          </span>
        </div>
      </div>

      {/* Graph area */}
      <div className="flex-1 relative overflow-hidden">
        <NetworkGraph data={data} onNodeClick={setSelected} className="w-full h-full" />

        {/* Legend — compact on mobile */}
        <div className="absolute bottom-4 md:bottom-6 left-4 md:left-6 flex items-center gap-3 md:gap-6">
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="w-2 h-2 rounded-full bg-white opacity-70 flex-shrink-0" />
            <span className="font-syne text-[9px] md:text-[10px] text-[#8866aa]">Idle</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
            <span className="font-syne text-[9px] md:text-[10px] text-[#8866aa]">Active</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="w-4 h-px bg-accent/40 flex-shrink-0" />
            <span className="font-syne text-[9px] md:text-[10px] text-[#8866aa]">Edge</span>
          </div>
        </div>

        {/* Selected node panel — desktop: top-right fixed panel, mobile: bottom sheet */}
        {selected && (
          <>
            {/* Desktop panel */}
            <div className="hidden md:block absolute top-6 right-6 bg-bg border border-[#2a1a4a] p-5 w-72">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-syne font-600 text-sm text-text">{selected.name}</p>
                  <p className="font-syne text-xs text-[#8866aa] mt-0.5">
                    {selected.taskCount} task{selected.taskCount !== 1 ? "s" : ""} completed
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="font-syne text-xs text-[#8866aa] hover:text-text min-h-[44px] px-2"
                >
                  close
                </button>
              </div>

              <div className="mb-4">
                <p className="font-syne text-[10px] uppercase tracking-wider text-[#8866aa] mb-2">
                  Capabilities
                </p>
                <div className="flex flex-wrap gap-1">
                  {selected.capabilities.map((cap) => (
                    <span key={cap} className="font-syne text-[10px] px-1.5 py-0.5 bg-[#1a1a3a] text-[#9988bb]">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-syne text-[10px] uppercase tracking-wider text-[#8866aa] mb-2">
                  Status
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      selected.activeCoalition ? "bg-accent animate-pulse" : "bg-[#3a2a5a]"
                    }`}
                  />
                  <span className="font-syne text-xs text-[#9988bb]">
                    {selected.activeCoalition ? "Active in coalition" : "Idle"}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile bottom sheet */}
            <div className="md:hidden absolute bottom-0 left-0 right-0 bg-bg border-t border-[#2a1a4a] p-4 z-20">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-syne font-600 text-sm text-text">{selected.name}</p>
                  <p className="font-syne text-xs text-[#8866aa] mt-0.5">
                    {selected.taskCount} task{selected.taskCount !== 1 ? "s" : ""} completed
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="font-syne text-xs text-[#8866aa] hover:text-text min-h-[44px] px-2 flex items-center"
                >
                  ×
                </button>
              </div>

              <div className="flex gap-6">
                <div className="flex-1">
                  <p className="font-syne text-[10px] uppercase tracking-wider text-[#8866aa] mb-2">
                    Capabilities
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selected.capabilities.map((cap) => (
                      <span key={cap} className="font-syne text-[10px] px-1.5 py-0.5 bg-[#1a1a3a] text-[#9988bb]">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-syne text-[10px] uppercase tracking-wider text-[#8866aa] mb-2">
                    Status
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        selected.activeCoalition ? "bg-accent animate-pulse" : "bg-[#3a2a5a]"
                      }`}
                    />
                    <span className="font-syne text-xs text-[#9988bb]">
                      {selected.activeCoalition ? "Active" : "Idle"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {data.nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center px-4">
              <p className="font-syne text-sm text-[#8866aa] mb-2">
                No agents in the network.
              </p>
              <p className="font-syne text-xs text-[#3a2a5a]">
                Open the playground to register agents.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
