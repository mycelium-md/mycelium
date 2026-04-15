"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import AgentPanel from "@/components/playground/AgentPanel";
import TaskBroadcast, { type BroadcastResult } from "@/components/playground/TaskBroadcast";
import CoalitionFeed from "@/components/playground/CoalitionFeed";
import type { AgentRecord, CoalitionRecord, NetworkGraph } from "@/lib/types";

const NetworkGraph = dynamic(() => import("@/components/canvas/NetworkGraph"), { ssr: false });

type MobileTab = "agents" | "tasks" | "feed" | "graph";

export default function PlaygroundPage() {
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [coalitions, setCoalitions] = useState<CoalitionRecord[]>([]);
  const [network, setNetwork] = useState<NetworkGraph>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>("agents");
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

  const TABS: { key: MobileTab; label: string }[] = [
    { key: "agents", label: "Agents" },
    { key: "tasks", label: "Tasks" },
    { key: "feed", label: "Feed" },
    { key: "graph", label: "Graph" },
  ];

  return (
    <div className="pt-14 min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="border-b border-[#1a1a3a] px-4 md:px-6 py-3 md:py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="font-syne font-700 text-base text-text">Playground</h1>
          <p className="font-syne text-xs text-[#8866aa] hidden sm:block">
            Live agent mesh — register agents, broadcast tasks, watch coalitions form
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="font-syne text-xs text-[#8866aa]">
            {agents.length} agent{agents.length !== 1 ? "s" : ""} online
          </span>
        </div>
      </div>

      {/* Mobile tab bar */}
      <div className="lg:hidden border-b border-[#1a1a3a] flex flex-shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMobileTab(tab.key)}
            className={`flex-1 font-syne text-xs py-3 transition-colors min-h-[44px] ${
              mobileTab === tab.key
                ? "text-accent border-b-2 border-accent"
                : "text-[#8866aa] hover:text-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left panel — visible on desktop always, on mobile based on active tab */}
        <div
          className={`
            lg:w-80 xl:w-96 lg:border-r border-[#1a1a3a] overflow-y-auto flex-shrink-0
            ${mobileTab === "graph" ? "hidden lg:block" : ""}
            lg:block
          `}
        >
          <div className="p-4 md:p-5 flex flex-col gap-8">
            {/* Agents panel — mobile: only when agents tab, desktop: always */}
            <div className={mobileTab !== "agents" ? "hidden lg:block" : ""}>
              <AgentPanel
                agents={agents}
                onAgentRegistered={handleAgentRegistered}
                onAgentRemoved={handleAgentRemoved}
              />
            </div>

            {/* Divider - desktop only */}
            <hr className="border-[#1a1a3a] hidden lg:block" />

            {/* Tasks panel — mobile: only when tasks tab, desktop: always */}
            <div className={mobileTab !== "tasks" ? "hidden lg:block" : ""}>
              <TaskBroadcast onTaskBroadcast={handleTaskBroadcast} />
            </div>

            {/* Divider - desktop only */}
            <hr className="border-[#1a1a3a] hidden lg:block" />

            {/* Coalition feed — mobile: only when feed tab, desktop: always */}
            <div className={mobileTab !== "feed" ? "hidden lg:block" : ""}>
              <CoalitionFeed coalitions={coalitions} />
            </div>
          </div>
        </div>

        {/* Network graph — desktop: always, mobile: only graph tab */}
        <div
          className={`
            flex-1 relative min-h-[400px]
            ${mobileTab !== "graph" ? "hidden lg:block" : ""}
          `}
        >
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="font-syne text-xs text-[#8866aa]">Connecting to mesh...</p>
            </div>
          ) : agents.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-4">
                <p className="font-syne text-sm text-[#8866aa] mb-2">
                  No agents in the network.
                </p>
                <p className="font-syne text-xs text-[#3a2a5a]">
                  Register an agent to begin.
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
