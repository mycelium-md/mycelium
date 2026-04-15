"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import AgentPanel from "@/components/playground/AgentPanel";
import TaskBroadcast, { type BroadcastResult } from "@/components/playground/TaskBroadcast";
import CoalitionFeed from "@/components/playground/CoalitionFeed";
import type { AgentRecord, CoalitionRecord, NetworkGraph } from "@/lib/types";

const NetworkGraph = dynamic(() => import("@/components/canvas/NetworkGraph"), { ssr: false });

export default function PlaygroundPage() {
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [coalitions, setCoalitions] = useState<CoalitionRecord[]>([]);
  const [network, setNetwork] = useState<NetworkGraph>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [agentsRes, coalitionsRes, networkRes] = await Promise.all([
        fetch("/api/agents"),
        fetch("/api/coalitions"),
        fetch("/api/network"),
      ]);
      const [agentsJson, coalitionsJson, networkJson] = await Promise.all([
        agentsRes.json() as Promise<{ data?: AgentRecord[] }>,
        coalitionsRes.json() as Promise<{ data?: { coalitions: CoalitionRecord[] } }>,
        networkRes.json() as Promise<{ data?: NetworkGraph }>,
      ]);
      if (agentsJson.data) setAgents(agentsJson.data);
      if (coalitionsJson.data) setCoalitions(coalitionsJson.data.coalitions);
      if (networkJson.data) setNetwork(networkJson.data);
    } catch {
      // silently retry
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
    pollRef.current = setInterval(fetchData, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchData]);

  const handleAgentRegistered = (agent: AgentRecord) => {
    setAgents((prev) => [agent, ...prev]);
    void fetchData();
  };

  const handleAgentRemoved = (id: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== id));
    void fetchData();
  };

  const handleTaskBroadcast = (_result: BroadcastResult) => {
    void fetchData();
  };

  return (
    <div className="pt-14 min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="border-b border-[#1a1a3a] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-syne font-700 text-base text-text">Playground</h1>
          <p className="font-syne text-xs text-[#8866aa]">
            Live agent mesh — register agents, broadcast tasks, watch coalitions form
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="font-syne text-xs text-[#8866aa]">
              {agents.length} agent{agents.length !== 1 ? "s" : ""} online
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left panel */}
        <div className="lg:w-80 xl:w-96 border-r border-[#1a1a3a] overflow-y-auto flex-shrink-0">
          <div className="p-5 flex flex-col gap-8">
            <AgentPanel
              agents={agents}
              onAgentRegistered={handleAgentRegistered}
              onAgentRemoved={handleAgentRemoved}
            />
            <hr className="border-[#1a1a3a]" />
            <TaskBroadcast onTaskBroadcast={handleTaskBroadcast} />
            <hr className="border-[#1a1a3a]" />
            <CoalitionFeed coalitions={coalitions} />
          </div>
        </div>

        {/* Network graph */}
        <div className="flex-1 relative min-h-[400px]">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="font-syne text-xs text-[#8866aa]">Connecting to mesh...</p>
            </div>
          ) : agents.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="font-syne text-sm text-[#8866aa] mb-2">
                  No agents in the network.
                </p>
                <p className="font-syne text-xs text-[#3a2a5a]">
                  Register an agent on the left to begin.
                </p>
              </div>
            </div>
          ) : (
            <NetworkGraph data={network} className="w-full h-full" />
          )}
        </div>
      </div>
    </div>
  );
}
