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
      <div className="border-b border-[#1a1a1f] px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-6">
          <h1 className="font-syne font-600 text-sm text-text">Network</h1>
          <span className="font-syne text-xs text-[#6b6b78]">
            {data.nodes.length} nodes
          </span>
          <span className="font-syne text-xs text-[#6b6b78]">
            {data.edges.length} active edges
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="font-syne text-[10px] text-[#6b6b78] uppercase tracking-wider">
            Live
          </span>
        </div>
      </div>

      {/* Graph area */}
      <div className="flex-1 relative">
        <NetworkGraph data={data} onNodeClick={setSelected} className="w-full h-full" />

        {/* Legend */}
        <div className="absolute bottom-6 left-6 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white opacity-70" />
            <span className="font-syne text-[10px] text-[#6b6b78]">Idle agent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span className="font-syne text-[10px] text-[#6b6b78]">Active in coalition</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-px bg-accent/40" />
            <span className="font-syne text-[10px] text-[#6b6b78]">Coalition edge</span>
          </div>
        </div>

        {/* Selected node panel */}
        {selected && (
          <div className="absolute top-6 right-6 bg-bg border border-[#2a2a30] p-5 w-72">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-syne font-600 text-sm text-text">{selected.name}</p>
                <p className="font-syne text-xs text-[#6b6b78] mt-0.5">
                  {selected.taskCount} task{selected.taskCount !== 1 ? "s" : ""} completed
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="font-syne text-xs text-[#6b6b78] hover:text-text"
              >
                close
              </button>
            </div>

            <div className="mb-4">
              <p className="font-syne text-[10px] uppercase tracking-wider text-[#6b6b78] mb-2">
                Capabilities
              </p>
              <div className="flex flex-wrap gap-1">
                {selected.capabilities.map((cap) => (
                  <span key={cap} className="font-syne text-[10px] px-1.5 py-0.5 bg-[#1a1a1f] text-[#9999aa]">
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="font-syne text-[10px] uppercase tracking-wider text-[#6b6b78] mb-2">
                Status
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    selected.activeCoalition ? "bg-accent animate-pulse" : "bg-[#3a3a40]"
                  }`}
                />
                <span className="font-syne text-xs text-[#9999aa]">
                  {selected.activeCoalition ? "Active in coalition" : "Idle"}
                </span>
              </div>
            </div>
          </div>
        )}

        {data.nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="font-syne text-sm text-[#6b6b78] mb-2">
                No agents in the network.
              </p>
              <p className="font-syne text-xs text-[#3a3a40]">
                Open the playground to register agents.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
