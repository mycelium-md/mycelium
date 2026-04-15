export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { matchAgentsToTask } from "@/lib/capability-matcher";
import { createCoalition } from "@/lib/coalition-manager";
import { runTask } from "@/lib/task-executor";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse, BroadcastTaskRequest, AgentRecord } from "@/lib/types";

function log(event: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...data }));
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = checkRateLimit(`tasks:broadcast:${ip}`, { maxRequests: 5, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded." } satisfies ApiResponse<never>,
      { status: 429 }
    );
  }

  let body: BroadcastTaskRequest;
  try {
    body = (await req.json()) as BroadcastTaskRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" } satisfies ApiResponse<never>,
      { status: 400 }
    );
  }

  const { description } = body;
  if (!description || typeof description !== "string" || description.trim().length < 3) {
    return NextResponse.json(
      { error: "Task description must be at least 3 characters" } satisfies ApiResponse<never>,
      { status: 400 }
    );
  }

  try {
    // Fetch all available agents
    const rawAgents = await prisma.agent.findMany();
    const agents: AgentRecord[] = rawAgents.map((a) => ({
      id: a.id,
      name: a.name,
      capabilities: JSON.parse(a.capabilities),
      createdAt: a.createdAt.toISOString(),
      taskCount: a.taskCount,
    }));

    if (agents.length === 0) {
      return NextResponse.json(
        { error: "No agents registered. Register at least one agent first." } satisfies ApiResponse<never>,
        { status: 422 }
      );
    }

    // Create the task record
    const task = await prisma.task.create({
      data: {
        description: description.trim(),
        requiredCaps: "[]",
        status: "MATCHING",
      },
    });

    log("task.created", { taskId: task.id, description: task.description });

    // Run capability matching
    const { coalition, requiredCapabilities, confidence, reasoning } =
      await matchAgentsToTask(description, agents);

    // Update task with required capabilities
    await prisma.task.update({
      where: { id: task.id },
      data: { requiredCaps: JSON.stringify(requiredCapabilities) },
    });

    if (coalition.length === 0) {
      await prisma.task.update({
        where: { id: task.id },
        data: { status: "FAILED", result: "No agents could be matched to this task." },
      });
      return NextResponse.json(
        { error: "No agents matched the required capabilities." } satisfies ApiResponse<never>,
        { status: 422 }
      );
    }

    // Form coalition
    const coalitionId = await createCoalition(
      task.id,
      coalition.map((a) => a.id)
    );

    // Coalition is linked via Coalition.taskId (one-to-one), no need to update task here

    log("task.coalition_formed", {
      taskId: task.id,
      coalitionId,
      agentCount: coalition.length,
      confidence,
    });

    // Execute task asynchronously (fire and forget, but still track)
    // In production this would go to a queue; for demo we run inline
    runTask(task.id, coalitionId, coalition, requiredCapabilities).catch((err) =>
      log("task.run.unhandled", { taskId: task.id, error: String(err) })
    );

    return NextResponse.json(
      {
        data: {
          taskId: task.id,
          coalitionId,
          requiredCapabilities,
          coalition: coalition.map((a) => ({ id: a.id, name: a.name })),
          confidence,
          reasoning,
          status: "EXECUTING",
        },
      },
      { status: 202 }
    );
  } catch (err) {
    log("task.broadcast.error", { error: String(err) });
    return NextResponse.json(
      { error: "Failed to broadcast task" } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}
