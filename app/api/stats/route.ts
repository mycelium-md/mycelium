import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { StatsPayload } from "@/lib/types";

async function getStats(): Promise<StatsPayload> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [agentsTotal, coalitionsToday, tasksCompleted, activeCoalitions] = await Promise.all([
    prisma.agent.count(),
    prisma.coalition.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.task.count({ where: { status: "COMPLETED" } }),
    prisma.coalition.count({ where: { status: { in: ["FORMING", "ACTIVE"] } } }),
  ]);

  return { agentsTotal, coalitionsToday, tasksCompleted, activeCoalitions };
}

export async function GET(): Promise<NextResponse> {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        try {
          const stats = await getStats();
          const payload: StatsPayload = stats;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch (err) {
          console.log(JSON.stringify({ event: "stats.sse.error", error: String(err) }));
        }
      };

      // Send immediately
      await send();

      // Then every 5 seconds
      const interval = setInterval(send, 5000);

      // Clean up on close
      const cleanup = () => clearInterval(interval);
      // The controller.close() is called externally when the connection drops
      void cleanup;
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
