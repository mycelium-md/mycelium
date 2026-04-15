export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import type { RegisterAgentRequest, AgentRecord, ApiResponse } from "@/lib/types";
import { ALL_CAPABILITIES } from "@/lib/types";

function log(event: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...data }));
}

export async function GET(): Promise<NextResponse> {
  try {
    const agents = await prisma.agent.findMany({
      orderBy: { createdAt: "desc" },
    });

    const result: AgentRecord[] = agents.map((a) => ({
      id: a.id,
      name: a.name,
      capabilities: JSON.parse(a.capabilities),
      createdAt: a.createdAt.toISOString(),
      taskCount: a.taskCount,
    }));

    return NextResponse.json({ data: result } satisfies ApiResponse<AgentRecord[]>);
  } catch (err) {
    log("agents.list.error", { error: String(err) });
    return NextResponse.json(
      { error: "Failed to fetch agents" } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = checkRateLimit(`agents:register:${ip}`, { maxRequests: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in a moment." } satisfies ApiResponse<never>,
      { status: 429 }
    );
  }

  let body: RegisterAgentRequest;
  try {
    body = (await req.json()) as RegisterAgentRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" } satisfies ApiResponse<never>,
      { status: 400 }
    );
  }

  const { name, capabilities } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Agent name is required" } satisfies ApiResponse<never>,
      { status: 400 }
    );
  }

  if (!Array.isArray(capabilities) || capabilities.length === 0) {
    return NextResponse.json(
      { error: "At least one capability is required" } satisfies ApiResponse<never>,
      { status: 400 }
    );
  }

  const invalid = capabilities.filter((c) => !ALL_CAPABILITIES.includes(c));
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `Invalid capabilities: ${invalid.join(", ")}` } satisfies ApiResponse<never>,
      { status: 400 }
    );
  }

  try {
    const agent = await prisma.agent.create({
      data: {
        name: name.trim(),
        capabilities: JSON.stringify(capabilities),
      },
    });

    const result: AgentRecord = {
      id: agent.id,
      name: agent.name,
      capabilities: JSON.parse(agent.capabilities),
      createdAt: agent.createdAt.toISOString(),
      taskCount: 0,
    };

    log("agent.registered", { agentId: agent.id, name: agent.name, capabilities });

    return NextResponse.json({ data: result } satisfies ApiResponse<AgentRecord>, {
      status: 201,
    });
  } catch (err) {
    log("agent.register.error", { error: String(err) });
    return NextResponse.json(
      { error: "Failed to register agent" } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}
