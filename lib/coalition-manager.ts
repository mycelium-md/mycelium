import { prisma } from "./db";
import type { AgentRecord, CoalitionRecord } from "./types";

function log(event: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...data }));
}

function parseAgent(raw: {
  id: string;
  name: string;
  capabilities: string;
  createdAt: Date;
  taskCount: number;
}): AgentRecord {
  return {
    id: raw.id,
    name: raw.name,
    capabilities: JSON.parse(raw.capabilities),
    createdAt: raw.createdAt.toISOString(),
    taskCount: raw.taskCount,
  };
}

export async function createCoalition(
  taskId: string,
  agentIds: string[]
): Promise<string> {
  const coalition = await prisma.coalition.create({
    data: {
      taskId,
      status: "FORMING",
      agents: {
        create: agentIds.map((agentId) => ({ agentId })),
      },
    },
  });

  log("coalition.created", { coalitionId: coalition.id, taskId, agentCount: agentIds.length });
  return coalition.id;
}

export async function activateCoalition(coalitionId: string): Promise<void> {
  await prisma.coalition.update({
    where: { id: coalitionId },
    data: { status: "ACTIVE" },
  });
  log("coalition.activated", { coalitionId });
}

export async function dissolveCoalition(coalitionId: string): Promise<void> {
  await prisma.coalition.update({
    where: { id: coalitionId },
    data: { status: "DISSOLVED", dissolvedAt: new Date() },
  });
  log("coalition.dissolved", { coalitionId });
}

export async function getCoalition(coalitionId: string): Promise<CoalitionRecord | null> {
  const raw = await prisma.coalition.findUnique({
    where: { id: coalitionId },
    include: {
      agents: { include: { agent: true } },
      task: true,
    },
  });

  if (!raw) return null;

  return {
    id: raw.id,
    taskId: raw.taskId,
    status: raw.status as CoalitionRecord["status"],
    createdAt: raw.createdAt.toISOString(),
    dissolvedAt: raw.dissolvedAt?.toISOString() ?? null,
    agents: raw.agents.map((ca) => parseAgent(ca.agent)),
    task: {
      id: raw.task.id,
      description: raw.task.description,
      requiredCaps: JSON.parse(raw.task.requiredCaps),
      status: raw.task.status as CoalitionRecord["task"]["status"],
      result: raw.task.result,
      createdAt: raw.task.createdAt.toISOString(),
      completedAt: raw.task.completedAt?.toISOString() ?? null,
      coalitionId: raw.id,
    },
  };
}

export async function listCoalitions(
  page = 1,
  limit = 20
): Promise<{ coalitions: CoalitionRecord[]; total: number }> {
  const skip = (page - 1) * limit;

  const [raws, total] = await Promise.all([
    prisma.coalition.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        agents: { include: { agent: true } },
        task: true,
      },
    }),
    prisma.coalition.count(),
  ]);

  return {
    total,
    coalitions: raws.map((raw) => ({
      id: raw.id,
      taskId: raw.taskId,
      status: raw.status as CoalitionRecord["status"],
      createdAt: raw.createdAt.toISOString(),
      dissolvedAt: raw.dissolvedAt?.toISOString() ?? null,
      agents: raw.agents.map((ca) => parseAgent(ca.agent)),
      task: {
        id: raw.task.id,
        description: raw.task.description,
        requiredCaps: JSON.parse(raw.task.requiredCaps),
        status: raw.task.status as CoalitionRecord["task"]["status"],
        result: raw.task.result,
        createdAt: raw.task.createdAt.toISOString(),
        completedAt: raw.task.completedAt?.toISOString() ?? null,
        coalitionId: raw.id,
      },
    })),
  };
}
