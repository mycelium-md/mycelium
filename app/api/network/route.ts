export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { ApiResponse, NetworkGraph, NetworkNode, NetworkEdge } from "@/lib/types";

export async function GET(): Promise<NextResponse> {
  try {
    const [agents, activeCoalitions] = await Promise.all([
      prisma.agent.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.coalition.findMany({
        where: { status: { in: ["FORMING", "ACTIVE"] } },
        include: { agents: true },
      }),
    ]);

    // Map agents to nodes
    const activeAgentIds = new Set<string>();
    for (const c of activeCoalitions) {
      for (const ca of c.agents) activeAgentIds.add(ca.agentId);
    }

    const nodes: NetworkNode[] = agents.map((a) => ({
      id: a.id,
      name: a.name,
      capabilities: JSON.parse(a.capabilities),
      taskCount: a.taskCount,
      activeCoalition:
        activeCoalitions.find((c) => c.agents.some((ca) => ca.agentId === a.id))?.id ?? null,
    }));

    // Build edges from active coalitions (fully connected within coalition)
    const edges: NetworkEdge[] = [];
    for (const coalition of activeCoalitions) {
      const agentIds = coalition.agents.map((ca) => ca.agentId);
      for (let i = 0; i < agentIds.length; i++) {
        for (let j = i + 1; j < agentIds.length; j++) {
          edges.push({
            source: agentIds[i],
            target: agentIds[j],
            coalitionId: coalition.id,
            status: coalition.status as NetworkEdge["status"],
          });
        }
      }
    }

    const graph: NetworkGraph = { nodes, edges };

    return NextResponse.json({ data: graph } satisfies ApiResponse<NetworkGraph>);
  } catch (err) {
    console.log(JSON.stringify({ event: "network.get.error", error: String(err) }));
    return NextResponse.json(
      { error: "Failed to fetch network graph" } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}
