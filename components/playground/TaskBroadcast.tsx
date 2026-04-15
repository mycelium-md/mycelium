"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import type { Capability } from "@/lib/types";

export interface BroadcastResult {
  taskId: string;
  coalitionId: string;
  requiredCapabilities: Capability[];
  coalition: Array<{ id: string; name: string }>;
  confidence: number;
  reasoning: string;
  status: string;
}

interface TaskState {
  phase: "idle" | "analyzing" | "matching" | "executing" | "completed" | "failed";
  result: BroadcastResult | null;
  taskResult: string | null;
  error: string | null;
}

interface Props {
  onTaskBroadcast: (result: BroadcastResult) => void;
}

const PHASES = [
  { key: "analyzing", label: "Analyzing task capabilities..." },
  { key: "matching", label: "Matching agents to requirements..." },
  { key: "executing", label: "Coalition executing task..." },
];

export default function TaskBroadcast({ onTaskBroadcast }: Props) {
  const [description, setDescription] = useState("");
  const [state, setState] = useState<TaskState>({
    phase: "idle",
    result: null,
    taskResult: null,
    error: null,
  });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => () => clearPoll(), []);

  const pollTaskResult = useCallback((taskId: string) => {
    let attempts = 0;
    const MAX = 60; // 60 * 2s = 2 minutes max

    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/tasks/${taskId}`);
        const json = (await res.json()) as { data?: { status: string; result: string | null } };
        const task = json.data;
        if (!task) return;

        if (task.status === "COMPLETED") {
          clearPoll();
          setState((prev) => ({
            ...prev,
            phase: "completed",
            taskResult: task.result,
          }));
        } else if (task.status === "FAILED") {
          clearPoll();
          setState((prev) => ({
            ...prev,
            phase: "failed",
            error: task.result ?? "Task failed with no output.",
          }));
        } else if (attempts >= MAX) {
          clearPoll();
          setState((prev) => ({ ...prev, phase: "failed", error: "Task timed out." }));
        }
      } catch {
        // silently retry
      }
    }, 2000);
  }, []);

  const broadcast = useCallback(async () => {
    if (!description.trim()) return;
    clearPoll();

    setState({ phase: "analyzing", result: null, taskResult: null, error: null });

    // Small delay to show analyzing phase
    await new Promise((r) => setTimeout(r, 800));
    setState((prev) => ({ ...prev, phase: "matching" }));

    try {
      const res = await fetch("/api/tasks/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      });
      const json = (await res.json()) as { data?: BroadcastResult; error?: string };

      if (!res.ok || !json.data) {
        setState({
          phase: "failed",
          result: null,
          taskResult: null,
          error: json.error ?? "Failed to broadcast task",
        });
        return;
      }

      setState((prev) => ({
        ...prev,
        phase: "executing",
        result: json.data ?? null,
      }));
      onTaskBroadcast(json.data);
      pollTaskResult(json.data.taskId);
    } catch {
      setState({ phase: "failed", result: null, taskResult: null, error: "Network error." });
    }
  }, [description, onTaskBroadcast, pollTaskResult]);

  const reset = () => {
    clearPoll();
    setState({ phase: "idle", result: null, taskResult: null, error: null });
    setDescription("");
  };

  const { phase, result, taskResult, error } = state;
  const isIdle = phase === "idle";

  return (
    <div className="flex flex-col gap-4">
      <p className="font-syne text-xs font-600 uppercase tracking-widest text-text-muted">
        Broadcast Task
      </p>

      {isIdle ? (
        <>
          <textarea
            rows={3}
            placeholder="Describe a task for the agent mesh..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#0d0d2b] border border-[#2a1a4a] text-text placeholder-[#8866aa] font-syne text-sm px-3 py-2.5 outline-none focus:border-accent transition-colors resize-none"
          />
          <button
            onClick={broadcast}
            disabled={!description.trim()}
            className="w-full font-syne text-xs font-600 uppercase tracking-widest border border-[#f0eeff] text-text hover:bg-[#f0eeff] hover:text-bg transition-colors py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Broadcast
          </button>
        </>
      ) : (
        <div className="border border-[#2a1a4a] p-4 flex flex-col gap-4">
          {/* Phase indicator */}
          <div className="flex flex-col gap-1.5">
            {PHASES.map((p) => {
              const phaseOrder = ["analyzing", "matching", "executing", "completed", "failed"];
              const current = phaseOrder.indexOf(phase);
              const pOrder = phaseOrder.indexOf(p.key);
              const isDone = current > pOrder;
              const isActive = current === pOrder;
              return (
                <div key={p.key} className="flex items-center gap-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      isDone
                        ? "bg-accent"
                        : isActive
                        ? "bg-accent animate-pulse"
                        : "bg-[#2a1a4a]"
                    }`}
                  />
                  <span
                    className={`font-syne text-xs ${
                      isActive ? "text-text" : isDone ? "text-accent" : "text-[#8866aa]"
                    }`}
                  >
                    {p.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Match result */}
          {result && (
            <div className="flex flex-col gap-2">
              <div>
                <p className="font-syne text-[10px] uppercase tracking-widest text-[#8866aa] mb-1">
                  Required
                </p>
                <div className="flex flex-wrap gap-1">
                  {result.requiredCapabilities.map((c) => (
                    <span key={c} className="font-syne text-[10px] px-1.5 py-0.5 bg-accent/20 text-accent">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-syne text-[10px] uppercase tracking-widest text-[#8866aa] mb-1">
                  Coalition ({result.coalition.length} agent{result.coalition.length !== 1 ? "s" : ""})
                </p>
                <div className="flex flex-wrap gap-1">
                  {result.coalition.map((a) => (
                    <span key={a.id} className="font-syne text-[10px] px-1.5 py-0.5 border border-[#2a1a4a] text-text">
                      {a.name}
                    </span>
                  ))}
                </div>
              </div>
              <p className="font-syne text-[10px] text-[#8866aa]">
                Confidence: <span className="text-accent">{Math.round(result.confidence * 100)}%</span>
              </p>
            </div>
          )}

          {/* Task result */}
          {phase === "completed" && taskResult && (
            <div className="border-t border-[#2a1a4a] pt-3">
              <p className="font-syne text-[10px] uppercase tracking-widest text-accent mb-2">
                Result
              </p>
              <pre className="font-mono text-xs text-text whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {taskResult}
              </pre>
            </div>
          )}

          {/* Error */}
          {(phase === "failed" || error) && error && (
            <div className="border-t border-[#2a1a4a] pt-3">
              <p className="font-syne text-xs text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={reset}
            className="font-syne text-xs text-[#8866aa] hover:text-text transition-colors text-left"
          >
            New task
          </button>
        </div>
      )}
    </div>
  );
}
