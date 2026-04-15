"use client";
import { useState, useCallback } from "react";
import type { AgentRecord, Capability } from "@/lib/types";
import { ALL_CAPABILITIES } from "@/lib/types";

interface Props {
  agents: AgentRecord[];
  onAgentRegistered: (agent: AgentRecord) => void;
  onAgentRemoved: (id: string) => void;
}

const CAP_LABELS: Record<Capability, string> = {
  web_search: "web_search",
  code_execution: "code_execution",
  text_generation: "text_generation",
  data_analysis: "data_analysis",
  file_operations: "file_operations",
  api_calls: "api_calls",
};

export default function AgentPanel({ agents, onAgentRegistered, onAgentRemoved }: Props) {
  const [name, setName] = useState("");
  const [selectedCaps, setSelectedCaps] = useState<Capability[]>(["text_generation"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCap = (cap: Capability) => {
    setSelectedCaps((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
    );
  };

  const register = useCallback(async () => {
    if (!name.trim() || selectedCaps.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), capabilities: selectedCaps }),
      });
      const json = (await res.json()) as { data?: AgentRecord; error?: string };
      if (!res.ok || !json.data) {
        setError(json.error ?? "Failed to register agent");
        return;
      }
      onAgentRegistered(json.data);
      setName("");
      setSelectedCaps(["text_generation"]);
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [name, selectedCaps, onAgentRegistered]);

  const remove = async (id: string) => {
    try {
      await fetch(`/api/agents/${id}`, { method: "DELETE" });
      onAgentRemoved(id);
    } catch {
      // silently fail — UI will reconcile on next poll
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Registration form */}
      <div>
        <p className="font-syne text-xs font-600 uppercase tracking-widest text-text-muted mb-4">
          Register Agent
        </p>
        <input
          type="text"
          placeholder="Agent name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && register()}
          className="w-full bg-[#111114] border border-[#2a2a30] text-text placeholder-[#6b6b78] font-syne text-sm px-3 py-2.5 outline-none focus:border-accent transition-colors mb-3"
        />
        <div className="flex flex-wrap gap-2 mb-4">
          {ALL_CAPABILITIES.map((cap) => (
            <button
              key={cap}
              onClick={() => toggleCap(cap)}
              className={`font-syne text-xs px-2.5 py-1 border transition-colors ${
                selectedCaps.includes(cap)
                  ? "border-accent text-accent bg-accent/10"
                  : "border-[#2a2a30] text-text-muted hover:border-[#6b6b78]"
              }`}
            >
              {CAP_LABELS[cap]}
            </button>
          ))}
        </div>
        {error && (
          <p className="font-syne text-xs text-red-400 mb-3">{error}</p>
        )}
        <button
          onClick={register}
          disabled={loading || !name.trim() || selectedCaps.length === 0}
          className="w-full font-syne text-xs font-600 uppercase tracking-widest border border-accent text-accent hover:bg-accent hover:text-bg transition-colors py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Registering..." : "Register Agent"}
        </button>
      </div>

      <hr className="border-[#2a2a30]" />

      {/* Agent list */}
      <div>
        <p className="font-syne text-xs font-600 uppercase tracking-widest text-text-muted mb-3">
          Active Agents ({agents.length})
        </p>
        {agents.length === 0 ? (
          <p className="font-syne text-xs text-[#6b6b78]">
            No agents registered. Add one above.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {agents.map((agent) => (
              <div key={agent.id} className="border border-[#1a1a1f] p-3 group">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-syne text-sm font-500 text-text">{agent.name}</p>
                    <p className="font-syne text-xs text-[#6b6b78]">
                      {agent.taskCount} task{agent.taskCount !== 1 ? "s" : ""} completed
                    </p>
                  </div>
                  <button
                    onClick={() => remove(agent.id)}
                    className="font-syne text-xs text-[#6b6b78] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    remove
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {agent.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="font-syne text-[10px] px-1.5 py-0.5 bg-[#1a1a1f] text-[#9999aa]"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
