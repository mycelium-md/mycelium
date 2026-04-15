export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { ApiResponse, TaskRecord } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { id } = params;

  try {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json(
        { error: "Task not found" } satisfies ApiResponse<never>,
        { status: 404 }
      );
    }

    // Get coalition ID
    const coalition = await prisma.coalition.findUnique({ where: { taskId: id } });

    const result: TaskRecord = {
      id: task.id,
      description: task.description,
      requiredCaps: JSON.parse(task.requiredCaps),
      status: task.status as TaskRecord["status"],
      result: task.result,
      createdAt: task.createdAt.toISOString(),
      completedAt: task.completedAt?.toISOString() ?? null,
      coalitionId: coalition?.id ?? null,
    };

    return NextResponse.json({ data: result } satisfies ApiResponse<TaskRecord>);
  } catch (err) {
    console.log(JSON.stringify({ event: "task.get.error", id, error: String(err) }));
    return NextResponse.json(
      { error: "Failed to fetch task" } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}
