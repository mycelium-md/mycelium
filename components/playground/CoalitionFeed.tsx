"use client";
import type { CoalitionRecord } from "@/lib/types";

interface Props {
  coalitions: CoalitionRecord[];
}

const STATUS_COLOR: Record<string, string> = {
  FORMING: "text-yellow-400 bg-yellow-400/10",
  ACTIVE: "text-accent bg-accent/10",
  DISSOLVED: "text-[#6b6b78] bg-[#1a1a1f]",
};

function timeAgo(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime();
  if (delta < 60_000) return `${Math.floor(delta / 1000)}s ago`;
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)}m ago`;
  return `${Math.floor(delta / 3_600_000)}h ago`;
}

export default function CoalitionFeed({ coalitions }: Props) {
  if (coalitions.length === 0) {
    return (
      <div>
        <p className="font-syne text-xs font-600 uppercase tracking-widest text-text-muted mb-3">
          Coalition Feed
        </p>
        <p className="font-syne text-xs text-[#6b6b78]">
          No coalitions yet. Broadcast a task to form one.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="font-syne text-xs font-600 uppercase tracking-widest text-text-muted mb-3">
        Coalition Feed
      </p>
      <div className="flex flex-col gap-2">
        {coalitions.slice(0, 10).map((c) => (
          <div key={c.id} className="border border-[#1a1a1f] p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="font-syne text-xs text-text truncate flex-1">
                {c.task.description}
              </p>
              <span
                className={`font-syne text-[10px] px-1.5 py-0.5 flex-shrink-0 ${STATUS_COLOR[c.status] ?? ""}`}
              >
                {c.status}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <p className="font-syne text-[10px] text-[#6b6b78]">
                {c.agents.length} agent{c.agents.length !== 1 ? "s" : ""}
              </p>
              <span className="text-[#2a2a30]">·</span>
              <p className="font-syne text-[10px] text-[#6b6b78]">
                {timeAgo(c.createdAt)}
              </p>
              {c.dissolvedAt && (
                <>
                  <span className="text-[#2a2a30]">·</span>
                  <p className="font-syne text-[10px] text-[#6b6b78]">
                    {Math.round((new Date(c.dissolvedAt).getTime() - new Date(c.createdAt).getTime()) / 1000)}s
                  </p>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
