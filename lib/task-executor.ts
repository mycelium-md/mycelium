import { prisma } from "./db";
import { executeTask } from "./claude";
import { activateCoalition, dissolveCoalition } from "./coalition-manager";
import type { AgentRecord, Capability } from "./types";

function log(event: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...data }));
}

async function webSearch(query: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return "";

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        max_results: 3,
      }),
    });

    if (!response.ok) return "";

    const data = (await response.json()) as {
      results: Array<{ title: string; content: string; url: string }>;
    };
    return data.results
      .map((r) => `[${r.title}](${r.url})\n${r.content}`)
      .join("\n\n");
  } catch {
    return "";
  }
}

export async function runTask(
  taskId: string,
  coalitionId: string,
  coalition: AgentRecord[],
  requiredCaps: Capability[]
): Promise<void> {
  log("task.executing", { taskId, coalitionId, agentCount: coalition.length });

  try {
    // Mark task executing
    await prisma.task.update({
      where: { id: taskId },
      data: { status: "EXECUTING" },
    });
    await activateCoalition(coalitionId);

    // Gather context if web_search is needed
    let searchResults: string | undefined;
    if (requiredCaps.includes("web_search")) {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (task) {
        searchResults = await webSearch(task.description);
        log("task.search_complete", { taskId, hasResults: !!searchResults });
      }
    }

    // Get task description
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new Error(`Task ${taskId} not found`);

    // Aggregate capabilities from coalition
    const allCaps = new Set<Capability>();
    for (const agent of coalition) {
      for (const cap of agent.capabilities) allCaps.add(cap);
    }

    // Execute via Claude
    const result = await executeTask(task.description, [...allCaps], searchResults);

    // Persist result
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "COMPLETED",
        result,
        completedAt: new Date(),
      },
    });

    // Increment task counts for participating agents
    await prisma.agent.updateMany({
      where: { id: { in: coalition.map((a) => a.id) } },
      data: { taskCount: { increment: 1 } },
    });

    await dissolveCoalition(coalitionId);
    log("task.completed", { taskId, coalitionId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("task.failed", { taskId, coalitionId, error: message });

    await prisma.task.update({
      where: { id: taskId },
      data: { status: "FAILED", result: `Execution failed: ${message}` },
    });

    await dissolveCoalition(coalitionId);
  }
}
